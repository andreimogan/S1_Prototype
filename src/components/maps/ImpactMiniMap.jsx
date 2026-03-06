import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

export default function ImpactMiniMap({ coordinates, eventName }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: coordinates,
      zoom: 14,
      interactive: false, // Make it non-interactive
      attributionControl: false
    })

    // Add burst marker
    const el = document.createElement('div')
    el.className = 'impact-mini-map-marker'
    el.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: rgba(239, 68, 68, 0.9);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `

    marker.current = new maplibregl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(coordinates)
      .addTo(map.current)

    return () => {
      if (marker.current) marker.current.remove()
      if (map.current) map.current.remove()
      map.current = null
    }
  }, [coordinates])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}
    />
  )
}
