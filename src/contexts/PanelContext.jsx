import { createContext, useContext, useState, useEffect } from 'react'
import { sendChatMessage } from '../services/openai-chat'
import { fetchStlNeighborhoodsData } from '../data/stlNeighborhoods'

const PanelContext = createContext()

export const usePanelContext = () => {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error('usePanelContext must be used within PanelProvider')
  }
  return context
}

export const PanelProvider = ({ children }) => {
  const [copilotVisible, setCopilotVisible] = useState(false)
  const [eventAreaVisible, setEventAreaVisible] = useState(false)
  const [layersVisible, setLayersVisible] = useState(false)
  const [pressureZoneVisible, setPressureZoneVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState([])
  const [eventContext, setEventContext] = useState(null)
  
  // AI Chat state
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [aiError, setAiError] = useState(null)
  
  // Event counts for notification badges
  const [eventAreaCount, setEventAreaCount] = useState(5) // 5 events in Event Area
  const [pressureCount, setPressureCount] = useState(0) // No pressure events yet
  
  // Intelligence tab items and notifications
  const [intelligenceItems, setIntelligenceItems] = useState([])
  const [hasUnreadIntelligence, setHasUnreadIntelligence] = useState(false)
  
  // Success notifications system
  const [successNotifications, setSuccessNotifications] = useState([])
  
  const addSuccessNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date(),
    }
    setSuccessNotifications(prev => [...prev, notification])
  }
  
  const removeSuccessNotification = (id) => {
    setSuccessNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  // Map layer states - contextual: only Burst Events visible on first open
  const [pressureZonesVisible, setPressureZonesVisible] = useState(false)
  const [activeRiskLevels, setActiveRiskLevels] = useState({
    high: true,
    medium: true,
    low: true
  })
  
  // Pressure sensors layer state
  const [pressureSensorsVisible, setPressureSensorsVisible] = useState(false)
  const [activeSensorStatuses, setActiveSensorStatuses] = useState({
    normal: true,
    warning: true,
    critical: true
  })
  
  // Burst events layer state
  const [burstEventsVisible, setBurstEventsVisible] = useState(true)
  
  // Burst implementation complete - when true, burst marker shows animated hourglass
  const [burstImplementationComplete, setBurstImplementationComplete] = useState(false)
  
  // Water mains layer state
  const [waterMainsVisible, setWaterMainsVisible] = useState(false)
  const [waterMainsDrawMode, setWaterMainsDrawMode] = useState(false)
  const [waterMainsDrawLevel, setWaterMainsDrawLevel] = useState('high')
  const [completeWaterMainRequest, setCompleteWaterMainRequest] = useState(0)
  const [waterMainDrawPointCount, setWaterMainDrawPointCount] = useState(0)
  const [waterMainsEditMode, setWaterMainsEditMode] = useState(false)
  const [selectedWaterMainId, setSelectedWaterMainId] = useState(null)
  const [deleteWaterMainId, setDeleteWaterMainId] = useState(null)
  
  const requestCompleteWaterMain = () => {
    setCompleteWaterMainRequest((n) => n + 1)
  }
  
  const requestDeleteWaterMain = (waterMainId) => {
    setDeleteWaterMainId(waterMainId)
  }
  
  // Sensor editing mode (for network meters)
  const [sensorEditMode, setSensorEditMode] = useState(false)
  
  // Pressure sensors (gauge-style) layer state
  const [pressureSensorsMapVisible, setPressureSensorsMapVisible] = useState(false)
  const [activePressureSensorStatuses, setActivePressureSensorStatuses] = useState({
    normal: true,
    warning: true,
    critical: true
  })
  const [pressureSensorEditMode, setPressureSensorEditMode] = useState(false)
  
  // Burst editing mode
  const [burstEditMode, setBurstEditMode] = useState(false)
  
  // Pressure zone editing mode
  const [pressureZoneEditMode, setPressureZoneEditMode] = useState(false)
  
  // Neighborhoods | Risk: custom polygons + St. Louis ArcGIS boundaries (single layer toggle)
  const [neighborhoodsRiskVisible, setNeighborhoodsRiskVisible] = useState(false)
  /** St. Louis outline per hood: `false` = hidden; missing / `true` = shown */
  const [enabledStlNeighborhoodIds, setEnabledStlNeighborhoodIds] = useState({})

  /** One app-wide load: ArcGIS GeoJSON + list for the panel (no duplicate MapView/panel fetches). */
  const [stlNeighborhoodsLoadStatus, setStlNeighborhoodsLoadStatus] = useState('loading')
  const [stlNeighborhoodsGeojson, setStlNeighborhoodsGeojson] = useState(null)
  const [stlNeighborhoodList, setStlNeighborhoodList] = useState([])

  useEffect(() => {
    let cancelled = false
    setStlNeighborhoodsLoadStatus('loading')
    fetchStlNeighborhoodsData()
      .then(({ geojson, neighborhoods }) => {
        if (cancelled) return
        setStlNeighborhoodsGeojson(geojson)
        setStlNeighborhoodList(neighborhoods)
        setStlNeighborhoodsLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('St. Louis neighborhoods failed to load:', err)
        setStlNeighborhoodsLoadStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Main Neighborhoods | Risk off → every St. Louis sub-toggle off; main on → all on (`{}`). */
  useEffect(() => {
    if (stlNeighborhoodList.length === 0) return
    if (!neighborhoodsRiskVisible) {
      setEnabledStlNeighborhoodIds(() => {
        const next = {}
        stlNeighborhoodList.forEach(({ id }) => {
          next[id] = false
        })
        return next
      })
    } else {
      setEnabledStlNeighborhoodIds({})
    }
  }, [neighborhoodsRiskVisible, stlNeighborhoodList])
  
  // Burst gradient parameters (session only; not persisted across reload)
  const [burstGradientParams, setBurstGradientParams] = useState({
    size: 280,
    opacity: 0.35,
    spread: 60,
  })
  
  const updateBurstGradientParams = (params) => {
    setBurstGradientParams(params)
  }
  
  // Selected pressure zone for detail panel
  const [selectedZone, setSelectedZone] = useState(null)
  
  // Selected sensor for detail panel
  const [selectedSensor, setSelectedSensor] = useState(null)
  
  // Open water mains - array of water main objects for multiple dialogs
  const [openWaterMains, setOpenWaterMains] = useState([])
  
  // Map zoom request - for triggering zoom from panels
  const [mapZoomRequest, setMapZoomRequest] = useState(null)
  
  const requestMapZoom = (bounds) => {
    setMapZoomRequest({ bounds, timestamp: Date.now() })
  }
  
  const addWaterMain = (waterMain) => {
    // Use the feature's id property - ensure it's a string
    const waterMainId = String(waterMain.id || waterMain.properties?.id || Date.now())
    
    // Check if already open by comparing IDs
    const exists = openWaterMains.some(wm => wm.uniqueId === waterMainId)
    if (!exists) {
      // Store with a stable uniqueId property
      setOpenWaterMains(prev => [...prev, { 
        ...waterMain, 
        uniqueId: waterMainId 
      }])
    }
  }
  
  const removeWaterMain = (waterMainId) => {
    console.log('Removing water main with ID:', waterMainId)
    console.log('Current open water mains:', openWaterMains.map(wm => wm.uniqueId))
    setOpenWaterMains(prev => {
      const filtered = prev.filter(wm => wm.uniqueId !== waterMainId)
      console.log('After filter:', filtered.map(wm => wm.uniqueId))
      return filtered
    })
  }

  const sendEventToCopilot = (context) => {
    // Set the event context
    setEventContext(context)
    
    // Ensure Copilot is visible and on Chat tab
    setCopilotVisible(true)
    setActiveTab('chat')
    
    // Add the event context as a message
    const contextMessage = {
      id: Date.now(),
      type: 'event-context',
      timestamp: new Date(),
      context: context,
    }
    
    setChatMessages((prev) => [...prev, contextMessage])
  }

  const clearChat = () => {
    setChatMessages([])
    setEventContext(null)
  }

  const deleteMessage = (messageId) => {
    setChatMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }
  
  const sendUserMessage = async (messageText) => {
    if (!messageText.trim()) return
    
    // Clear any previous error
    setAiError(null)
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user-message',
      message: messageText.trim(),
      timestamp: new Date()
    }
    setChatMessages((prev) => [...prev, userMessage])
    
    // Set AI responding state
    setIsAiResponding(true)
    
    try {
      // Build context from current chat messages
      const eventContexts = chatMessages
        .filter(m => m.type === 'event-context')
        .map(m => m.context)
      
      const impactAnalyses = chatMessages
        .filter(m => m.type === 'impact-analysis')
      
      const contextData = {
        eventContexts,
        meterContexts: [], // Can be populated if needed
        impactAnalyses
      }
      
      // Call OpenAI service (pass all messages including the one we just added)
      const allMessages = [...chatMessages, userMessage]
      const aiResponse = await sendChatMessage(allMessages, contextData)
      
      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai-message',
        message: aiResponse,
        timestamp: new Date()
      }
      setChatMessages((prev) => [...prev, aiMessage])
      
    } catch (error) {
      console.error('AI Chat Error:', error)
      setAiError(error.message || 'Failed to get AI response. Please try again.')
    } finally {
      setIsAiResponding(false)
    }
  }
  
  const addIntelligenceItem = (item) => {
    setIntelligenceItems((prev) => [...prev, { ...item, id: Date.now(), timestamp: new Date() }])
    setHasUnreadIntelligence(true)
  }
  
  const clearIntelligenceNotification = () => {
    setHasUnreadIntelligence(false)
  }

  const toggleCopilot = () => {
    setCopilotVisible((prev) => !prev)
  }

  const toggleEventArea = () => {
    setEventAreaVisible((prev) => !prev)
  }

  const toggleLayers = () => {
    setLayersVisible((prev) => !prev)
  }

  const togglePressureZone = () => {
    setPressureZoneVisible((prev) => !prev)
  }

  const value = {
    copilotVisible,
    setCopilotVisible,
    toggleCopilot,
    eventAreaVisible,
    setEventAreaVisible,
    toggleEventArea,
    layersVisible,
    setLayersVisible,
    toggleLayers,
    pressureZoneVisible,
    setPressureZoneVisible,
    togglePressureZone,
    selectedZone,
    setSelectedZone,
    activeTab,
    setActiveTab,
    chatMessages,
    setChatMessages,
    eventContext,
    sendEventToCopilot,
    clearChat,
    deleteMessage,
    sendUserMessage,
    isAiResponding,
    setIsAiResponding,
    aiError,
    setAiError,
    eventAreaCount,
    setEventAreaCount,
    pressureCount,
    setPressureCount,
    intelligenceItems,
    addIntelligenceItem,
    hasUnreadIntelligence,
    clearIntelligenceNotification,
    successNotifications,
    addSuccessNotification,
    removeSuccessNotification,
    pressureZonesVisible,
    setPressureZonesVisible,
    activeRiskLevels,
    setActiveRiskLevels,
    pressureSensorsVisible,
    setPressureSensorsVisible,
    activeSensorStatuses,
    setActiveSensorStatuses,
    pressureSensorsMapVisible,
    setPressureSensorsMapVisible,
    activePressureSensorStatuses,
    setActivePressureSensorStatuses,
    pressureSensorEditMode,
    setPressureSensorEditMode,
    burstEventsVisible,
    setBurstEventsVisible,
    burstImplementationComplete,
    setBurstImplementationComplete,
    waterMainsVisible,
    setWaterMainsVisible,
    waterMainsDrawMode,
    setWaterMainsDrawMode,
    waterMainsDrawLevel,
    setWaterMainsDrawLevel,
    completeWaterMainRequest,
    requestCompleteWaterMain,
    waterMainDrawPointCount,
    setWaterMainDrawPointCount,
    waterMainsEditMode,
    setWaterMainsEditMode,
    selectedWaterMainId,
    setSelectedWaterMainId,
    deleteWaterMainId,
    requestDeleteWaterMain,
    sensorEditMode,
    setSensorEditMode,
    burstEditMode,
    setBurstEditMode,
    pressureZoneEditMode,
    setPressureZoneEditMode,
    neighborhoodsRiskVisible,
    setNeighborhoodsRiskVisible,
    enabledStlNeighborhoodIds,
    setEnabledStlNeighborhoodIds,
    stlNeighborhoodsLoadStatus,
    stlNeighborhoodsGeojson,
    stlNeighborhoodList,
    burstGradientParams,
    updateBurstGradientParams,
    selectedSensor,
    setSelectedSensor,
    openWaterMains,
    addWaterMain,
    removeWaterMain,
    mapZoomRequest,
    requestMapZoom,
  }

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
}
