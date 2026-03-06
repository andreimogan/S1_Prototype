import { X, Move, Gauge, TriangleAlert, Sparkles, Send, Check, PenLine, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'
import SensorChart from '../charts/SensorChart'
import { SENSOR_CHART_DATA } from '../../data/sensorChartData'

export default function SensorDetailsPanel() {
  const { selectedSensor, setSelectedSensor, sendEventToCopilot } = usePanelContext()
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 24, y: 80 })
  const [activeTab, setActiveTab] = useState('stats')

  // Smart Interactions / Inline AI state
  const [inlineAIMode, setInlineAIMode] = useState(false)
  const [inlineAIMessages, setInlineAIMessages] = useState([])
  const [isApproved, setIsApproved] = useState(false)

  if (!selectedSensor) return null

  const sensor = selectedSensor

  // Determine status configuration
  const statusConfig = {
    critical: {
      color: 'var(--color-red-400)',
      bgColor: 'var(--color-red-900)',
      borderColor: 'var(--color-red-500)',
      label: 'Anomaly Detected',
      description: `Unusual pressure drop and flow increase detected at 09:30:00. This pattern indicates a potential burst in the pipeline.`,
      impact: 'High',
      flow: 950.8,
      quality: 0.65,
      pressureDisplay: '180.5 kPa ↓'
    },
    warning: {
      color: 'var(--color-orange-400)',
      bgColor: 'var(--color-orange-900)',
      borderColor: 'var(--color-orange-500)',
      label: 'Warning Status',
      description: 'Elevated pressure variance detected. Monitor closely for developing issues.',
      impact: 'Medium',
      flow: 520.3,
      quality: 0.82,
      pressureDisplay: `${sensor.pressure} kPa`
    },
    normal: {
      color: 'var(--color-blue-400)',
      bgColor: 'var(--color-blue-900)',
      borderColor: 'var(--color-blue-500)',
      label: 'Normal Operation',
      description: 'Meter operating within normal parameters.',
      impact: 'Low',
      flow: 380.5,
      quality: 0.95,
      pressureDisplay: `${sensor.pressure} kPa`
    }
  }

  const config = statusConfig[sensor.status] || statusConfig.normal
  const detectedDate = sensor.lastReading
    ? new Date(sensor.lastReading).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : 'N/A'

  // Meter context for Copilot / Smart Interactions
  const buildMeterContext = () => ({
    source: 'Network Meter Details',
    meterId: sensor.sensorId,
    status: sensor.status,
    statusLabel: config.label,
    description: config.description,
    impact: config.impact,
    pressureDisplay: config.pressureDisplay,
    flow: config.flow,
    quality: config.quality,
    lastReading: detectedDate,
  })

  const handleSendToCopilot = () => {
    sendEventToCopilot(buildMeterContext())
  }

  const generateInitialMeterSolution = () => {
    const status = sensor.status
    const meterId = sensor.sensorId
    if (status === 'critical') {
      return `Based on the anomaly detected at Meter ${meterId}, I recommend:

1. Dispatch a field crew to inspect the pipeline segment served by this meter for signs of a burst or leak
2. Isolate the affected zone if pressure continues to drop to limit water loss and protect adjacent areas
3. Notify operations to monitor flow and pressure at downstream meters for cascade effects
4. Schedule immediate calibration check after the incident to ensure meter accuracy

Current readings indicate unusual pressure drop and elevated flow—prioritize this meter for investigation.`
    }
    if (status === 'warning') {
      return `Based on the warning status at Meter ${meterId}, I recommend:

1. Increase monitoring frequency for this meter and adjacent nodes over the next 24–48 hours
2. Compare current pressure variance with historical patterns to identify if the trend is worsening
3. Schedule a preventive inspection if elevated variance persists beyond the next reading cycle
4. Ensure field crews are aware of this meter in case escalation is needed

Impact is currently assessed as medium—no immediate isolation required, but watch closely.`
    }
    return `Meter ${meterId} is operating normally. I recommend:

1. Continue standard monitoring and calibration schedule
2. Use this meter as a baseline for comparing any future anomalies in the same zone
3. No immediate action required; current pressure and flow are within expected parameters.`
  }

  const handleToggleInlineAI = (e) => {
    const newMode = e.target.checked
    setInlineAIMode(newMode)
    if (newMode && inlineAIMessages.length === 0) {
      setInlineAIMessages([{
        id: Date.now(),
        type: 'ai',
        message: generateInitialMeterSolution(),
        timestamp: new Date(),
      }])
    }
    if (!newMode) {
      setInlineAIMessages([])
      setIsApproved(false)
    }
  }

  const handleApprove = () => {
    setIsApproved(true)
    sendEventToCopilot(buildMeterContext())
    setInlineAIMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      message: 'Meter context approved. Added to Copilot.',
      timestamp: new Date(),
    }])
  }

  const handleModify = () => {
    // Could open a follow-up input; for now same as Ask More
    setInlineAIMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: 'I’d like to modify the recommendation.',
      timestamp: new Date(),
    }])
    setTimeout(() => {
      setInlineAIMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        message: `I can refine the recommendation for Meter ${sensor.sensorId}. For example we can adjust the inspection timeline, add specific checks, or focus on different parameters. What would you like to change?`,
        timestamp: new Date(),
      }])
    }, 800)
  }

  const handleAskMore = () => {
    setInlineAIMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: 'Tell me more about next steps.',
      timestamp: new Date(),
    }])
    setTimeout(() => {
      setInlineAIMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        message: `For Meter ${sensor.sensorId} (${config.label}), next steps include: reviewing the last 7 days of pressure/flow trends, checking neighboring meters for similar patterns, and updating the work order if you need a field visit. I can also help draft a short summary for your team.`,
        timestamp: new Date(),
      }])
    }, 800)
  }

  const handleSendMessage = (text) => {
    if (!text?.trim()) return
    setInlineAIMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: text.trim(),
      timestamp: new Date(),
    }])
    setTimeout(() => {
      setInlineAIMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        message: `I’ve noted your question about Meter ${sensor.sensorId}. Based on the current ${config.label} status, I recommend keeping this meter on the watch list and re-checking after the next reading cycle. If you need a specific action (e.g. dispatch, report), say what you’d like and I’ll tailor the steps.`,
        timestamp: new Date(),
      }])
    }, 1000)
  }

  return (
    <div
      ref={dragRef}
      className="fixed z-40 w-[380px] max-h-[calc(100vh-8rem)] rounded-xl border shadow-xl flex flex-col overflow-hidden"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      role="region"
      aria-label="Network Meter Details"
    >
      {/* Header - sticky at top, does not scroll */}
      <div
        className="flex justify-between items-center p-2 border-b select-none shrink-0"
        style={{
          borderColor: 'var(--color-gray-700)',
          cursor: 'grab',
          backgroundColor: 'var(--sand-surface)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <Gauge className="h-4 w-4" style={{ color: 'var(--color-blue-400)' }} />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              Network Meter Details
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
              Meter {sensor.sensorId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            style={{ color: 'var(--color-gray-400)' }}
            onClick={() => setSelectedSensor(null)}
            aria-label="Close network meter details panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content - scrollable; header stays fixed */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {/* Anomaly Alert (only for critical/warning) */}
        {(sensor.status === 'critical' || sensor.status === 'warning') && (
          <div
            className="border-l-4 p-3 mb-3 rounded"
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.borderColor
            }}
          >
            <div className="flex items-start">
              <TriangleAlert
                className="h-5 w-5 mr-2 shrink-0 mt-0.5"
                style={{ color: config.color }}
              />
              <div>
                <h3
                  className="text-sm font-medium mb-1"
                  style={{ color: config.color }}
                >
                  {config.label}
                </h3>
                <p className="text-xs mb-2" style={{ color: 'var(--color-gray-300)' }}>
                  {config.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--color-red-900)',
                      color: 'var(--color-red-300)'
                    }}
                  >
                    Pressure: {config.pressureDisplay}
                  </span>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--color-red-900)',
                      color: 'var(--color-red-300)'
                    }}
                  >
                    Flow: {config.flow} L/min {sensor.status === 'critical' ? '↑' : ''}
                  </span>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--color-red-900)',
                      color: 'var(--color-red-300)'
                    }}
                  >
                    Quality: {config.quality} {sensor.status === 'critical' ? '↓' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="w-full">
          <div
            role="tablist"
            className="grid w-full grid-cols-2 h-8 p-1 rounded-md mb-2"
            style={{ backgroundColor: 'var(--color-gray-800)' }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
              className="inline-flex items-center justify-center rounded-sm px-3 text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'stats' ? 'var(--sand-surface)' : 'transparent',
                color: activeTab === 'stats' ? 'var(--color-gray-100)' : 'var(--color-gray-400)'
              }}
            >
              Statistics
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center justify-center rounded-sm px-3 text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'overview' ? 'var(--sand-surface)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--color-gray-100)' : 'var(--color-gray-400)'
              }}
            >
              Overview
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stats' && (
            <div className="space-y-2 mt-2">
              {/* Pressure Chart */}
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4
                  className="text-xs font-medium mb-1 flex items-center"
                  style={{ color: 'var(--color-gray-200)' }}
                >
                  Pressure (kPa)
                  {sensor.status === 'critical' && (
                    <span
                      className="ml-2 flex items-center text-[10px]"
                      style={{ color: 'var(--color-red-400)' }}
                      title="Anomaly detected at 9:30 AM"
                    >
                      <TriangleAlert className="mr-1 h-3 w-3" />
                      Anomaly Detected
                    </span>
                  )}
                </h4>
                <SensorChart
                  data={SENSOR_CHART_DATA[sensor.sensorId]?.pressure || []}
                  dataKey="value"
                  chartTitle="Pressure"
                  unit="kPa"
                  color="#3b82f6"
                  showAnomaly={sensor.status === 'critical'}
                  anomalyTime="2026-05-06T09:30:00Z"
                />
              </div>

              {/* Flow Rate Chart */}
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4
                  className="text-xs font-medium mb-1 flex items-center"
                  style={{ color: 'var(--color-gray-200)' }}
                >
                  Flow Rate (L/min)
                  {sensor.status === 'critical' && (
                    <span
                      className="ml-2 flex items-center text-[10px]"
                      style={{ color: 'var(--color-red-400)' }}
                      title="Anomaly detected at 9:30 AM"
                    >
                      <TriangleAlert className="mr-1 h-3 w-3" />
                      Anomaly Detected
                    </span>
                  )}
                </h4>
                <SensorChart
                  data={SENSOR_CHART_DATA[sensor.sensorId]?.flow || []}
                  dataKey="value"
                  chartTitle="Flow Rate"
                  unit="L/min"
                  color="#10b981"
                  showAnomaly={sensor.status === 'critical'}
                  anomalyTime="2026-05-06T09:30:00Z"
                />
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-2 mt-2">
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-gray-100)' }}
                >
                  Meter Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Meter ID</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>M-LN17099-CUSTOM</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Type</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>Combined</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Status</span>
                    <span
                      style={{
                        color: 'var(--color-green-400)',
                        textTransform: 'lowercase'
                      }}
                    >
                      active
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Pipe ID</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>1240</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Manufacturer</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>WaterStat</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Model</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>HydroDual</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Installed</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>May 3, 2025</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Last Calibration</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>Apr 3, 2025</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Battery Status</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>99%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-gray-400)' }}>Last Reading</span>
                    <span style={{ color: 'var(--color-gray-200)' }}>06/05/2025, 03:00:00</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Smart Interactions - meter-adapted */}
        <div
          className="mt-3 pt-2.5"
          style={{ borderTop: '1px solid var(--color-gray-700)', height: 'fit-content' }}
        >
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
              <span className="ai-toggle-slider" />
              <span className="ai-toggle-label">Inline AI</span>
            </label>
          </div>

          {!inlineAIMode ? (
            <>
              <button
                onClick={handleSendToCopilot}
                type="button"
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
                Add context to WaterOS Copilot
              </button>
              <p className="text-center mt-1.5" style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>
                Get AI-powered analysis for this meter
              </p>
            </>
          ) : (
            <div className="inline-ai-container">
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
                      {msg.type === 'ai' && msg.id === inlineAIMessages[0]?.id && !isApproved && (
                        <div className="inline-ai-actions">
                          <button type="button" onClick={handleApprove} className="inline-ai-btn inline-ai-btn-approve">
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button type="button" onClick={handleModify} className="inline-ai-btn inline-ai-btn-modify">
                            <PenLine className="w-3 h-3" />
                            Modify
                          </button>
                          <button type="button" onClick={handleAskMore} className="inline-ai-btn inline-ai-btn-ask">
                            <Send className="w-3 h-3" />
                            Ask More
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!isApproved && (
                <div className="inline-ai-input-wrapper">
                  <input
                    type="text"
                    className="inline-ai-input"
                    placeholder="Ask a follow-up about this meter..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleSendMessage(e.target.value)
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
