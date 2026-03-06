import { useState } from 'react'
import {
  ChevronDown,
  Droplets,
  Pipette,
  Layers,
  Sparkles,
  Ellipsis,
  User,
} from 'lucide-react'
import { usePanelContext } from '../contexts/PanelContext'

// Notification Badge Component
const NotificationBadge = ({ count }) => {
  if (count === 0) return null
  
  return (
    <span
      className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
      style={{
        background: '#ef4444',
        color: 'white',
        marginLeft: '4px',
      }}
    >
      {count}
    </span>
  )
}

export default function NavRight() {
  const [analysisExpanded, setAnalysisExpanded] = useState(false)
  const { toggleCopilot, toggleEventArea, toggleLayers, eventAreaCount, pressureCount } = usePanelContext()
  
  const totalAnalysisCount = eventAreaCount + pressureCount

  return (
    <div className="flex items-center gap-3">
      {/* Analysis dropdown group */}
      <div 
        className="flex items-center h-7 rounded-md border transition-colors duration-200"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <button 
          className="flex items-center h-full text-white text-xs px-2 rounded-md transition-colors whitespace-nowrap"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => setAnalysisExpanded(!analysisExpanded)}
        >
          Analysis
          {!analysisExpanded && <NotificationBadge count={totalAnalysisCount} />}
          <ChevronDown className="w-3 h-3 ml-1" aria-hidden="true" />
        </button>
        <div 
          className="grid transition-[grid-template-columns] duration-200 ease-out h-full"
          style={{ gridTemplateColumns: analysisExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden flex items-center min-w-0 h-full">
            <div className="w-px h-3.5 flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.15)' }} />
            <button 
              className="flex items-center h-full text-white text-xs px-2 whitespace-nowrap transition-colors rounded-md"
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              <Droplets className="w-3 h-3 mr-1" aria-hidden="true" />
              Pressure
              {analysisExpanded && <NotificationBadge count={pressureCount} />}
            </button>
            <button 
              className="flex items-center h-full text-white text-xs px-2 whitespace-nowrap transition-colors rounded-md"
              title="View pipes affected by curated pressure events"
              onClick={(e) => {
                e.stopPropagation()
                toggleEventArea()
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Pipette className="w-3 h-3 mr-1" aria-hidden="true" />
              Event Area
              {analysisExpanded && <NotificationBadge count={eventAreaCount} />}
            </button>
          </div>
        </div>
      </div>

      {/* Layers button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors rounded-md text-white text-xs h-7 px-2"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        onClick={toggleLayers}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
      >
        <Layers className="w-3 h-3 mr-1" aria-hidden="true" />
        Layers
      </button>

      {/* Copilot button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors rounded-md text-white text-xs h-7 px-2"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        title="Water OS Copilot"
        onClick={toggleCopilot}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
        Copilot
      </button>

      {/* More tools button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors text-white h-7 w-7"
        title="More tools"
        type="button"
        disabled
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        <Ellipsis className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* User avatar button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors text-white h-7 w-7"
        aria-label="User settings"
        type="button"
        disabled
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
          <User className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </button>
    </div>
  )
}
