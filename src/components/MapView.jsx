import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { PRESSURE_ZONES } from '../data/pressureZones'
import { PRESSURE_SENSORS } from '../data/pressureSensors'
import { PRESSURE_SENSOR_MAP_DATA } from '../data/pressureSensorData'
import { BURST_EVENTS } from '../data/burstEvents'
import { getNeighborhoodRiskData, saveNeighborhoodRiskData } from '../data/neighborhoodRiskData'
import { getWaterMainsData, saveWaterMainsData } from '../data/waterMainsData'
import { usePanelContext } from '../contexts/PanelContext'
import PressureSensorTooltip from './tooltips/PressureSensorTooltip'

const MAPTILER_API_KEY = 'X1kjwlVN29N1UZItdixx'

// Helper function to get color for meter status
function getStatusColor(status) {
  switch(status) {
    case 'critical': return 'rgb(220, 38, 38)'
    case 'warning': return 'rgb(251, 146, 60)'
    case 'normal': return 'rgb(59, 130, 246)'
    default: return 'rgb(156, 163, 175)'
  }
}

// Lighter background colors for pressure sensor circular badge (Figma design)
function getPressureSensorBgColor(status) {
  switch(status) {
    case 'critical': return '#EE8080'
    case 'warning': return '#F5B87A'
    case 'normal': return '#7BA3F5'
    default: return '#9CA3AF'
  }
}

// Helper function to get meter data with saved positions applied
function getMergedSensorData() {
  try {
    const savedPositions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
    
    // If no saved positions, return original data
    if (Object.keys(savedPositions).length === 0) {
      return PRESSURE_SENSORS
    }
    
    // Create a copy and apply saved positions
    const mergedData = {
      ...PRESSURE_SENSORS,
      features: PRESSURE_SENSORS.features.map(feature => {
        if (savedPositions[feature.id]) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: savedPositions[feature.id].coordinates
            }
          }
        }
        return feature
      })
    }
    
    return mergedData
  } catch (error) {
    console.error('Error loading saved meter positions:', error)
    return PRESSURE_SENSORS
  }
}

// Helper function to get pressure sensor (gauge) data with saved positions applied
function getMergedPressureSensorMapData() {
  try {
    const savedPositions = JSON.parse(localStorage.getItem('pressureSensorPositions') || '{}')
    if (Object.keys(savedPositions).length === 0) return PRESSURE_SENSOR_MAP_DATA
    return {
      ...PRESSURE_SENSOR_MAP_DATA,
      features: PRESSURE_SENSOR_MAP_DATA.features.map((feature) => {
        if (savedPositions[feature.id]) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: savedPositions[feature.id].coordinates,
            },
          }
        }
        return feature
      }),
    }
  } catch (error) {
    console.error('Error loading saved pressure sensor positions:', error)
    return PRESSURE_SENSOR_MAP_DATA
  }
}

// MapView component with pressure zone visualization
// Neighborhood boundary data: © City of St. Louis, provided by SLU OpenGIS (CC-BY-4.0)
// https://github.com/slu-openGIS/STL_BOUNDARY_Nhood
export default function MapView() {
  const { 
    pressureZonesVisible, 
    activeRiskLevels, 
    pressureSensorsVisible,
    activeSensorStatuses,
    pressureSensorsMapVisible,
    activePressureSensorStatuses,
    pressureSensorEditMode,
    burstEventsVisible,
    burstImplementationComplete,
    waterMainsVisible,
    waterMainsDrawMode,
    setWaterMainsDrawMode,
    waterMainsDrawLevel,
    completeWaterMainRequest,
    requestCompleteWaterMain,
    setWaterMainDrawPointCount,
    waterMainsEditMode,
    selectedWaterMainId,
    setWaterMainsEditMode,
    deleteWaterMainId,
    sensorEditMode,
    burstEditMode,
    pressureZoneEditMode,
    neighborhoodsRiskVisible,
    neighborhoodRiskDrawMode,
    setNeighborhoodRiskDrawMode,
    neighborhoodRiskDrawLevel,
    completeNeighborhoodRiskPolygonRequest,
    requestCompleteNeighborhoodRiskPolygon,
    setNeighborhoodDrawPointCount,
    neighborhoodRiskEditMode,
    selectedNeighborhoodRiskPolygonId,
    setNeighborhoodRiskEditMode,
    deleteNeighborhoodRiskPolygonId,
    burstGradientParams,
    setSelectedZone, 
    setPressureZoneVisible,
    setSelectedSensor,
    addWaterMain,
    mapZoomRequest,
    sendEventToCopilot
  } = usePanelContext()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const burstPopup = useRef(null)
  const waterMainPopup = useRef(null)
  const burstMarkersRef = useRef([])
  const sensorMarkers = useRef([])
  const polygonVertexMarkers = useRef([])
  const [isDraggingSensor, setIsDraggingSensor] = useState(false)
  const markerClickedRef = useRef(false)
  const neighborhoodRiskDrawModeRef = useRef(false)
  const neighborhoodDrawPointsRef = useRef([])
  const neighborhoodRiskEditVertexMarkers = useRef([])
  const [neighborhoodDrawPoints, setNeighborhoodDrawPoints] = useState([])
  
  const waterMainsDrawModeRef = useRef(false)
  const waterMainDrawPointsRef = useRef([])
  const [waterMainDrawPoints, setWaterMainDrawPoints] = useState([])
  const pressureSensorMarkersRef = useRef([])
  const [hoveredPressureSensor, setHoveredPressureSensor] = useState(null)
  const [pressureSensorTooltipPos, setPressureSensorTooltipPos] = useState(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`,
      center: [-90.1994, 38.6270], // St. Louis, MO
      zoom: 11,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: true,
      customAttribution: 'Neighborhood boundaries © City of St. Louis / SLU OpenGIS'
    })

    // Add minimal zoom controls (no compass)
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        showZoom: true,
        visualizePitch: false
      }),
      'top-right'
    )

    // Wait for map to load before adding layers
    map.current.on('load', () => {
      console.log('🗺️ Map loaded, adding pressure zones...')
      console.log('📊 Pressure zones data:', PRESSURE_ZONES)
      console.log('📊 Number of features:', PRESSURE_ZONES.features.length)
      console.log('📊 Feature types:', PRESSURE_ZONES.features.map(f => `${f.properties.name} (${f.properties.riskLevel})`))
      
      try {
        // Add pressure zones source
        map.current.addSource('pressure-zones', {
          type: 'geojson',
          data: getMergedPressureZoneData()
        })
        console.log('✅ Pressure zones source added with saved polygon data')
        
        // Check source
        const source = map.current.getSource('pressure-zones')
        console.log('✅ Source exists:', !!source)

        // Add fill layer for polygons
        map.current.addLayer({
          id: 'pressure-zones-fill',
          type: 'fill',
          source: 'pressure-zones',
          paint: {
            'fill-color': [
              'match',
              ['get', 'riskLevel'],
              'high', 'rgba(212, 51, 59, 0.4)',    // Red
              'medium', 'rgba(241, 167, 40, 0.4)', // Orange
              'low', 'rgba(127, 190, 72, 0.4)',    // Green
              'rgba(158, 158, 158, 0.2)'           // Unknown/default
            ],
            'fill-opacity': 0.6
          },
          layout: {
            visibility: pressureZonesVisible ? 'visible' : 'none'
          }
        })
        console.log('Pressure zones fill layer added')

        // Add border layer for polygons
        map.current.addLayer({
          id: 'pressure-zones-border',
          type: 'line',
          source: 'pressure-zones',
          paint: {
            'line-color': [
              'match',
              ['get', 'riskLevel'],
              'high', 'rgb(212, 51, 59)',
              'medium', 'rgb(241, 167, 40)',
              'low', 'rgb(127, 190, 72)',
              'rgb(158, 158, 158)'
            ],
            'line-width': 2,
            'line-opacity': 0.8
          },
          layout: {
            visibility: pressureZonesVisible ? 'visible' : 'none'
          }
        })
        console.log('✅ Pressure zones border layer added')
        
        // Neighborhood risk polygons (multi-polygon, same risk levels/colors)
        map.current.addSource('neighborhood-risk', {
          type: 'geojson',
          data: getNeighborhoodRiskData()
        })
        map.current.addLayer({
          id: 'neighborhood-risk-fill',
          type: 'fill',
          source: 'neighborhood-risk',
          paint: {
            'fill-color': [
              'match',
              ['get', 'riskLevel'],
              'high', 'rgba(212, 51, 59, 0.4)',
              'medium', 'rgba(241, 167, 40, 0.4)',
              'low', 'rgba(127, 190, 72, 0.4)',
              'rgba(158, 158, 158, 0.2)'
            ],
            'fill-opacity': 0.6
          },
          layout: { visibility: 'none' }
        })
        map.current.addLayer({
          id: 'neighborhood-risk-border',
          type: 'line',
          source: 'neighborhood-risk',
          paint: {
            'line-color': [
              'match',
              ['get', 'riskLevel'],
              'high', 'rgb(212, 51, 59)',
              'medium', 'rgb(241, 167, 40)',
              'low', 'rgb(127, 190, 72)',
              'rgb(158, 158, 158)'
            ],
            'line-width': 2,
            'line-opacity': 0.8
          },
          layout: { visibility: 'none' }
        })
        
        // Temporary draw preview for neighborhood risk (visible only in draw mode)
        map.current.addSource('neighborhood-risk-draw', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        })
        map.current.addLayer({
          id: 'neighborhood-risk-draw-fill',
          type: 'fill',
          source: 'neighborhood-risk-draw',
          paint: {
            'fill-color': 'rgba(147, 197, 253, 0.35)',
            'fill-outline-color': 'rgb(96, 165, 250)'
          },
          layout: { visibility: 'none' }
        })
        map.current.addLayer({
          id: 'neighborhood-risk-draw-line',
          type: 'line',
          source: 'neighborhood-risk-draw',
          paint: {
            'line-color': 'rgb(96, 165, 250)',
            'line-width': 2,
            'line-dasharray': [2, 1]
          },
          layout: { visibility: 'none' }
        })
        
        // Water mains source and layers
        map.current.addSource('water-mains', {
          type: 'geojson',
          data: getWaterMainsData()
        })
        
        // Single water mains layer with risk-based styling
        map.current.addLayer({
          id: 'water-mains-lines',
          type: 'line',
          source: 'water-mains',
          paint: {
            'line-color': [
              'match',
              ['get', 'riskLevel'],
              'high', 'rgb(212, 51, 59)',
              'medium', 'rgb(241, 167, 40)',
              'low', 'rgb(127, 190, 72)',
              'rgb(59, 130, 246)'
            ],
            'line-width': 3,
            'line-opacity': 0.85
          },
          layout: { visibility: 'none' }
        })
        
        // Draw preview source and layers (for drawing new water mains)
        map.current.addSource('water-mains-draw', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        })
        
        map.current.addLayer({
          id: 'water-mains-draw-line',
          type: 'line',
          source: 'water-mains-draw',
          paint: {
            'line-color': 'rgb(96, 165, 250)',
            'line-width': 3,
            'line-dasharray': [2, 1]
          },
          layout: { visibility: 'none' }
        })
        
        // Draw preview vertices (small circles at each point)
        map.current.addLayer({
          id: 'water-mains-draw-vertices',
          type: 'circle',
          source: 'water-mains-draw',
          paint: {
            'circle-radius': 4,
            'circle-color': 'rgb(96, 165, 250)',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white'
          },
          layout: { visibility: 'none' }
        })
        
        console.log('✅ Water mains layers added')
        
        // Log layer info
        console.log('✅ Fill layer exists:', !!map.current.getLayer('pressure-zones-fill'))
        console.log('✅ Border layer exists:', !!map.current.getLayer('pressure-zones-border'))
        
        // Add click handler for pressure zones
        map.current.on('click', 'pressure-zones-fill', (e) => {
          // Check if we just clicked on a marker (meter or burst) - if so, ignore the pressure zone click
          if (markerClickedRef.current) {
            console.log('🖱️ Clicked on a marker, ignoring pressure zone click')
            markerClickedRef.current = false
            return
          }
          // When drawing neighborhood risk polygon, map click is for adding vertices - don't open zone panel
          if (neighborhoodRiskDrawModeRef.current) {
            return
          }
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            console.log('🖱️ Clicked pressure zone:', feature.properties)
            
            // Set the selected zone with additional data for the dialog
            setSelectedZone({
              ...feature.properties,
              redPipePercent: feature.properties.redPipePercent || 7.67,
              complaints: feature.properties.complaints || 67
            })
            
            // Show the pressure zone dialog
            setPressureZoneVisible(true)
            
            // Zoom to the clicked polygon
            const coordinates = []
            if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach(polygon => {
                polygon.forEach(ring => {
                  ring.forEach(coord => coordinates.push(coord))
                })
              })
            } else if (feature.geometry.type === 'Polygon') {
              feature.geometry.coordinates.forEach(ring => {
                ring.forEach(coord => coordinates.push(coord))
              })
            }
            
            if (coordinates.length > 0) {
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord)
              }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]))
              
              console.log('🎯 Zooming to clicked pressure zone')
              map.current.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1000 })
            }
          }
        })
        
        // Change cursor to pointer when hovering over zones
        map.current.on('mouseenter', 'pressure-zones-fill', () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        
        map.current.on('mouseleave', 'pressure-zones-fill', () => {
          map.current.getCanvas().style.cursor = ''
        })
        
        console.log('✅ Click handlers added to pressure zones')
        
        // Add pressure sensors source with saved positions applied
        map.current.addSource('pressure-sensors', {
          type: 'geojson',
          data: getMergedSensorData()
        })
        console.log('✅ Network meters source added with saved positions')
        
        // Add network meter circles layer
        map.current.addLayer({
          id: 'pressure-sensors-circles',
          type: 'circle',
          source: 'pressure-sensors',
          paint: {
            'circle-radius': 6.4,
            'circle-color': [
              'match',
              ['get', 'status'],
              'critical', 'rgb(220, 38, 38)',  // Red
              'warning', 'rgb(251, 146, 60)',   // Orange
              'normal', 'rgb(59, 130, 246)',    // Blue
              'rgb(156, 163, 175)'              // Gray default
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': [
              'match',
              ['get', 'status'],
              'critical', 'rgb(153, 27, 27)',   // Darker red
              'warning', 'rgb(234, 88, 12)',    // Darker orange
              'normal', 'rgb(29, 78, 216)',     // Darker blue
              'rgb(75, 85, 99)'                 // Gray default
            ],
            'circle-stroke-opacity': 0.8,
            'circle-opacity': 0.7
          },
          layout: {
            visibility: 'none' // Start hidden, controlled by toggle
          }
        })
        console.log('✅ Pressure sensors layer added')
        
        // Burst events are rendered as custom DOM markers (see burst visibility useEffect)
        
        // Add click handler for network meters (show panel on click)
        map.current.on('click', 'pressure-sensors-circles', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const properties = feature.properties
            
            // Set the selected meter in context to open the panel
            setSelectedSensor({
              sensorId: properties.sensorId,
              name: properties.name,
              status: properties.status,
              pressure: properties.pressure,
              lastReading: properties.lastReading,
              location: properties.location
            })
            
            console.log('✅ Meter panel opened for:', properties.sensorId)
          }
        })
        
        // Change cursor on meter hover
        map.current.on('mouseenter', 'pressure-sensors-circles', () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        
        map.current.on('mouseleave', 'pressure-sensors-circles', () => {
          map.current.getCanvas().style.cursor = ''
        })
        
        console.log('✅ Network meter click handlers added')
        
        // Add hover handler for water mains
        map.current.on('mouseenter', 'water-mains-lines', (e) => {
          // Check if mouse is over a sensor or burst marker (DOM elements with higher z-index)
          const elementUnderMouse = document.elementFromPoint(e.originalEvent.clientX, e.originalEvent.clientY)
          const isOverMarker = elementUnderMouse?.closest('.sensor-marker, .pressure-sensor-marker, .burst-marker-center, .burst-marker-center-wrapper, .burst-event-gradient-wrapper, .polygon-vertex-marker, .polygon-midpoint-marker')
          
          if (isOverMarker) {
            // Don't show tooltip if hovering over a higher-priority element
            return
          }
          
          map.current.getCanvas().style.cursor = 'pointer'
          
          // Remove any existing water main popup
          if (waterMainPopup.current) {
            waterMainPopup.current.remove()
            waterMainPopup.current = null
          }
          
          if (e.features && e.features.length > 0) {
            const waterMain = e.features[0]
            const props = waterMain.properties
            
            // Generate dynamic data based on risk level
            const riskLevel = props.riskLevel || 'medium'
            
            // Generate pipe ID in format LN######
            let idNumber = '000000'
            if (waterMain.id) {
              const parts = waterMain.id.split('-')
              if (parts.length > 0) {
                const lastPart = parts[parts.length - 1]
                idNumber = lastPart.padStart(6, '0').slice(-6)
              }
            }
            const pipeId = props.pipeId || `LN${idNumber}`
            
            const status = riskLevel === 'high' ? 'Critical' : riskLevel === 'medium' ? 'Warning' : 'Normal'
            const avgPSI = props.avgPSI || (riskLevel === 'high' ? 45 : riskLevel === 'medium' ? 68 : 85)
            const diameter = props.diameter || (riskLevel === 'high' ? 12 : riskLevel === 'medium' ? 10 : 8)
            
            const statusColor = riskLevel === 'high' ? 'rgb(220, 38, 38)' : 
                               riskLevel === 'medium' ? 'rgb(251, 146, 60)' : 
                               'rgb(127, 190, 72)'
            
            const popupContent = `
              <div style="font-family: var(--font-family-primary); color: var(--color-gray-100);">
                <div style="font-weight: var(--font-weight-bold); color: var(--color-blue-400); margin-bottom: 8px; font-size: 13px;">
                  Water Main
                </div>
                <div style="font-size: var(--text-xs); margin-bottom: 4px; color: var(--color-gray-300);">
                  <span style="font-weight: var(--font-weight-semibold);">Pipe ID:</span> ${pipeId}
                </div>
                <div style="font-size: var(--text-xs); margin-bottom: 4px; color: var(--color-gray-300);">
                  <span style="font-weight: var(--font-weight-semibold);">Status:</span> 
                  <span style="color: ${statusColor};">${status}</span>
                </div>
                <div style="font-size: var(--text-xs); margin-bottom: 4px; color: var(--color-gray-300);">
                  <span style="font-weight: var(--font-weight-semibold);">AVG PSI:</span> ${avgPSI}
                </div>
                <div style="font-size: var(--text-xs); margin-bottom: 4px; color: var(--color-gray-300);">
                  <span style="font-weight: var(--font-weight-semibold);">Diameter:</span> ${diameter}"
                </div>
              </div>
            `
            
            waterMainPopup.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              maxWidth: '220px'
            })
              .setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current)
          }
        })
        
        map.current.on('mouseleave', 'water-mains-lines', () => {
          map.current.getCanvas().style.cursor = ''
          if (waterMainPopup.current) {
            waterMainPopup.current.remove()
            waterMainPopup.current = null
          }
        })
        
        // Add click handler to open details panel
        map.current.on('click', 'water-mains-lines', (e) => {
          if (waterMainsDrawModeRef.current) return
          
          if (e.features && e.features.length > 0) {
            addWaterMain(e.features[0])
          }
        })
        
        // Hover effects for water mains
        map.current.on('mouseenter', 'water-mains-lines', () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        
        map.current.on('mouseleave', 'water-mains-lines', () => {
          map.current.getCanvas().style.cursor = ''
        })
        
        console.log('✅ Water mains click handlers added')
        
        // Mark map as loaded so effects can run
        setMapLoaded(true)
        console.log('✅ Map fully loaded with layers')
      } catch (error) {
        console.error('❌ Error adding pressure zones layers:', error)
      }
    })

    // Cleanup on unmount
    return () => {
      // Remove burst popup if it exists
      if (burstPopup.current) {
        burstPopup.current.remove()
        burstPopup.current = null
      }
      
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      setMapLoaded(false)
    }
  }, [])

  // Handle custom event from burst popup to send context to Copilot
  useEffect(() => {
    const handleAddBurstContext = () => {
      const context = {
        eventName: 'Major Water Main Burst - Downtown District',
        dateTimeRange: 'Aug 27, 2023, 8/27/2023, 10:00 AM - 8/27/2023, 2:15 PM',
        affectedPipes: 156,
        threshold: '< 68 PSI',
        customersAffected: 1404,
        severity: [
          { label: 'Critical', count: 45, color: 'red' },
          { label: 'Severe', count: 111, color: 'orange' },
        ],
        recommendation: {
          title: 'Emergency Isolation',
          description: 'Immediate Isolate of Zone 5 required to limit water loss. Dispatch Crew Alpha with emergency evacuation equipment and coordinate lane/road closures with City of St Louis Street Department and MoDOT',
        },
      }
      sendEventToCopilot(context)
    }

    window.addEventListener('addBurstContextToCopilot', handleAddBurstContext)
    
    return () => {
      window.removeEventListener('addBurstContextToCopilot', handleAddBurstContext)
    }
  }, [sendEventToCopilot])

  // Toggle layer visibility based on pressureZonesVisible state
  useEffect(() => {
    console.log('👁️ Visibility effect running:', { 
      mapExists: !!map.current, 
      loaded: map.current?.loaded(),
      mapLoaded,
      pressureZonesVisible 
    })
    
    if (!mapLoaded || !map.current || !map.current.loaded()) {
      console.log('👁️ Skipping - map not ready yet')
      return
    }
    
    const visibility = pressureZonesVisible ? 'visible' : 'none'
    console.log('👁️ Setting visibility to:', visibility)
    
    try {
      if (map.current.getLayer('pressure-zones-fill')) {
        map.current.setLayoutProperty('pressure-zones-fill', 'visibility', visibility)
        console.log('✅ Fill layer visibility set to:', visibility)
      } else {
        console.warn('⚠️ pressure-zones-fill layer not found')
      }
      if (map.current.getLayer('pressure-zones-border')) {
        map.current.setLayoutProperty('pressure-zones-border', 'visibility', visibility)
        console.log('✅ Border layer visibility set to:', visibility)
      } else {
        console.warn('⚠️ pressure-zones-border layer not found')
      }
    } catch (error) {
      console.error('❌ Error toggling pressure zones visibility:', error)
    }
  }, [pressureZonesVisible, mapLoaded])

  // Toggle water mains layer visibility
  useEffect(() => {
    console.log('🔍 Water mains visibility effect triggered:', { 
      waterMainsVisible, 
      mapExists: !!map.current,
      mapIsLoaded: map.current?.loaded() 
    })
    
    if (!map.current) {
      console.log('⚠️ Map not initialized yet')
      return
    }
    
    const visibility = waterMainsVisible ? 'visible' : 'none'
    console.log('👁️ Setting water-mains visibility to:', visibility)
    
    try {
      const layer = map.current.getLayer('water-mains-lines')
      console.log('🔍 water-mains-lines layer exists:', !!layer)
      
      if (layer) {
        map.current.setLayoutProperty('water-mains-lines', 'visibility', visibility)
        console.log('✅ Water mains layer visibility set to:', visibility)
        
        // Verify it was set
        const currentVisibility = map.current.getLayoutProperty('water-mains-lines', 'visibility')
        console.log('🔍 Current visibility after setting:', currentVisibility)
      } else {
        console.warn('⚠️ water-mains-lines layer not found! Will retry when layer is added.')
      }
    } catch (error) {
      console.error('❌ Error toggling water mains visibility:', error)
    }
  }, [waterMainsVisible])

  // Toggle neighborhood risk layer visibility
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.loaded()) return
    const visibility = neighborhoodsRiskVisible ? 'visible' : 'none'
    try {
      if (map.current.getLayer('neighborhood-risk-fill')) {
        map.current.setLayoutProperty('neighborhood-risk-fill', 'visibility', visibility)
      }
      if (map.current.getLayer('neighborhood-risk-border')) {
        map.current.setLayoutProperty('neighborhood-risk-border', 'visibility', visibility)
      }
    } catch (error) {
      console.error('Error toggling neighborhood risk visibility:', error)
    }
  }, [neighborhoodsRiskVisible, mapLoaded])

  // Neighborhood risk draw mode: map click adds vertex; double-click or Enter completes
  useEffect(() => {
    neighborhoodRiskDrawModeRef.current = neighborhoodRiskDrawMode
    if (!mapLoaded || !map.current) return
    if (!neighborhoodRiskDrawMode) {
      setNeighborhoodDrawPoints([])
      map.current.getCanvas().style.cursor = ''
      try {
        if (map.current.getSource('neighborhood-risk-draw')) {
          map.current.getSource('neighborhood-risk-draw').setData({ type: 'FeatureCollection', features: [] })
        }
        if (map.current.getLayer('neighborhood-risk-draw-fill')) {
          map.current.setLayoutProperty('neighborhood-risk-draw-fill', 'visibility', 'none')
        }
        if (map.current.getLayer('neighborhood-risk-draw-line')) {
          map.current.setLayoutProperty('neighborhood-risk-draw-line', 'visibility', 'none')
        }
      } catch (e) { /* ignore */ }
      return
    }
    map.current.getCanvas().style.cursor = 'crosshair'
    const onMapClick = (e) => {
      if (e.originalEvent.detail === 2 && neighborhoodDrawPointsRef.current.length >= 3) {
        requestCompleteNeighborhoodRiskPolygon()
        return
      }
      setNeighborhoodDrawPoints(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]])
    }
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && neighborhoodDrawPointsRef.current.length >= 3) {
        e.preventDefault()
        requestCompleteNeighborhoodRiskPolygon()
      }
      if (e.key === 'Escape') {
        setNeighborhoodRiskDrawMode(false)
      }
    }
    map.current.on('click', onMapClick)
    window.addEventListener('keydown', onKeyDown)
    try {
      if (map.current.getLayer('neighborhood-risk-draw-fill')) {
        map.current.setLayoutProperty('neighborhood-risk-draw-fill', 'visibility', 'visible')
      }
      if (map.current.getLayer('neighborhood-risk-draw-line')) {
        map.current.setLayoutProperty('neighborhood-risk-draw-line', 'visibility', 'visible')
      }
    } catch (e) { /* ignore */ }
    return () => {
      map.current.off('click', onMapClick)
      window.removeEventListener('keydown', onKeyDown)
      map.current.getCanvas().style.cursor = ''
    }
  }, [neighborhoodRiskDrawMode, mapLoaded, requestCompleteNeighborhoodRiskPolygon])

  // Keep ref in sync for click handler; sync point count to context for panel
  useEffect(() => {
    neighborhoodDrawPointsRef.current = neighborhoodDrawPoints
    setNeighborhoodDrawPointCount(neighborhoodDrawPoints.length)
  }, [neighborhoodDrawPoints, setNeighborhoodDrawPointCount])

  // Update draw preview source when points change
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.getSource('neighborhood-risk-draw')) return
    const points = neighborhoodDrawPoints
    let features = []
    if (points.length >= 3) {
      const ring = [...points, points[0]]
      features = [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] }
      }]
    } else if (points.length === 2) {
      features = [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: points }
      }]
    }
    map.current.getSource('neighborhood-risk-draw').setData({ type: 'FeatureCollection', features })
  }, [neighborhoodDrawPoints, mapLoaded])

  // Water mains draw mode: map click adds point; double-click or Enter completes
  useEffect(() => {
    console.log('Draw mode effect triggered. Mode:', waterMainsDrawMode, 'Map loaded:', mapLoaded)
    waterMainsDrawModeRef.current = waterMainsDrawMode
    if (!mapLoaded || !map.current) return
    if (!waterMainsDrawMode) {
      console.log('Exiting draw mode - clearing points')
      setWaterMainDrawPoints([])
      waterMainDrawPointsRef.current = []
      map.current.getCanvas().style.cursor = ''
      try {
        if (map.current.getSource('water-mains-draw')) {
          map.current.getSource('water-mains-draw').setData({ type: 'FeatureCollection', features: [] })
        }
        if (map.current.getLayer('water-mains-draw-line')) {
          map.current.setLayoutProperty('water-mains-draw-line', 'visibility', 'none')
        }
        if (map.current.getLayer('water-mains-draw-vertices')) {
          map.current.setLayoutProperty('water-mains-draw-vertices', 'visibility', 'none')
        }
      } catch (e) { /* ignore */ }
      return
    }
    console.log('Entering draw mode - setting up handlers')
    map.current.getCanvas().style.cursor = 'crosshair'
    const onMapClick = (e) => {
      const currentPointCount = waterMainDrawPointsRef.current.length
      
      // Double-click completes the line only if you have at least 2 points
      // We detect double-click by checking detail === 2
      if (e.originalEvent.detail === 2 && currentPointCount >= 2) {
        console.log('Double-click detected, completing water main with', currentPointCount, 'points')
        requestCompleteWaterMain()
        return
      }
      // Single click adds a new point (ignore if it was part of a double-click)
      if (e.originalEvent.detail === 1) {
        const newPoint = [e.lngLat.lng, e.lngLat.lat]
        console.log('Single click, adding point. Current count before add:', currentPointCount)
        setWaterMainDrawPoints(prev => {
          const updated = [...prev, newPoint]
          // Update ref immediately so it's available for the next click
          waterMainDrawPointsRef.current = updated
          console.log('Points updated. New count:', updated.length)
          return updated
        })
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && waterMainDrawPointsRef.current.length >= 2) {
        e.preventDefault()
        requestCompleteWaterMain()
      }
      if (e.key === 'Escape') {
        setWaterMainsDrawMode(false)
      }
    }
    map.current.on('click', onMapClick)
    window.addEventListener('keydown', onKeyDown)
    try {
      if (map.current.getLayer('water-mains-draw-line')) {
        map.current.setLayoutProperty('water-mains-draw-line', 'visibility', 'visible')
      }
      if (map.current.getLayer('water-mains-draw-vertices')) {
        map.current.setLayoutProperty('water-mains-draw-vertices', 'visibility', 'visible')
      }
    } catch (e) { /* ignore */ }
    return () => {
      if (map.current) {
        map.current.off('click', onMapClick)
        map.current.getCanvas().style.cursor = ''
      }
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [waterMainsDrawMode, mapLoaded, requestCompleteWaterMain])

  // Keep ref in sync for click handler; sync point count to context for panel
  useEffect(() => {
    waterMainDrawPointsRef.current = waterMainDrawPoints
    setWaterMainDrawPointCount(waterMainDrawPoints.length)
  }, [waterMainDrawPoints, setWaterMainDrawPointCount])

  // Update draw preview source when points change
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.getSource('water-mains-draw')) return
    const points = waterMainDrawPoints
    let features = []
    if (points.length >= 2) {
      // Show line preview
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: points }
      })
      // Show vertex points
      points.forEach(coord => {
        features.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: coord }
        })
      })
    } else if (points.length === 1) {
      // Show single point
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: points[0] }
      })
    }
    map.current.getSource('water-mains-draw').setData({ type: 'FeatureCollection', features })
  }, [waterMainDrawPoints, mapLoaded])

  // Complete water main when requested from panel
  useEffect(() => {
    console.log('Complete water main effect triggered. Request:', completeWaterMainRequest)
    if (completeWaterMainRequest === 0) return
    
    // Read current points from ref (which is always up to date)
    const currentPoints = waterMainDrawPointsRef.current
    console.log('Points at completion time:', currentPoints.length)
    
    if (currentPoints.length < 2) {
      console.log('Not enough points, skipping completion')
      return
    }
    
    const feature = {
      type: 'Feature',
      id: `water-main-${Date.now()}`,
      properties: { riskLevel: waterMainsDrawLevel },
      geometry: { type: 'LineString', coordinates: currentPoints }
    }
    const collection = getWaterMainsData()
    const newCollection = {
      ...collection,
      features: [...collection.features, feature]
    }
    saveWaterMainsData(newCollection)
    if (map.current && map.current.getSource('water-mains')) {
      map.current.getSource('water-mains').setData(newCollection)
    }
    console.log('Water main saved, clearing points and exiting draw mode')
    // Clear points and ref
    setWaterMainDrawPoints([])
    waterMainDrawPointsRef.current = []
    // Exit draw mode after a short delay
    setTimeout(() => {
      console.log('Exiting draw mode')
      setWaterMainsDrawMode(false)
    }, 50)
  }, [completeWaterMainRequest, waterMainsDrawLevel])

  // Delete water main when requested
  useEffect(() => {
    if (!deleteWaterMainId) return
    const collection = getWaterMainsData()
    const newCollection = {
      ...collection,
      features: collection.features.filter(f => f.id !== deleteWaterMainId)
    }
    saveWaterMainsData(newCollection)
    if (map.current && map.current.getSource('water-mains')) {
      map.current.getSource('water-mains').setData(newCollection)
    }
  }, [deleteWaterMainId])

  // Complete neighborhood risk polygon when requested from panel
  useEffect(() => {
    if (completeNeighborhoodRiskPolygonRequest === 0) return
    if (neighborhoodDrawPoints.length < 3) return
    const points = neighborhoodDrawPoints
    const ring = [...points, points[0]]
    const feature = {
      type: 'Feature',
      id: `neighborhood-risk-${Date.now()}`,
      properties: { riskLevel: neighborhoodRiskDrawLevel },
      geometry: { type: 'Polygon', coordinates: [ring] }
    }
    const collection = getNeighborhoodRiskData()
    const newCollection = {
      ...collection,
      features: [...collection.features, feature]
    }
    saveNeighborhoodRiskData(newCollection)
    if (map.current && map.current.getSource('neighborhood-risk')) {
      map.current.getSource('neighborhood-risk').setData(newCollection)
    }
    setNeighborhoodDrawPoints([])
    setNeighborhoodRiskDrawMode(false)
  }, [completeNeighborhoodRiskPolygonRequest])

  // Delete neighborhood risk polygon when requested
  useEffect(() => {
    if (!deleteNeighborhoodRiskPolygonId) return
    const collection = getNeighborhoodRiskData()
    const newCollection = {
      ...collection,
      features: collection.features.filter(f => f.id !== deleteNeighborhoodRiskPolygonId)
    }
    saveNeighborhoodRiskData(newCollection)
    if (map.current && map.current.getSource('neighborhood-risk')) {
      map.current.getSource('neighborhood-risk').setData(newCollection)
    }
  }, [deleteNeighborhoodRiskPolygonId])

  // Delete neighborhood risk polygon when requested
  useEffect(() => {
    if (!deleteNeighborhoodRiskPolygonId) return
    const collection = getNeighborhoodRiskData()
    const newCollection = {
      ...collection,
      features: collection.features.filter(f => f.id !== deleteNeighborhoodRiskPolygonId)
    }
    saveNeighborhoodRiskData(newCollection)
    if (map.current && map.current.getSource('neighborhood-risk')) {
      map.current.getSource('neighborhood-risk').setData(newCollection)
    }
    if (selectedNeighborhoodRiskPolygonId === deleteNeighborhoodRiskPolygonId) {
      setNeighborhoodRiskEditMode(false)
    }
  }, [deleteNeighborhoodRiskPolygonId, selectedNeighborhoodRiskPolygonId, setNeighborhoodRiskEditMode])

  // Edit mode for neighborhood risk polygon: show vertex markers (similar to pressure zone edit)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    neighborhoodRiskEditVertexMarkers.current.forEach(marker => marker.remove())
    neighborhoodRiskEditVertexMarkers.current = []
    
    if (!neighborhoodRiskEditMode || !selectedNeighborhoodRiskPolygonId) return
    
    const collection = getNeighborhoodRiskData()
    const feature = collection.features.find(f => f.id === selectedNeighborhoodRiskPolygonId)
    if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') return
    
    const coordinates = feature.geometry.coordinates[0]
    const vertices = coordinates.slice(0, -1)
    
    const createMarkers = () => {
      neighborhoodRiskEditVertexMarkers.current.forEach(marker => marker.remove())
      neighborhoodRiskEditVertexMarkers.current = []
      
      vertices.forEach((coord, index) => {
        const el = document.createElement('div')
        el.className = 'polygon-vertex-marker'
        el.title = `Vertex ${index + 1} (double-click to delete)`
        el.dataset.type = 'vertex'
        el.dataset.index = index
        
        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: 'center'
        })
          .setLngLat(coord)
          .addTo(map.current)
        
        marker.on('drag', () => {
          updatePolygonGeometry()
          updateMidpoints()
        })
        
        marker.on('dragend', () => {
          saveCurrentPolygon()
        })
        
        el.addEventListener('dblclick', (e) => {
          e.stopPropagation()
          const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(
            m => m.getElement().dataset.type === 'vertex'
          )
          if (vertexMarkers.length > 3) {
            deleteVertexAtIndex(index)
          }
        })
        
        neighborhoodRiskEditVertexMarkers.current.push(marker)
      })
      
      createMidpoints()
    }
    
    const createMidpoints = () => {
      neighborhoodRiskEditVertexMarkers.current
        .filter(m => m.getElement().dataset.type === 'midpoint')
        .forEach(m => {
          m.remove()
          const index = neighborhoodRiskEditVertexMarkers.current.indexOf(m)
          if (index > -1) neighborhoodRiskEditVertexMarkers.current.splice(index, 1)
        })
      
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(
        m => m.getElement().dataset.type === 'vertex'
      )
      
      vertexMarkers.forEach((marker, index) => {
        const nextMarker = vertexMarkers[(index + 1) % vertexMarkers.length]
        const coord1 = marker.getLngLat()
        const coord2 = nextMarker.getLngLat()
        const midpoint = [(coord1.lng + coord2.lng) / 2, (coord1.lat + coord2.lat) / 2]
        
        const el = document.createElement('div')
        el.className = 'polygon-midpoint-marker'
        el.title = 'Click to add vertex'
        el.dataset.type = 'midpoint'
        el.dataset.afterIndex = index
        
        const midpointMarker = new maplibregl.Marker({
          element: el,
          draggable: false,
          anchor: 'center'
        }).setLngLat(midpoint).addTo(map.current)
        
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const afterIndex = parseInt(el.dataset.afterIndex)
          addVertexAtIndex(afterIndex, midpoint)
        })
        
        neighborhoodRiskEditVertexMarkers.current.push(midpointMarker)
      })
    }
    
    const updateMidpoints = () => {
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'vertex')
      const midpointMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'midpoint')
      midpointMarkers.forEach((midpointMarker) => {
        const el = midpointMarker.getElement()
        const afterIndex = parseInt(el.dataset.afterIndex)
        const marker = vertexMarkers[afterIndex]
        const nextMarker = vertexMarkers[(afterIndex + 1) % vertexMarkers.length]
        if (marker && nextMarker) {
          const coord1 = marker.getLngLat()
          const coord2 = nextMarker.getLngLat()
          const midpoint = [(coord1.lng + coord2.lng) / 2, (coord1.lat + coord2.lat) / 2]
          midpointMarker.setLngLat(midpoint)
        }
      })
    }
    
    const deleteVertexAtIndex = (vertexIndex) => {
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'vertex')
      const currentCoordinates = vertexMarkers.map(m => {
        const lngLat = m.getLngLat()
        return [lngLat.lng, lngLat.lat]
      })
      currentCoordinates.splice(vertexIndex, 1)
      const ring = [...currentCoordinates, currentCoordinates[0]]
      const collection = getNeighborhoodRiskData()
      const newCollection = {
        ...collection,
        features: collection.features.map(f => 
          f.id === selectedNeighborhoodRiskPolygonId
            ? { ...f, geometry: { ...f.geometry, coordinates: [ring] } }
            : f
        )
      }
      saveNeighborhoodRiskData(newCollection)
      if (map.current.getSource('neighborhood-risk')) {
        map.current.getSource('neighborhood-risk').setData(newCollection)
      }
      createMarkers()
    }
    
    const addVertexAtIndex = (afterIndex, coordinates) => {
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'vertex')
      const currentCoordinates = vertexMarkers.map(m => {
        const lngLat = m.getLngLat()
        return [lngLat.lng, lngLat.lat]
      })
      currentCoordinates.splice(afterIndex + 1, 0, coordinates)
      const ring = [...currentCoordinates, currentCoordinates[0]]
      const collection = getNeighborhoodRiskData()
      const newCollection = {
        ...collection,
        features: collection.features.map(f => 
          f.id === selectedNeighborhoodRiskPolygonId
            ? { ...f, geometry: { ...f.geometry, coordinates: [ring] } }
            : f
        )
      }
      saveNeighborhoodRiskData(newCollection)
      if (map.current.getSource('neighborhood-risk')) {
        map.current.getSource('neighborhood-risk').setData(newCollection)
      }
      createMarkers()
    }
    
    const saveCurrentPolygon = () => {
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'vertex')
      const newCoordinates = vertexMarkers.map(m => {
        const lngLat = m.getLngLat()
        return [lngLat.lng, lngLat.lat]
      })
      const ring = [...newCoordinates, newCoordinates[0]]
      const collection = getNeighborhoodRiskData()
      const newCollection = {
        ...collection,
        features: collection.features.map(f => 
          f.id === selectedNeighborhoodRiskPolygonId
            ? { ...f, geometry: { ...f.geometry, coordinates: [ring] } }
            : f
        )
      }
      saveNeighborhoodRiskData(newCollection)
      if (map.current.getSource('neighborhood-risk')) {
        map.current.getSource('neighborhood-risk').setData(newCollection)
      }
    }
    
    const updatePolygonGeometry = () => {
      const vertexMarkers = neighborhoodRiskEditVertexMarkers.current.filter(m => m.getElement().dataset.type === 'vertex')
      const newCoordinates = vertexMarkers.map(m => {
        const lngLat = m.getLngLat()
        return [lngLat.lng, lngLat.lat]
      })
      const ring = [...newCoordinates, newCoordinates[0]]
      const collection = getNeighborhoodRiskData()
      const newCollection = {
        ...collection,
        features: collection.features.map(f => 
          f.id === selectedNeighborhoodRiskPolygonId
            ? { ...f, geometry: { ...f.geometry, coordinates: [ring] } }
            : f
        )
      }
      if (map.current.getSource('neighborhood-risk')) {
        map.current.getSource('neighborhood-risk').setData(newCollection)
      }
    }
    
    createMarkers()
    
    return () => {
      neighborhoodRiskEditVertexMarkers.current.forEach(marker => marker.remove())
      neighborhoodRiskEditVertexMarkers.current = []
    }
  }, [neighborhoodRiskEditMode, selectedNeighborhoodRiskPolygonId, mapLoaded])

  // Filter polygons by active risk levels
  useEffect(() => {
    console.log('🔍 Filter effect running:', { 
      mapExists: !!map.current, 
      loaded: map.current?.loaded(),
      mapLoaded,
      activeRiskLevels 
    })
    
    if (!mapLoaded || !map.current || !map.current.loaded()) {
      console.log('🔍 Skipping - map not ready yet')
      return
    }
    
    const visibleLevels = Object.entries(activeRiskLevels)
      .filter(([_, active]) => active)
      .map(([level]) => level)
    
    console.log('🔍 Visible levels:', visibleLevels)
    
    try {
      if (visibleLevels.length === 0) {
        // Hide all if no levels are active
        console.log('🔍 No risk levels active, hiding all')
        if (map.current.getLayer('pressure-zones-fill')) {
          map.current.setFilter('pressure-zones-fill', ['==', 'riskLevel', 'none'])
        }
        if (map.current.getLayer('pressure-zones-border')) {
          map.current.setFilter('pressure-zones-border', ['==', 'riskLevel', 'none'])
        }
        if (map.current.getLayer('neighborhood-risk-fill')) {
          map.current.setFilter('neighborhood-risk-fill', ['==', 'riskLevel', 'none'])
        }
        if (map.current.getLayer('neighborhood-risk-border')) {
          map.current.setFilter('neighborhood-risk-border', ['==', 'riskLevel', 'none'])
        }
      } else {
        // Show only selected risk levels
        console.log('🔍 Setting filter to show levels:', visibleLevels)
        if (map.current.getLayer('pressure-zones-fill')) {
          map.current.setFilter('pressure-zones-fill', ['in', ['get', 'riskLevel'], ['literal', visibleLevels]])
        }
        if (map.current.getLayer('pressure-zones-border')) {
          map.current.setFilter('pressure-zones-border', ['in', ['get', 'riskLevel'], ['literal', visibleLevels]])
        }
        if (map.current.getLayer('neighborhood-risk-fill')) {
          map.current.setFilter('neighborhood-risk-fill', ['in', ['get', 'riskLevel'], ['literal', visibleLevels]])
        }
        if (map.current.getLayer('neighborhood-risk-border')) {
          map.current.setFilter('neighborhood-risk-border', ['in', ['get', 'riskLevel'], ['literal', visibleLevels]])
        }
      }
    } catch (error) {
      console.error('❌ Error filtering pressure zones by risk level:', error)
    }
  }, [activeRiskLevels, mapLoaded])

  // Meter visibility is now handled by the meter markers effect above
  // (markers are created/removed based on pressureSensorsVisible)

  // Burst position management (localStorage)
  const getBurstPositions = () => {
    try {
      const saved = localStorage.getItem('burstEventPositions')
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Error loading burst positions:', error)
      return {}
    }
  }

  const saveBurstPosition = (burstId, coordinates) => {
    try {
      const positions = getBurstPositions()
      positions[burstId] = coordinates
      localStorage.setItem('burstEventPositions', JSON.stringify(positions))
      console.log(`✅ Saved burst position for ${burstId}:`, coordinates)
    } catch (error) {
      console.error('Error saving burst position:', error)
    }
  }

  const getMergedBurstData = () => {
    const savedPositions = getBurstPositions()
    return {
      ...BURST_EVENTS,
      features: BURST_EVENTS.features.map(feature => {
        const savedCoords = savedPositions[feature.id]
        return savedCoords ? {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: savedCoords
          }
        } : feature
      })
    }
  }

  // Pressure zone polygon management (localStorage)
  const getPressureZonePolygon = () => {
    try {
      const saved = localStorage.getItem('pressureZonePolygon')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error loading pressure zone polygon:', error)
      return null
    }
  }

  const savePressureZonePolygon = (coordinates) => {
    try {
      localStorage.setItem('pressureZonePolygon', JSON.stringify(coordinates))
      console.log('✅ Saved pressure zone polygon:', coordinates)
    } catch (error) {
      console.error('Error saving pressure zone polygon:', error)
    }
  }

  const getMergedPressureZoneData = () => {
    const savedPolygon = getPressureZonePolygon()
    if (!savedPolygon) return PRESSURE_ZONES

    return {
      ...PRESSURE_ZONES,
      features: PRESSURE_ZONES.features.map(feature => {
        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: savedPolygon
          }
        }
      })
    }
  }

  // Create/remove burst event markers (custom DOM with gradient glow)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Clean up existing markers
    burstMarkersRef.current.forEach(marker => marker.remove())
    burstMarkersRef.current = []
    
    if (!burstEventsVisible && !burstEditMode) return
    
    const REFERENCE_ZOOM = 11  // Base zoom level for scale calculation
    
    const popupContent = `
      <div class="burst-location-popup" style="font-family: var(--font-family-primary); color: var(--color-gray-100);">
        <div style="font-weight: var(--font-weight-bold); color: var(--color-red-400); margin-bottom: 8px; font-size: 14px;">Major Water Main Burst</div>
        <div style="font-size: var(--text-xs); margin-bottom: 6px; color: var(--color-gray-300);">Downtown District</div>
        <div style="font-size: var(--text-xs); margin-bottom: 8px; color: var(--color-gray-300);">
          <span style="font-weight: var(--font-weight-semibold);">Status:</span> <span style="color: var(--color-red-400);">Active Burst (CONFIRMED)</span>
        </div>
        <div style="margin-bottom: 6px; font-size: var(--text-sm);">
          <span style="font-weight: var(--font-weight-semibold); color: var(--color-gray-300);">Assets Affected:</span>
        </div>
        <div style="font-size: var(--text-sm); margin-bottom: 8px; color: var(--color-gray-200); margin-left: 8px;">
          156 affected pipes<br/>
          <span style="font-size: var(--text-xs); color: var(--color-gray-400);">(45 Critical, 111 Severe)</span>
        </div>
        <div style="margin-bottom: 4px; font-size: var(--text-sm);">
          <span style="font-weight: var(--font-weight-semibold); color: var(--color-gray-300);">Impact:</span> <span style="color: var(--color-gray-100);">1404 Customers Affected</span>
        </div>
        <div style="margin-top: 8px; margin-bottom: 12px; font-size: var(--text-xs); color: var(--color-gray-400);">
          Detected: Aug 27, 2023, 10:00 AM
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
          <button 
            class="burst-popup-btn"
            style="padding: 6px 12px; font-size: var(--text-xs); font-weight: var(--font-weight-medium); background-color: var(--color-gray-700); color: var(--color-gray-200); border: 1px solid var(--color-gray-600); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-center; gap: 4px; width: 100%; transition: all var(--default-transition-duration) var(--default-transition-timing-function);"
            onmouseover="this.style.backgroundColor='var(--color-gray-600)'; this.style.color='var(--color-gray-100)'"
            onmouseout="this.style.backgroundColor='var(--color-gray-700)'; this.style.color='var(--color-gray-200)'"
            onclick="console.log('Show Affected Pipes clicked')">
            <span>Show Affected Pipes</span>
          </button>
          <button 
            class="burst-popup-btn"
            style="padding: 6px 12px; font-size: var(--text-xs); font-weight: var(--font-weight-medium); background-color: var(--color-blue-900); color: var(--color-blue-300); border: 1px solid var(--color-blue-700); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-center; gap: 4px; width: 100%; transition: all var(--default-transition-duration) var(--default-transition-timing-function);"
            onmouseover="this.style.backgroundColor='var(--color-blue-800)'; this.style.color='var(--color-blue-200)'"
            onmouseout="this.style.backgroundColor='var(--color-blue-900)'; this.style.color='var(--color-blue-300)'"
            onclick="window.dispatchEvent(new CustomEvent('addBurstContextToCopilot'))">
            <span>Add Context to WaterOS Copilot</span>
          </button>
        </div>
      </div>
    `
    
    // Function to calculate scale based on zoom level
    const calculateScale = (zoom) => {
      return Math.pow(2, zoom - REFERENCE_ZOOM)
    }
    
    // Function to update gradient scales (scale the gradient, keep center marker fixed)
    const updateMarkerScales = () => {
      const currentZoom = map.current.getZoom()
      const scale = calculateScale(currentZoom)
      
      burstMarkersRef.current.forEach(marker => {
        const element = marker.getElement()
        if (element && element.classList.contains('burst-event-gradient-wrapper')) {
          const gradient = element.querySelector('.burst-gradient-glow')
          if (gradient) {
            gradient.style.transform = `translate(-50%, -50%) scale(${scale})`
          }
        }
      })
    }
    
    const mergedBurstData = getMergedBurstData()
    
    mergedBurstData.features.forEach((feature) => {
      const coordinates = feature.geometry.coordinates.slice()
      
      // Create gradient marker (z-index 10, below sensors)
      const gradientElement = document.createElement('div')
      gradientElement.className = 'burst-event-gradient-wrapper'
      gradientElement.style.cssText = `position: relative; width: ${burstGradientParams.size}px; height: ${burstGradientParams.size}px; pointer-events: none;`
      gradientElement.dataset.burstId = feature.id
      
      const glow = document.createElement('div')
      glow.className = 'burst-gradient-glow'
      // Apply dynamic gradient parameters
      const halfSize = burstGradientParams.size / 2
      const opacityStart = burstGradientParams.opacity
      const opacityMid = opacityStart * 0.43  // ~15% of 35% = 0.15
      const opacityEnd = opacityStart * 0.14   // ~5% of 35% = 0.05
      const spreadMid = Math.round(burstGradientParams.spread * 0.58)  // 35% of 60% = 35%
      
      glow.style.cssText = `
        width: ${burstGradientParams.size}px;
        height: ${burstGradientParams.size}px;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(220, 38, 38, ${opacityStart}) 0%,
          rgba(220, 38, 38, ${opacityMid}) ${spreadMid}%,
          rgba(220, 38, 38, ${opacityEnd}) ${burstGradientParams.spread}%,
          transparent 100%
        );
        pointer-events: none;
        position: absolute;
        top: 50%;
        left: 50%;
      `
      
      // Apply initial scale to gradient based on current zoom
      const initialScale = calculateScale(map.current.getZoom())
      glow.style.transform = `translate(-50%, -50%) scale(${initialScale})`
      
      gradientElement.appendChild(glow)
      
      const gradientMarker = new maplibregl.Marker({
        element: gradientElement,
        anchor: 'center',
        draggable: false
      })
        .setLngLat(coordinates)
        .addTo(map.current)
      
      // Set z-index on gradient marker (z-index 10, below sensors at 20)
      gradientMarker.getElement().style.zIndex = '10'
      
      // Create center marker (z-index 25, above sensors)
      const centerElement = document.createElement('div')
      centerElement.className = 'burst-marker-center-wrapper'
      centerElement.style.cssText = `pointer-events: auto; cursor: ${burstEditMode ? 'grab' : 'pointer'};`
      centerElement.dataset.burstId = feature.id
      
      const center = document.createElement('div')
      center.className = 'burst-marker-center'
      
      const inner = document.createElement('div')
      inner.className = 'burst-marker-inner'
      
      const icon = document.createElement('div')
      icon.className = 'burst-marker-icon'
      
      inner.appendChild(icon)
      center.appendChild(inner)
      // Animated hourglass badge when action approved (inside center to avoid map transform issues)
      if (burstImplementationComplete) {
        const hourglassBadge = document.createElement('div')
        hourglassBadge.className = 'burst-marker-hourglass-badge'
        hourglassBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`
        center.appendChild(hourglassBadge)
      }
      centerElement.appendChild(center)
      
      const centerMarker = new maplibregl.Marker({
        element: centerElement,
        anchor: 'center',
        draggable: burstEditMode
      })
        .setLngLat(coordinates)
        .addTo(map.current)
      
      // Set z-index on center marker (z-index 25, above sensors at 20)
      centerMarker.getElement().style.zIndex = '25'
      
      // Prevent clicks from reaching the pressure zone layer
      centerElement.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        // Reset flag after a short delay to allow the pressure zone handler to check it
        setTimeout(() => {
          markerClickedRef.current = false
        }, 50)
      })
      
      if (burstEditMode) {
        // Edit mode: draggable center marker, gradient follows
        centerMarker.on('drag', () => {
          centerElement.style.cursor = 'grabbing'
          // Move gradient to match center marker position
          const lngLat = centerMarker.getLngLat()
          gradientMarker.setLngLat([lngLat.lng, lngLat.lat])
        })
        
        centerMarker.on('dragend', () => {
          centerElement.style.cursor = 'grab'
          const lngLat = centerMarker.getLngLat()
          saveBurstPosition(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        // Normal mode: hover center marker only to show popup
        let hideTimeout
        center.addEventListener('mouseenter', () => {
          map.current.getCanvas().style.cursor = 'pointer'
          if (hideTimeout) clearTimeout(hideTimeout)
          
          if (burstPopup.current) burstPopup.current.remove()
          burstPopup.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '240px'
          })
            .setLngLat(centerMarker.getLngLat())
            .setHTML(popupContent)
            .addTo(map.current)
          
          const popupElement = burstPopup.current.getElement()
          popupElement.addEventListener('mouseenter', () => {
            map.current.getCanvas().style.cursor = 'auto'
          })
          popupElement.addEventListener('mouseleave', () => {
            if (burstPopup.current) {
              burstPopup.current.remove()
              burstPopup.current = null
            }
          })
        })
        
        center.addEventListener('mouseleave', () => {
          map.current.getCanvas().style.cursor = ''
          hideTimeout = setTimeout(() => {
            const popupEl = burstPopup.current?.getElement()
            if (popupEl && !popupEl.matches(':hover')) {
              if (burstPopup.current) {
                burstPopup.current.remove()
                burstPopup.current = null
              }
            }
          }, 100)
        })
      }
      
      // Store both markers (gradient and center)
      burstMarkersRef.current.push(gradientMarker, centerMarker)
    })
    
    // Add zoom event listener to update marker scales
    const handleZoom = () => {
      updateMarkerScales()
    }
    
    map.current.on('zoom', handleZoom)
    
    return () => {
      if (map.current) {
        map.current.off('zoom', handleZoom)
      }
      burstMarkersRef.current.forEach(marker => marker.remove())
      burstMarkersRef.current = []
    }
  }, [burstEventsVisible, burstEditMode, burstGradientParams, burstImplementationComplete, mapLoaded])

  // Listen for map zoom requests from panels
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapZoomRequest) return
    
    const { bounds } = mapZoomRequest
    if (bounds && bounds.length === 4) {
      // bounds format: [west, south, east, north]
      const mapBounds = new maplibregl.LngLatBounds(
        [bounds[0], bounds[1]], // southwest
        [bounds[2], bounds[3]]  // northeast
      )
      
      console.log('🎯 Zooming to requested bounds from panel')
      map.current.fitBounds(mapBounds, { padding: 80, maxZoom: 14, duration: 1000 })
    }
  }, [mapZoomRequest, mapLoaded])

  // Manage network meter markers - always render as DOM markers (for proper z-index above burst gradients)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Clean up existing markers
    sensorMarkers.current.forEach(marker => marker.remove())
    sensorMarkers.current = []
    
    // Don't create markers if sensors are hidden and not in edit mode
    if (!pressureSensorsVisible && !sensorEditMode) return
    
    // Get network meter data with saved positions
    const mergedData = getMergedSensorData()
    
    mergedData.features.forEach((feature) => {
      const el = document.createElement('div')
      el.className = sensorEditMode ? 'sensor-marker-editable' : 'sensor-marker'
      el.style.backgroundColor = getStatusColor(feature.properties.status)
      el.dataset.sensorId = feature.id
      
      const marker = new maplibregl.Marker({
        element: el,
        draggable: sensorEditMode,
        anchor: 'center'
      })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map.current)
      
      // Set z-index on marker element (sensors at z-index 20, above burst gradients at z-index 10)
      marker.getElement().style.zIndex = '20'
      
      // Prevent clicks from reaching the pressure zone layer
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        // Reset flag after a short delay to allow the pressure zone handler to check it
        setTimeout(() => {
          markerClickedRef.current = false
        }, 50)
      })
      
      if (sensorEditMode) {
        // Edit mode: Handle drag events
        marker.on('dragstart', () => {
          el.style.cursor = 'grabbing'
          setIsDraggingSensor(true)
        })
        
        marker.on('dragend', () => {
          el.style.cursor = 'grab'
          setIsDraggingSensor(false)
          
          const lngLat = marker.getLngLat()
          handleSensorPositionUpdate(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        // Normal mode: Handle click to open meter panel
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          setSelectedSensor({
            sensorId: feature.properties.sensorId,
            name: feature.properties.name,
            status: feature.properties.status,
            pressure: feature.properties.pressure,
            lastReading: feature.properties.lastReading,
            location: feature.properties.location
          })
          console.log('✅ Meter panel opened for:', feature.properties.sensorId)
        })
      }
      
      sensorMarkers.current.push(marker)
    })
    
    // Always hide the circle layer since we're using DOM markers
    if (map.current.getLayer('pressure-sensors-circles')) {
      map.current.setLayoutProperty('pressure-sensors-circles', 'visibility', 'none')
    }
    
    // Update source data with saved positions
    if (map.current.getSource('pressure-sensors')) {
      map.current.getSource('pressure-sensors').setData(mergedData)
    }
    
    console.log(`✅ Created ${sensorMarkers.current.length} network meter DOM markers`)
    
    return () => {
      sensorMarkers.current.forEach(marker => marker.remove())
      sensorMarkers.current = []
    }
  }, [sensorEditMode, mapLoaded, pressureSensorsVisible])

  // Manage pressure sensor (gauge-style) markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return

    pressureSensorMarkersRef.current.forEach((m) => m.remove())
    pressureSensorMarkersRef.current = []

    if (!pressureSensorsMapVisible && !pressureSensorEditMode) return

    const visibleStatuses = Object.entries(activePressureSensorStatuses)
      .filter(([_, active]) => active)
      .map(([status]) => status)

    const mergedData = getMergedPressureSensorMapData()

    mergedData.features.forEach((feature) => {
      const status = feature.properties?.status || 'normal'
      if (!visibleStatuses.includes(status)) return

      const coords = feature.geometry.coordinates.slice()
      const bgColor = getPressureSensorBgColor(status)
      const pressure = feature.properties?.pressure ?? 50
      const pct = Math.min(100, Math.max(0, (pressure / 100) * 100))
      const needleAngle = -90 + (pct / 100) * 180

      const el = document.createElement('div')
      el.className = pressureSensorEditMode ? 'pressure-sensor-marker pressure-sensor-marker-editable' : 'pressure-sensor-marker'
      el.dataset.sensorId = feature.id
      el.style.setProperty('--pressure-sensor-bg', bgColor)
      el.innerHTML = `
        <div class="pressure-sensor-gauge">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <path class="gauge-arc" d="M6 20 A10 10 0 0 1 26 20" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round"/>
            <line class="gauge-tick" x1="8" y1="18.5" x2="8" y2="20" stroke="#000" stroke-width="1"/>
            <line class="gauge-tick" x1="16" y1="14" x2="16" y2="16" stroke="#000" stroke-width="1"/>
            <line class="gauge-tick" x1="24" y1="18.5" x2="24" y2="20" stroke="#000" stroke-width="1"/>
            <circle class="gauge-pivot" cx="16" cy="20" r="1.5" fill="#000"/>
            <line class="gauge-needle" x1="16" y1="20" x2="16" y2="12" stroke="#000" stroke-width="1" stroke-linecap="round" transform="rotate(${needleAngle} 16 20)"/>
            <path class="gauge-housing" d="M10 20 Q16 26 22 20" fill="none" stroke="#000" stroke-width="1.2"/>
          </svg>
        </div>
      `

      const marker = new maplibregl.Marker({
        element: el,
        draggable: pressureSensorEditMode,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map.current)

      marker.getElement().style.zIndex = '20'

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        setTimeout(() => { markerClickedRef.current = false }, 50)
      })

      if (pressureSensorEditMode) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          handlePressureSensorPositionUpdate(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          setSelectedSensor({
            sensorId: feature.properties.sensorId,
            name: feature.properties.name,
            status: feature.properties.status,
            pressure: feature.properties.pressure,
            lastReading: feature.properties.lastReading,
            location: feature.properties.location,
          })
        })

        // Hover tooltip (React component based - Figma design)
        el.addEventListener('mouseenter', (e) => {
          const rect = el.getBoundingClientRect()
          setHoveredPressureSensor(feature)
          setPressureSensorTooltipPos({
            x: rect.right + 12,
            y: rect.top
          })
        })
        el.addEventListener('mouseleave', () => {
          // Don't immediately hide - let tooltip component handle this
          setTimeout(() => {
            if (!document.querySelector('.pressure-sensor-tooltip-container:hover')) {
              setHoveredPressureSensor(null)
              setPressureSensorTooltipPos(null)
            }
          }, 150)
        })
      }

      pressureSensorMarkersRef.current.push(marker)
    })

    return () => {
      pressureSensorMarkersRef.current.forEach((m) => m.remove())
      pressureSensorMarkersRef.current = []
      setHoveredPressureSensor(null)
      setPressureSensorTooltipPos(null)
    }
  }, [pressureSensorsMapVisible, pressureSensorEditMode, activePressureSensorStatuses, mapLoaded])

  // Manage pressure zone polygon edit mode - create draggable vertex markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Clean up existing markers
    polygonVertexMarkers.current.forEach(marker => marker.remove())
    polygonVertexMarkers.current = []
    
    if (pressureZoneEditMode) {
      // Function to create all markers (vertices and midpoints)
      const createMarkers = () => {
        // Clean up existing markers first
        polygonVertexMarkers.current.forEach(marker => marker.remove())
        polygonVertexMarkers.current = []
        
        // Get the current polygon data (with any saved edits)
        const mergedData = getMergedPressureZoneData()
        const feature = mergedData.features[0] // We have only one pressure zone
        const coordinates = feature.geometry.coordinates[0] // Get the outer ring
        const vertices = coordinates.slice(0, -1) // Exclude duplicate closing point
        
        // Create draggable markers for each vertex
        vertices.forEach((coord, index) => {
          const el = document.createElement('div')
          el.className = 'polygon-vertex-marker'
          el.title = `Vertex ${index + 1} (double-click to delete)`
          el.dataset.type = 'vertex'
          el.dataset.index = index
          
          const marker = new maplibregl.Marker({
            element: el,
            draggable: true,
            anchor: 'center'
          })
            .setLngLat(coord)
            .addTo(map.current)
          
          // Handle drag events
          marker.on('drag', () => {
            updatePolygonGeometry()
            updateMidpoints()
          })
          
          marker.on('dragend', () => {
            saveCurrentPolygon()
          })
          
          // Handle double-click to delete vertex
          el.addEventListener('dblclick', (e) => {
            e.stopPropagation()
            const vertexMarkers = polygonVertexMarkers.current.filter(
              m => m.getElement().dataset.type === 'vertex'
            )
            // Don't allow deleting if only 3 vertices left (minimum for polygon)
            if (vertexMarkers.length > 3) {
              deleteVertexAtIndex(index)
            } else {
              console.warn('⚠️ Cannot delete vertex: polygon must have at least 3 vertices')
            }
          })
          
          polygonVertexMarkers.current.push(marker)
        })
        
        // Create midpoint markers between vertices (for adding new vertices)
        createMidpoints()
        
        console.log(`✅ Created ${vertices.length} vertex markers for polygon editing`)
      }
      
      // Function to create midpoint markers
      const createMidpoints = () => {
        // Remove existing midpoint markers
        polygonVertexMarkers.current
          .filter(m => m.getElement().dataset.type === 'midpoint')
          .forEach(m => {
            m.remove()
            const index = polygonVertexMarkers.current.indexOf(m)
            if (index > -1) polygonVertexMarkers.current.splice(index, 1)
          })
        
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        
        vertexMarkers.forEach((marker, index) => {
          const nextMarker = vertexMarkers[(index + 1) % vertexMarkers.length]
          const coord1 = marker.getLngLat()
          const coord2 = nextMarker.getLngLat()
          
          // Calculate midpoint
          const midpoint = [
            (coord1.lng + coord2.lng) / 2,
            (coord1.lat + coord2.lat) / 2
          ]
          
          const el = document.createElement('div')
          el.className = 'polygon-midpoint-marker'
          el.title = 'Click to add vertex'
          el.dataset.type = 'midpoint'
          el.dataset.afterIndex = index
          
          const midpointMarker = new maplibregl.Marker({
            element: el,
            draggable: false,
            anchor: 'center'
          })
            .setLngLat(midpoint)
            .addTo(map.current)
          
          // Handle click to add new vertex
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            const afterIndex = parseInt(el.dataset.afterIndex)
            addVertexAtIndex(afterIndex, midpoint)
          })
          
          polygonVertexMarkers.current.push(midpointMarker)
        })
      }
      
      // Function to update midpoint positions
      const updateMidpoints = () => {
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        const midpointMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'midpoint'
        )
        
        midpointMarkers.forEach((midpointMarker) => {
          const el = midpointMarker.getElement()
          const afterIndex = parseInt(el.dataset.afterIndex)
          const marker = vertexMarkers[afterIndex]
          const nextMarker = vertexMarkers[(afterIndex + 1) % vertexMarkers.length]
          
          if (marker && nextMarker) {
            const coord1 = marker.getLngLat()
            const coord2 = nextMarker.getLngLat()
            const midpoint = [
              (coord1.lng + coord2.lng) / 2,
              (coord1.lat + coord2.lat) / 2
            ]
            midpointMarker.setLngLat(midpoint)
          }
        })
      }
      
      // Function to delete a vertex at a specific index
      const deleteVertexAtIndex = (vertexIndex) => {
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        
        const currentCoordinates = vertexMarkers.map(m => {
          const lngLat = m.getLngLat()
          return [lngLat.lng, lngLat.lat]
        })
        
        // Remove the vertex at the specified index
        currentCoordinates.splice(vertexIndex, 1)
        
        // Close the polygon
        currentCoordinates.push(currentCoordinates[0])
        
        // Save to localStorage
        savePressureZonePolygon([currentCoordinates])
        
        // Update the map source
        if (map.current.getSource('pressure-zones')) {
          const mergedData = getMergedPressureZoneData()
          const updatedData = {
            ...mergedData,
            features: mergedData.features.map(f => ({
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [currentCoordinates]
              }
            }))
          }
          map.current.getSource('pressure-zones').setData(updatedData)
        }
        
        // Recreate all markers without the deleted vertex
        createMarkers()
        
        console.log(`✅ Deleted vertex at index ${vertexIndex}`)
      }
      
      // Function to add a new vertex at a specific index
      const addVertexAtIndex = (afterIndex, coordinates) => {
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        
        const currentCoordinates = vertexMarkers.map(m => {
          const lngLat = m.getLngLat()
          return [lngLat.lng, lngLat.lat]
        })
        
        // Insert new coordinate after the specified index
        currentCoordinates.splice(afterIndex + 1, 0, coordinates)
        
        // Close the polygon
        currentCoordinates.push(currentCoordinates[0])
        
        // Save to localStorage
        savePressureZonePolygon([currentCoordinates])
        
        // Update the map source
        if (map.current.getSource('pressure-zones')) {
          const mergedData = getMergedPressureZoneData()
          const updatedData = {
            ...mergedData,
            features: mergedData.features.map(f => ({
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [currentCoordinates]
              }
            }))
          }
          map.current.getSource('pressure-zones').setData(updatedData)
        }
        
        // Recreate all markers with the new vertex
        createMarkers()
        
        console.log(`✅ Added new vertex at index ${afterIndex + 1}`)
      }
      
      // Function to save current polygon state
      const saveCurrentPolygon = () => {
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        
        const newCoordinates = vertexMarkers.map(m => {
          const lngLat = m.getLngLat()
          return [lngLat.lng, lngLat.lat]
        })
        
        // Close the polygon by adding the first coordinate at the end
        newCoordinates.push(newCoordinates[0])
        
        // Save to localStorage
        savePressureZonePolygon([newCoordinates])
        
        // Update the map source
        const mergedData = getMergedPressureZoneData()
        if (map.current.getSource('pressure-zones')) {
          const updatedData = {
            ...mergedData,
            features: mergedData.features.map(f => ({
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newCoordinates]
              }
            }))
          }
          map.current.getSource('pressure-zones').setData(updatedData)
        }
        
        console.log('✅ Pressure zone polygon updated')
      }
      
      // Function to update polygon geometry in real-time during drag
      const updatePolygonGeometry = () => {
        const vertexMarkers = polygonVertexMarkers.current.filter(
          m => m.getElement().dataset.type === 'vertex'
        )
        
        const newCoordinates = vertexMarkers.map(m => {
          const lngLat = m.getLngLat()
          return [lngLat.lng, lngLat.lat]
        })
        
        // Close the polygon
        newCoordinates.push(newCoordinates[0])
        
        // Update the map source
        const mergedData = getMergedPressureZoneData()
        if (map.current.getSource('pressure-zones')) {
          const updatedData = {
            ...mergedData,
            features: mergedData.features.map(f => ({
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newCoordinates]
              }
            }))
          }
          map.current.getSource('pressure-zones').setData(updatedData)
        }
      }
      
      // Initial marker creation
      createMarkers()
    } else {
      // When exiting edit mode, update source with saved polygon
      if (map.current.getSource('pressure-zones')) {
        const mergedData = getMergedPressureZoneData()
        map.current.getSource('pressure-zones').setData(mergedData)
        console.log('✅ Pressure zone polygon updated from localStorage')
      }
    }
    
    return () => {
      polygonVertexMarkers.current.forEach(marker => marker.remove())
      polygonVertexMarkers.current = []
    }
  }, [pressureZoneEditMode, mapLoaded])

  // Filter network meters by active statuses (now working with DOM markers)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    const visibleStatuses = Object.entries(activeSensorStatuses)
      .filter(([_, active]) => active)
      .map(([status]) => status)
    
    console.log('🔵 Visible meter statuses:', visibleStatuses)
    
    // Show/hide meter markers based on their status
    sensorMarkers.current.forEach(marker => {
      const el = marker.getElement()
      if (!el) return
      
      const sensorId = el.dataset.sensorId
      const mergedData = getMergedSensorData()
      const sensorFeature = mergedData.features.find(f => f.id === sensorId)
      
      if (sensorFeature) {
        const sensorStatus = sensorFeature.properties.status
        const shouldShow = visibleStatuses.includes(sensorStatus)
        el.style.display = shouldShow ? 'block' : 'none'
      }
    })
    
    console.log(`✅ Filtered sensors by status`)
  }, [activeSensorStatuses, mapLoaded, sensorEditMode, pressureSensorsVisible])

  // Handle network meter position updates
  const handleSensorPositionUpdate = (sensorId, newCoordinates) => {
    console.log(`📍 Updating meter ${sensorId} to:`, newCoordinates)
    
    try {
      // Get existing saved positions from localStorage
      const savedPositions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
      
      // Update the position
      savedPositions[sensorId] = {
        coordinates: newCoordinates,
        timestamp: new Date().toISOString()
      }
      
      // Save to localStorage
      localStorage.setItem('sensorPositions', JSON.stringify(savedPositions))
      
      console.log('✅ Meter position saved to localStorage')
      console.log('💾 To export all positions, run: exportSensorPositions()')
      
      // Make export function available globally for easy access
      window.exportSensorPositions = () => {
        const positions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
        const updatedSensors = { ...PRESSURE_SENSORS }
        
        // Update coordinates in the feature collection
        updatedSensors.features = updatedSensors.features.map(feature => {
          if (positions[feature.id]) {
            return {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: positions[feature.id].coordinates
              }
            }
          }
          return feature
        })
        
        // Generate exportable JavaScript code
        const exportCode = `        // Updated network meter positions - ${new Date().toISOString()}
export const PRESSURE_SENSORS = ${JSON.stringify(updatedSensors, null, 2)}`
        
        console.log('\n📤 COPY THE CODE BELOW AND PASTE INTO src/data/pressureSensors.js (Network Meters):\n')
        console.log(exportCode)
        console.log('\n📋 Code also copied to clipboard!')
        
        // Try to copy to clipboard
        navigator.clipboard.writeText(exportCode).then(() => {
          console.log('✅ Copied to clipboard!')
        }).catch(err => {
          console.log('⚠️ Could not copy to clipboard, please copy from console')
        })
      }
      
    } catch (error) {
      console.error('❌ Error saving meter position:', error)
    }
  }

  const handlePressureSensorPositionUpdate = (sensorId, newCoordinates) => {
    try {
      const savedPositions = JSON.parse(localStorage.getItem('pressureSensorPositions') || '{}')
      savedPositions[sensorId] = {
        coordinates: newCoordinates,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('pressureSensorPositions', JSON.stringify(savedPositions))
    } catch (error) {
      console.error('Error saving pressure sensor position:', error)
    }
  }

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10
        }}
      />
      {hoveredPressureSensor && pressureSensorTooltipPos && (
        <PressureSensorTooltip
          feature={hoveredPressureSensor}
          position={pressureSensorTooltipPos}
          onClose={() => {
            setHoveredPressureSensor(null)
            setPressureSensorTooltipPos(null)
          }}
        />
      )}
    </>
  )
}
