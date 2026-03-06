import { useState } from 'react'
import { X, Minus, GripVertical, Droplets, AlertTriangle, Users, Activity, MapPin } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'
import SensorChart from '../charts/SensorChart'

// Zone performance data - network pressure (PSI) matching Figma design
// Curve: starts ~62.5 at 5:00, dips to ~50 by 18:30, ~47 by 20:00, slight recovery, ~47.5 at 22:00
const ZONE_PERFORMANCE_DATA = [
  { time: '2026-05-06T05:00:00Z', value: 62.5, timestamp: new Date('2026-05-06T05:00:00Z').getTime() },
  { time: '2026-05-06T10:00:00Z', value: 61.8, timestamp: new Date('2026-05-06T10:00:00Z').getTime() },
  { time: '2026-05-06T14:00:00Z', value: 59.2, timestamp: new Date('2026-05-06T14:00:00Z').getTime() },
  { time: '2026-05-06T16:00:00Z', value: 56.5, timestamp: new Date('2026-05-06T16:00:00Z').getTime() },
  { time: '2026-05-06T17:00:00Z', value: 54.2, timestamp: new Date('2026-05-06T17:00:00Z').getTime() },
  { time: '2026-05-06T18:00:00Z', value: 51.8, timestamp: new Date('2026-05-06T18:00:00Z').getTime() },
  { time: '2026-05-06T18:30:00Z', value: 50.5, timestamp: new Date('2026-05-06T18:30:00Z').getTime() },
  { time: '2026-05-06T19:00:00Z', value: 48.8, timestamp: new Date('2026-05-06T19:00:00Z').getTime() },
  { time: '2026-05-06T19:30:00Z', value: 47.0, timestamp: new Date('2026-05-06T19:30:00Z').getTime() },
  { time: '2026-05-06T20:00:00Z', value: 47.5, timestamp: new Date('2026-05-06T20:00:00Z').getTime() },
  { time: '2026-05-06T20:30:00Z', value: 48.8, timestamp: new Date('2026-05-06T20:30:00Z').getTime() },
  { time: '2026-05-06T21:00:00Z', value: 49.0, timestamp: new Date('2026-05-06T21:00:00Z').getTime() },
  { time: '2026-05-06T21:30:00Z', value: 48.2, timestamp: new Date('2026-05-06T21:30:00Z').getTime() },
  { time: '2026-05-06T22:00:00Z', value: 47.5, timestamp: new Date('2026-05-06T22:00:00Z').getTime() },
]

// Circular Progress Indicator Component
function CircularProgress({ percentage }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: '80px', height: '80px' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--color-gray-700)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--sand-teal)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center gap-0.5" style={{ lineHeight: 1.2 }}>
        <span className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--color-gray-100)' }}>
          {percentage}%
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-gray-400)', letterSpacing: '0.02em' }}>
          Prob. Score
        </span>
      </div>
    </div>
  )
}

// Burst Card Component
function BurstCard({ burst }) {
  return (
    <div 
      className="border rounded-lg p-2.5 flex flex-col gap-2.5"
      style={{ 
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-600)'
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-1">
          <h4 className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
            {burst.id}
          </h4>
          <MapPin className="w-4 h-4" style={{ color: 'var(--color-gray-400)' }} />
        </div>
        <div className="flex gap-1.5">
          <button 
            className="border rounded-md px-2.5 py-1 transition-colors"
            style={{ 
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              borderColor: 'var(--color-gray-600)',
              color: 'var(--color-gray-300)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
              e.currentTarget.style.color = 'var(--color-gray-100)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-gray-300)'
            }}
          >
            True Burst
          </button>
          <button 
            className="border rounded-md px-2.5 py-1 transition-colors"
            style={{ 
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              borderColor: 'var(--color-gray-600)',
              color: 'var(--color-gray-300)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
              e.currentTarget.style.color = 'var(--color-gray-100)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-gray-300)'
            }}
          >
            No Burst
          </button>
        </div>
      </div>

      {/* Content Row */}
      <div className="flex items-center gap-2.5">
        <CircularProgress percentage={burst.probability} />
        
        <div className="flex-1 flex flex-col gap-2">
          {/* Top Metrics Row */}
          <div className="flex gap-6" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-100)' }}>
            <div className="flex gap-2 items-start">
              <span className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{burst.totalConnections}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', lineHeight: '1.2' }}>
                Total<br />Connections
              </span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{burst.totalCityBlocks}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', lineHeight: '1.2' }}>
                Total City<br />Blocks
              </span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>{burst.corroboratingMonitors}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', lineHeight: '1.2' }}>
                Corroborating<br />Monitors
              </span>
            </div>
          </div>

          {/* Bottom Details Row */}
          <div className="flex gap-4" style={{ fontSize: 'var(--text-xs)' }}>
            <div className="flex flex-col gap-1" style={{ color: 'var(--color-gray-100)' }}>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '76px' }}>Timestamp:</span>
                <span className="font-medium">{burst.timestamp}</span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '76px' }}>Pipe Length:</span>
                <span className="font-medium">{burst.pipeLength}</span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '76px' }}>Area (sq. mi):</span>
                <span className="font-medium">{burst.area}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1" style={{ color: 'var(--color-gray-100)' }}>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '118px' }}>Active Work Orders:</span>
                <span className="font-medium text-right" style={{ minWidth: '16px' }}>{burst.activeWorkOrders}</span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '118px' }}>Burst overlaps:</span>
                <span className="font-medium text-right" style={{ minWidth: '16px' }}>{burst.burstOverlaps}</span>
              </div>
              <div className="flex gap-1">
                <span style={{ color: 'var(--color-gray-400)', minWidth: '118px' }}>Critical contacts:</span>
                <span className="font-medium text-right" style={{ minWidth: '16px' }}>{burst.criticalContacts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PressureZonePanel() {
  const { pressureZoneVisible, togglePressureZone, selectedZone } = usePanelContext()
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 24, y: 80 })
  const [activeTab, setActiveTab] = useState('overview')
  const [ragMode, setRagMode] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!pressureZoneVisible || !selectedZone) return null

  // Burst POIs: all with probability between 1-25%
  const burstPOIs = [
    {
      id: 'Burst ID 73625',
      probability: 24,
      isTrueBurst: false,
      totalConnections: 143,
      totalCityBlocks: 17,
      corroboratingMonitors: 2,
      timestamp: '12/08/2025 16:37:08',
      pipeLength: '123 Miles',
      area: '86',
      activeWorkOrders: 5,
      burstOverlaps: 2,
      criticalContacts: 36
    },
    {
      id: 'Burst ID 73812',
      probability: 19,
      isTrueBurst: false,
      totalConnections: 218,
      totalCityBlocks: 32,
      corroboratingMonitors: 2,
      timestamp: '13/08/2025 23:27:23',
      pipeLength: '123 Miles',
      area: '86',
      activeWorkOrders: 4,
      burstOverlaps: 2,
      criticalContacts: 36
    },
    {
      id: 'Burst ID 73742',
      probability: 15,
      isTrueBurst: false,
      totalConnections: 181,
      totalCityBlocks: 23,
      corroboratingMonitors: 1,
      timestamp: '12/08/2025 09:21:38',
      pipeLength: '123 Miles',
      area: '86',
      activeWorkOrders: 9,
      burstOverlaps: 3,
      criticalContacts: 36
    },
    {
      id: 'Burst ID 73719',
      probability: 9,
      isTrueBurst: false,
      totalConnections: 374,
      totalCityBlocks: 56,
      corroboratingMonitors: 2,
      timestamp: '13/08/2025 13:43:53',
      pipeLength: '123 Miles',
      area: '86',
      activeWorkOrders: 23,
      burstOverlaps: 4,
      criticalContacts: 36
    },
    {
      id: 'Burst ID 73793',
      probability: 4,
      isTrueBurst: false,
      totalConnections: 240,
      totalCityBlocks: 38,
      corroboratingMonitors: 1,
      timestamp: '13/08/2025 13:43:53',
      pipeLength: '123 Miles',
      area: '86',
      activeWorkOrders: 5,
      burstOverlaps: 4,
      criticalContacts: 36
    }
  ]

  // Calculate RAG bar widths based on redPipePercent
  const redPipePercent = selectedZone.redPipePercent || 7.67
  const amberPercent = 20 // Estimated warning zone
  const greenPercent = 100 - redPipePercent - amberPercent

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'burst-pois', label: 'Burst POIs' },
    { id: 'monitors', label: 'Monitors' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'work-orders', label: 'Work Orders' }
  ]

  return (
    <div
      className="rounded-xl border fixed shadow-xl overflow-hidden flex flex-col pt-0 pb-4"
      role="region"
      aria-label="Pressure Zone Details"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '520px',
        maxHeight: 'calc(100vh - 7rem)',
        backgroundColor: 'var(--sand-surface)',
        color: 'var(--color-gray-100)',
        borderColor: 'var(--color-gray-700)',
        zIndex: 25,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar with drag handle - same structure as Event Affected Area */}
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
            <Droplets className="w-4 h-4" style={{ color: 'var(--sand-teal)' }} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-gray-100)' }}>
              {selectedZone.name}
            </h2>
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
            onClick={togglePressureZone}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'; e.currentTarget.style.color = 'var(--color-gray-100)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-gray-300)' }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {!isMinimized && (
      <>
      {/* Tab Menu - below title bar */}
      <div
        className="px-3 py-2 flex gap-2"
        style={{ borderBottom: '1px solid var(--color-gray-700)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-1 py-2 transition-colors relative"
            style={{
              fontSize: 'var(--text-xs)',
              color: activeTab === tab.id ? 'var(--sand-teal)' : 'var(--color-gray-400)',
              borderBottom: activeTab === tab.id ? '2px solid var(--sand-teal)' : 'none',
              marginBottom: activeTab === tab.id ? '-2px' : '0',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--color-gray-200)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = 'var(--color-gray-400)'
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (() => {
          const connectionData = [
            { name: 'Household', value: selectedZone.householdPercent || 75, color: '#16327c' },
            { name: 'Non-household', value: selectedZone.nonHouseholdPercent || 25, color: '#0081d9' }
          ]
          return (
          <div className="space-y-4">
            {/* Zone Information - compact layout */}
            <div className="px-0 py-2" style={{ borderBottom: '1px solid var(--color-gray-700)' }}>
              <label className="block mb-2" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
                Zone information
              </label>
              <div className="flex gap-3 items-stretch">
                {/* Metrics - single column, [number] Label format, 4px row spacing */}
                <div className="flex flex-col shrink-0 min-w-0" style={{ gap: '4px' }}>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.totalConnections?.toLocaleString() || '1,263'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Total Connections</span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.criticalCustomers || '23'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Critical Customers</span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.pressureMonitors || '11'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Pressure Monitors</span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.pressureGroups || '2'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Pressure Groups</span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.burstPOIs || '9'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Burst POIs</span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>{selectedZone.complaints || '67'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Complaints</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-orange-500)' }} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>Risk:</span>
                    <span className="font-medium capitalize" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-100)' }}>{selectedZone.riskLevel}</span>
                  </div>
                </div>
                
                {/* Connection mix - chart and legend, fills remaining width */}
                <div 
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1 px-2 rounded-lg min-w-0"
                  style={{ 
                    backgroundColor: 'var(--color-gray-800)', 
                    border: '1px solid var(--color-gray-700)'
                  }}
                >
                  <div className="w-full" style={{ height: '100px', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={connectionData}
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="100%"
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {connectionData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} stroke="var(--color-gray-800)" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              const p = payload[0].payload
                              return (
                                <div style={{
                                  backgroundColor: 'var(--sand-surface)',
                                  border: '1px solid var(--color-gray-700)',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  color: 'var(--color-gray-100)'
                                }}>
                                  {p.name}: {p.value}%
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-0.5 w-full items-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
                    {connectionData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 justify-center">
                        <div 
                          className="w-2 h-2 rounded-sm shrink-0" 
                          style={{ backgroundColor: entry.color }} 
                        />
                        <span>{entry.name}:</span>
                        <span className="font-medium" style={{ color: 'var(--color-gray-200)' }}>{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pipe Network */}
            <div className="px-0 py-2" style={{ borderBottom: '1px solid var(--color-gray-700)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <label className="block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
                    Pipe Network
                  </label>
                  
                  {/* RAG Toggle */}
                  <button
                    onClick={() => setRagMode(!ragMode)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors"
                    style={{
                      fontSize: 'var(--text-xs)',
                      backgroundColor: ragMode ? 'var(--sand-teal)' : 'var(--color-gray-700)',
                      borderColor: ragMode ? 'var(--sand-teal)' : 'var(--color-gray-600)',
                      color: 'white',
                    }}
                    aria-label="Toggle RAG mode"
                  >
                    RAG
                  </button>
                </div>
                
                <div className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                  {selectedZone.totalPipeMiles || '753'} Miles
                </div>
              </div>
              
              {/* RAG Status Bar */}
              <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-gray-800)' }}>
                <div 
                  className="h-full"
                  style={{ 
                    width: `${greenPercent}%`, 
                    backgroundColor: '#7fbe48' 
                  }}
                  title={`Green: ${greenPercent.toFixed(1)}%`}
                ></div>
                <div 
                  className="h-full"
                  style={{ 
                    width: `${amberPercent}%`, 
                    backgroundColor: '#f1a728' 
                  }}
                  title={`Amber: ${amberPercent}%`}
                ></div>
                <div 
                  className="h-full"
                  style={{ 
                    width: `${redPipePercent}%`, 
                    backgroundColor: '#d43b3b' 
                  }}
                  title={`Red: ${redPipePercent.toFixed(2)}%`}
                ></div>
              </div>
            </div>
            
            {/* Performance Chart */}
            <div className="px-0 py-2" style={{ borderBottom: '1px solid var(--color-gray-700)' }}>
              <label className="block mb-2" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
                Performance
              </label>
              <div 
                className="rounded-lg overflow-hidden"
                style={{ 
                  border: '1px solid var(--color-gray-700)',
                  height: '220px'
                }}
              >
                <SensorChart
                  data={ZONE_PERFORMANCE_DATA}
                  dataKey="value"
                  chartTitle="Network Pressure"
                  unit="PSI"
                  color="#3b82f6"
                  showAnomaly={false}
                  showPressureThresholds
                  showAreaFill
                  yAxisLabel="Network Pressure"
                />
              </div>
            </div>
          </div>
        )})()}
        
        {/* Burst POIs Tab */}
        {activeTab === 'burst-pois' && (
          <div className="flex flex-col gap-4">
            {burstPOIs.map((burst, index) => (
              <BurstCard key={index} burst={burst} />
            ))}
          </div>
        )}
        
        {/* Monitors Tab */}
        {activeTab === 'monitors' && (
          <div className="flex flex-col gap-4">
            <label className="block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
              PRESSURE MONITORS
            </label>
            {[
              { name: 'Kingshighway @ Magnolia', pressure: '54.2', trend: 'trending down', status: 'Watch', statusColor: 'var(--color-amber-500)' },
              { name: 'Grand Ave Pump Station', pressure: '57.8', trend: 'stable', status: 'Nominal', statusColor: 'var(--color-green-500)' },
              { name: 'Tower Grove South', pressure: '52.3', trend: 'low', status: 'Low', statusColor: 'var(--color-red-400)' }
            ].map((monitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
                style={{ backgroundColor: 'var(--sand-surface)', borderColor: 'var(--color-gray-700)' }}
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="font-medium truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                    {monitor.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)' }}>
                    PSI {monitor.pressure} – {monitor.trend}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 font-medium"
                  style={{ fontSize: 'var(--text-xs)', backgroundColor: monitor.statusColor, color: 'white' }}
                >
                  {monitor.status}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="flex flex-col gap-4">
            <label className="block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
              RESPONSE TEAM
            </label>
            {[
              { name: 'Morgan Diaz', role: 'Zone Supervisor', phone: '(314) 555-0112' },
              { name: 'Dev Patel', role: 'Hydraulics Engineer', phone: '(314) 555-0141' },
              { name: 'Sandra Lee', role: 'Customer Liaison', phone: '(314) 555-0161' }
            ].map((contact, index) => (
              <div
                key={index}
                className="rounded-lg border p-3"
                style={{ backgroundColor: 'var(--sand-surface)', borderColor: 'var(--color-gray-700)' }}
              >
                <div className="font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-100)' }}>
                  {contact.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', marginTop: '2px' }}>
                  {contact.role} · {contact.phone}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Work Orders Tab */}
        {activeTab === 'work-orders' && (
          <div className="flex flex-col gap-4">
            <label className="block" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--sand-teal)' }}>
              ACTIVE ORDERS
            </label>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-gray-700)' }}>
              <table className="w-full" style={{ fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-gray-800)', color: 'var(--color-gray-400)' }}>
                    <th className="text-left font-semibold p-3">ORDER</th>
                    <th className="text-left font-semibold p-3">STATUS</th>
                    <th className="text-left font-semibold p-3">SCHEDULED</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { order: 'WO-44731', status: 'In Progress', scheduled: 'Nov 20, 2024' },
                    { order: 'WO-44789', status: 'Queued', scheduled: 'Nov 22, 2024' },
                    { order: 'WO-44822', status: 'Planning', scheduled: 'Nov 28, 2024' }
                  ].map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'var(--sand-surface)' : 'rgba(0,0,0,0.15)',
                        color: 'var(--color-gray-100)'
                      }}
                    >
                      <td className="p-3 font-medium">{row.order}</td>
                      <td className="p-3">{row.status}</td>
                      <td className="p-3">{row.scheduled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  )
}
