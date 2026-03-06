import { useRef, useEffect, useState } from 'react'
import {
  Layers,
  PenLine,
  Minus,
  Square,
  X,
  ChevronDown,
  Route,
  Check,
  AlertTriangle,
  GripVertical,
  Pipette,
  Map,
  Calendar,
  Users,
  Sparkles,
  Send,
  MessageSquare,
} from 'lucide-react'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'

const EVENTS = [
  {
    id: 'water-main-burst-downtown',
    label: 'Major Water Main Burst - Downtown District',
    dateTimeRange: 'Aug 27, 2023, 8/27/2023, 10:00 AM - 8/27/2023, 2:15 PM',
    affectedPipes: {
      total: 156,
      threshold: '< 68 PSI',
      severity: [
        { label: 'Critical', count: 45, color: 'red' },
        { label: 'Severe', count: 111, color: 'orange' },
      ],
      customersAffected: 1404,
      recommendation: {
        title: 'Emergency Isolation',
        description: 'Immediate Isolate of Zone 5 required to limit water loss. Dispatch Crew Alpha with emergency evacuation equipment and coordinate lane/road closures with City of St Louis Street Department and MoDOT',
      },
    },
  },
  {
    id: 'pressure-loss',
    label: 'Pressure Loss - Industrial Zone',
    dateTimeRange: 'Jan 25, 2026, 1/25/2026, 12:55 AM - 1/25/2026, 11:55 AM',
    affectedPipes: {
      total: 205,
      threshold: '< 20 PSI',
      severity: [{ label: 'Severe', count: 205, color: 'orange' }],
      customersAffected: 1250,
      recommendation: {
        title: 'Boil Advisory',
        description: 'Show neighborhoods with sub-threshold pipes',
      },
    },
  },
  {
    id: 'pump-station',
    label: 'Pump Station Outage - North',
    dateTimeRange: 'Jan 15, 2026, 1/15/2026, 12:55 AM - 1/15/2026, 1:55 PM',
    affectedPipes: {
      total: 1060,
      threshold: '< 20 PSI',
      severity: [{ label: 'Severe', count: 1060, color: 'orange' }],
      customersAffected: 5420,
      recommendation: {
        title: 'Boil Advisory',
        description: 'Show neighborhoods with sub-threshold pipes',
      },
    },
  },
  {
    id: 'valve-failure',
    label: 'Valve Failure - Downtown',
    dateTimeRange: 'Jan 4, 2026, 1/4/2026, 12:55 AM - 1/4/2026, 7:55 AM',
    affectedPipes: {
      total: 1109,
      threshold: '< 20 PSI',
      severity: [
        { label: 'Critical', count: 28, color: 'red' },
        { label: 'Severe', count: 1081, color: 'orange' },
      ],
      customersAffected: 6890,
      recommendation: {
        title: 'Boil Advisory',
        description: 'Show neighborhoods with sub-threshold pipes',
      },
    },
  },
  {
    id: 'main-break',
    label: 'Main Break - Oak Street',
    dateTimeRange: 'Dec 28, 2025, 12:55 AM - Dec 28, 2025, 4:55 PM',
    affectedPipes: {
      total: 1089,
      threshold: '< 20 PSI',
      severity: [{ label: 'Severe', count: 1089, color: 'orange' }],
      customersAffected: 3200,
      recommendation: {
        title: 'Boil Advisory',
        description: 'Show neighborhoods with sub-threshold pipes',
      },
    },
  },
]

export default function EventAffectedAreaPanel() {
  const [selectedEventId, setSelectedEventId] = useState('water-main-burst-downtown')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showingAffectedPipes, setShowingAffectedPipes] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  
  // Inline AI mode state
  const [inlineAIMode, setInlineAIMode] = useState(false)
  const [inlineAIMessages, setInlineAIMessages] = useState([])
  const [showChatInput, setShowChatInput] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [implementationState, setImplementationState] = useState(null) // 'in-progress' or 'complete'
  const [implementationSteps, setImplementationSteps] = useState([])
  
  const { sendEventToCopilot, eventAreaVisible, setEventAreaVisible, setWaterMainsVisible, setPressureZonesVisible, setPressureSensorsVisible, requestMapZoom, addSuccessNotification, setBurstImplementationComplete } = usePanelContext()
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 24, y: 80 })

  const selectedEvent = EVENTS.find((e) => e.id === selectedEventId) ?? EVENTS[0]
  
  const buildEventContext = (event) => ({
    eventName: event.label,
    dateTimeRange: event.dateTimeRange,
    affectedPipes: event.affectedPipes.total,
    threshold: event.affectedPipes.threshold,
    customersAffected: event.affectedPipes.customersAffected,
    severity: event.affectedPipes.severity,
    recommendation: event.affectedPipes.recommendation,
  })
  
  const handleSendToCopilot = () => {
    const context = buildEventContext(selectedEvent)
    sendEventToCopilot(context)
  }
  
  // Toggle inline AI mode
  const handleToggleInlineAI = (e) => {
    const newMode = e.target.checked
    setInlineAIMode(newMode)
    localStorage.setItem('inlineAIModeEnabled', newMode.toString())
    
    // Initialize AI message when turning on
    if (newMode && inlineAIMessages.length === 0) {
      generateInitialSolution()
    }
    
    // Clear messages when turning off
    if (!newMode) {
      setInlineAIMessages([])
      setShowChatInput(false)
      setIsApproved(false)
      setImplementationState(null)
      setImplementationSteps([])
    }
  }
  
  // Generate initial AI solution from recommendation
  const generateInitialSolution = () => {
    const recommendation = selectedEvent.affectedPipes.recommendation
    const customersAffected = selectedEvent.affectedPipes.customersAffected
    
    const message = `Based on the ${recommendation.title.toLowerCase()} recommendation for the ${selectedEvent.label}, I suggest the following actions:

1. Immediately isolate Zone 5 to limit water loss and prevent further system degradation
2. Dispatch Crew Alpha with emergency evacuation equipment to the burst location
3. Coordinate lane and road closures with City of St Louis Street Department and MoDOT
4. Notify affected customers (${customersAffected.toLocaleString()} residents) via emergency alert system
5. Begin pressure monitoring in adjacent zones to detect cascade effects

This approach will minimize customer impact and enable faster recovery.`
    
    setInlineAIMessages([{
      id: Date.now(),
      type: 'ai',
      message,
      timestamp: new Date()
    }])
  }
  
  // Handle action buttons
  const handleApprove = async () => {
    setIsApproved(true)
    
    // Set initial state
    setImplementationState('in-progress')
    setImplementationSteps([])
    
    const steps = [
      { id: 'crew', label: 'Searching for available crew members', delay: 1500 },
      { id: 'equipment', label: 'Checking equipment availability', delay: 1200 },
      { id: 'closure', label: 'Submitting lane/road closure request', delay: 1800 },
      { id: 'permit', label: 'Processing work permits', delay: 1500 },
      { id: 'dispatch', label: 'Dispatching field crew', delay: 1000 },
    ]
    
    // Execute steps sequentially
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
      setImplementationSteps(prev => [...prev, step])
      
      // Trigger success notification for each step
      addSuccessNotification(step.label)
    }
    
    // Mark as complete
    await new Promise(resolve => setTimeout(resolve, 800))
    setImplementationState('complete')
    setBurstImplementationComplete(true)
    
    // Final success notification
    addSuccessNotification('Recommended action implemented successfully')
  }
  
  const handleModify = () => {
    setShowChatInput(true)
  }
  
  const handleAskMore = () => {
    setShowChatInput(true)
  }
  
  const handleSendMessage = (message) => {
    if (!message.trim()) return
    
    // Add user message
    setInlineAIMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    }])
    
    // Generate AI response (simulated)
    setTimeout(() => {
      setInlineAIMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        message: `I understand your question. Based on the current situation with ${selectedEvent.affectedPipes.customersAffected.toLocaleString()} customers affected, I recommend proceeding with the isolation plan while monitoring adjacent zones for pressure changes.`,
        timestamp: new Date()
      }])
    }, 1000)
  }

  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap
        left: rect.left,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    }
  }, [dropdownOpen])

  // Reset affected pipes view when event changes
  useEffect(() => {
    setShowingAffectedPipes(false)
  }, [selectedEventId])
  
  if (!eventAreaVisible) return null

  return (
    <div
      className="rounded-xl border fixed shadow-xl overflow-hidden flex flex-col z-20 pb-4"
      role="region"
      aria-label="Affected Area Panel"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '380px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 7rem)',
        backgroundColor: 'var(--sand-surface)',
        color: 'var(--color-gray-100)',
        borderColor: 'var(--color-gray-700)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar with drag handle - sticky at top when content scrolls */}
      <div
        ref={dragRef}
        className="p-3 flex items-center justify-between select-none shrink-0"
        style={{ 
          borderBottom: isMinimized ? 'none' : '1px solid var(--color-gray-700)',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: 'var(--sand-surface)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <span className="shrink-0 flex items-center">
            <Pipette className="w-4 h-4" style={{ color: 'var(--sand-teal)' }} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-gray-100)' }}>
                Event Affected Area
              </h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="inline-flex items-center justify-center rounded-md h-7 w-7 transition-colors"
            style={{ color: 'var(--color-gray-300)' }}
            title={isMinimized ? 'Expand' : 'Minimize'}
            onClick={() => setIsMinimized(m => !m)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'; e.currentTarget.style.color = 'var(--color-gray-100)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-gray-300)' }}
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md h-7 w-7 transition-colors"
            style={{ color: 'var(--color-gray-300)' }}
            title="Close"
            onClick={() => setEventAreaVisible(false)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'; e.currentTarget.style.color = 'var(--color-gray-100)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-gray-300)' }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!isMinimized && (
      <div className={`flex flex-col flex-1 min-h-0 ${inlineAIMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {/* Showing on map */}
        <div
          className="px-3 py-1.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-gray-700)' }}
        >
          <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--sand-teal)' }}>
            <Map className="w-3 h-3" aria-hidden="true" />
            Showing on map
          </span>
          <button
            onClick={() => setShowingAffectedPipes(false)}
            className="px-2 py-0.5 rounded transition-colors"
            style={{
              fontSize: 'var(--text-xs)',
              backgroundColor: 'var(--color-gray-700)',
              color: 'var(--color-gray-300)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-600)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
          >
            Clear
          </button>
        </div>

        {/* Select Event */}
        <div
          className="px-3 py-2"
          style={{ borderBottom: '1px solid var(--color-gray-700)' }}
        >
          <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-400)' }}>
            Select Event
          </label>
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="w-full px-3 py-2 pr-8 rounded border text-left transition-all"
              style={{
                fontSize: 'var(--text-sm)',
                backgroundColor: 'var(--color-gray-700)',
                borderColor: dropdownOpen ? 'var(--sand-teal)' : 'var(--color-gray-600)',
                color: 'var(--color-gray-200)',
              }}
            >
              {selectedEvent.label}
            </button>
            <ChevronDown
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--color-gray-400)' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Dropdown menu - rendered outside with fixed positioning */}
        {dropdownOpen && (
          <ul
            ref={dropdownRef}
            className="fixed py-1 max-h-52 overflow-auto rounded border"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              backgroundColor: 'var(--color-gray-700)',
              borderColor: 'var(--color-gray-600)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
            }}
            role="listbox"
          >
                {EVENTS.map((event) => (
                  <li key={event.id} role="option" aria-selected={selectedEventId === event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventId(event.id)
                        setDropdownOpen(false)
                      }}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors"
                      style={{
                        fontSize: 'var(--text-sm)',
                        backgroundColor: selectedEventId === event.id ? 'var(--sand-teal)' : 'transparent',
                        color: selectedEventId === event.id ? 'var(--color-white)' : 'var(--color-gray-200)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEventId !== event.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEventId !== event.id) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <span className="truncate">{event.label}</span>
                      {selectedEventId === event.id && (
                        <Check className="w-4 h-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
          </ul>
        )}

        {/* Date/Time Range */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-gray-700)' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {selectedEvent.dateTimeRange}
          </div>
        </div>

        {!showingAffectedPipes ? (
          <>
            {/* PSI Threshold */}
            <div
              className="px-3 py-2"
              style={{ borderBottom: '1px solid var(--color-gray-700)' }}
            >
              <label className="block mb-1" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-400)' }}>
                PSI Threshold
              </label>
              <div className="flex gap-1.5">
                <button
                  className="flex-1 px-2 py-1 font-medium rounded transition-colors"
                  style={{
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'var(--color-red-600)',
                    color: 'var(--color-white)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-red-700)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-red-600)' }}
                >
                  &lt; 20
                </button>
                <button
                  className="flex-1 px-2 py-1 font-medium rounded transition-colors"
                  style={{
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'rgba(154, 52, 18, 0.4)',
                    color: 'var(--color-orange-300)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(154, 52, 18, 0.6)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(154, 52, 18, 0.4)' }}
                >
                  &lt; 25
                </button>
                <button
                  className="flex-1 px-2 py-1 font-medium rounded transition-colors"
                  style={{
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'rgba(113, 63, 18, 0.4)',
                    color: 'var(--color-yellow-300)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(113, 63, 18, 0.6)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(113, 63, 18, 0.4)' }}
                >
                  &lt; 30
                </button>
              </div>
            </div>

            {/* Show Affected Pipes Button */}
            <div
              className="px-3 py-2"
              style={{ borderBottom: '1px solid var(--color-gray-700)' }}
            >
              <button
                onClick={() => {
                  setShowingAffectedPipes(true)
                  // If the selected event is "Major Water Main Burst - Downtown District"
                  if (selectedEventId === 'water-main-burst-downtown') {
                    // Toggle on Water Mains and Network Meters layers
                    setWaterMainsVisible(true)
                    setPressureSensorsVisible(true)
                    // Toggle off Pressure Zones layer
                    setPressureZonesVisible(false)
                    // Zoom to downtown area (St. Louis downtown bounds)
                    requestMapZoom([-90.205, 38.625, -90.185, 38.635])
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors shadow px-4 py-2 w-full h-8"
                style={{
                  fontSize: 'var(--text-sm)',
                  backgroundColor: 'var(--sand-teal)',
                  color: 'var(--color-white)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal-light)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal)' }}
              >
                <Map className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Show Affected Pipes
              </button>
            </div>
          </>
        ) : (
          /* Affected Pipes Result */
          <div className="px-3 py-2" style={{ height: 'fit-content' }}>
            <div className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
              {selectedEvent.affectedPipes.total} affected pipes
              <span className="ml-1 font-normal" style={{ color: 'var(--color-gray-400)' }}>
                (&lt; 20 PSI)
              </span>
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {selectedEvent.affectedPipes.severity.map((sev, idx) => {
                const bgColor =
                  sev.color === 'red'
                    ? 'var(--color-red-500)'
                    : 'var(--color-orange-500)'
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium"
                    style={{
                      fontSize: 'var(--text-xs)',
                      backgroundColor: bgColor,
                      color: 'var(--color-white)',
                    }}
                    title="1-20 PSI"
                  >
                    {sev.count} {sev.label}
                  </span>
                )
              })}
            </div>
            
            {/* Impact Metrics Section */}
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--color-gray-700)' }}>
              <div className="flex items-center gap-1.5 font-semibold mb-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--sand-teal)' }}>
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                Impact Metrics
              </div>
              <div className="font-medium" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                Customers Affected
              </div>
              <div className="font-semibold mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                {selectedEvent.affectedPipes.customersAffected.toLocaleString()}
              </div>
            </div>
            
            {/* Recommended Action Section */}
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--color-gray-700)' }}>
              <div className="flex items-center gap-1.5 font-semibold mb-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-orange-400)' }}>
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                Recommended Action
              </div>
              <div className="font-medium" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                {selectedEvent.affectedPipes.recommendation.title}
              </div>
              <div className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
                {selectedEvent.affectedPipes.recommendation.description}
              </div>
              <button
                className="mt-1.5 w-full px-3 py-1.5 font-medium rounded transition-colors border"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: 'var(--color-gray-700)',
                  color: 'var(--color-gray-200)',
                  borderColor: 'var(--color-gray-600)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-600)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
              >
                Show Advisory Area
              </button>
            </div>
            
            {/* Smart Interactions Section */}
            <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--color-gray-700)', height: 'fit-content' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--sand-teal)' }}>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Smart Interactions
                </div>
                <label className="ai-toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={inlineAIMode}
                    onChange={handleToggleInlineAI}
                    className="ai-toggle-input"
                  />
                  <span className="ai-toggle-slider"></span>
                  <span className="ai-toggle-label">Inline AI</span>
                </label>
              </div>
              
              {!inlineAIMode ? (
                <>
                  <button
                    onClick={handleSendToCopilot}
                    className="w-full px-3 py-1.5 font-medium rounded transition-colors border flex items-center justify-center gap-2"
                    style={{
                      fontSize: 'var(--text-xs)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      borderColor: 'var(--color-gray-600)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-600)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
                  >
                    <Send className="w-3.5 h-3.5" style={{ color: 'var(--sand-teal)' }} aria-hidden="true" />
                    Add Context to WaterOS Copilot
                  </button>
                  <p className="text-center mt-1.5" style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>
                    Get AI-powered analysis and recommendations
                  </p>
                </>
              ) : (
                <div className="inline-ai-container">
                  {/* AI Messages */}
                  <div className="inline-ai-messages">
                    {inlineAIMessages.map((msg) => (
                      <div key={msg.id} className={`inline-ai-message ${msg.type}`}>
                        {msg.type === 'ai' && (
                          <div className="inline-ai-avatar">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="inline-ai-message-content">
                          <p>{msg.message}</p>
                          
                          {/* Action Buttons inside first AI message */}
                          {msg.type === 'ai' && msg.id === inlineAIMessages[0]?.id && !isApproved && (
                            <div className="inline-ai-actions">
                              <button onClick={handleApprove} className="inline-ai-btn inline-ai-btn-approve">
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button onClick={handleModify} className="inline-ai-btn inline-ai-btn-modify">
                                <PenLine className="w-3 h-3" />
                                Modify
                              </button>
                              <button onClick={handleAskMore} className="inline-ai-btn inline-ai-btn-ask">
                                <Send className="w-3 h-3" />
                                Ask More
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Implementation Progress */}
                    {implementationState && (
                      <div className="inline-ai-message ai" style={{ marginTop: '12px' }}>
                        <div className="inline-ai-avatar">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <div className="inline-ai-message-content">
                          {implementationState === 'in-progress' && (
                            <>
                              <p style={{ marginBottom: '8px' }}>Implementing recommended action...</p>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '6px',
                                fontSize: '10px',
                                color: 'var(--color-gray-300)'
                              }}>
                                {implementationSteps.map((step, idx) => (
                                  <div key={step.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    opacity: 0,
                                    animation: 'fadeIn 0.3s ease-in forwards',
                                    animationDelay: '0.1s'
                                  }}>
                                    <span style={{ 
                                      color: 'var(--color-green-400)',
                                      fontSize: '12px'
                                    }}>✓</span>
                                    <span>{step.label}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {implementationState === 'complete' && (
                            <div>
                              <p style={{ 
                                marginBottom: '8px',
                                color: 'var(--color-green-400)',
                                fontWeight: 'var(--font-weight-semibold)'
                              }}>
                                ✓ Implementation Successful
                              </p>
                              <p style={{ 
                                fontSize: '11px',
                                color: 'var(--color-gray-300)',
                                lineHeight: '1.5'
                              }}>
                                The recommended action has been successfully implemented. Field crew has been dispatched to {selectedEvent.label.split('-')[1] || 'the location'}. Work permits and road closures are in place.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input - Always visible */}
                  <div className="inline-ai-input-wrapper">
                    <input
                      type="text"
                      className="inline-ai-input"
                      placeholder="Ask a follow-up question..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleSendMessage(e.target.value)
                          e.target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
