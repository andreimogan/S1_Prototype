import { X, GripVertical } from 'lucide-react'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'

export default function PressureZonePanel() {
  const { pressureZoneVisible, togglePressureZone, selectedZone } = usePanelContext()
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 420, y: 104 })

  console.log('🔍 PressureZonePanel render:', { pressureZoneVisible, hasSelectedZone: !!selectedZone })

  if (!pressureZoneVisible || !selectedZone) return null

  console.log('✅ Rendering PressureZonePanel with zone:', selectedZone)

  return (
    <div
      className="rounded-xl border fixed shadow-xl overflow-hidden flex flex-col"
      role="region"
      aria-label="Pressure Zone Details"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '280px',
        maxHeight: 'calc(100vh - 7rem)',
        backgroundColor: 'var(--sand-surface)',
        color: 'var(--color-gray-100)',
        borderColor: 'var(--color-gray-700)',
        zIndex: 25,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title bar with drag handle */}
      <div
        ref={dragRef}
        className="p-3 flex items-center justify-between select-none shrink-0"
        style={{
          borderBottom: '1px solid var(--color-gray-700)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-gray-400)' }}>
              Pressure Zones
            </span>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-gray-100)' }}>
              Pressure Zone
            </span>
          </div>
        </div>
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--color-gray-400)' }}
          onClick={togglePressureZone}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Subtitle */}
      <div
        className="px-3 py-2"
        style={{
          borderBottom: '1px solid var(--color-gray-700)',
          backgroundColor: 'rgba(26, 29, 34, 0.4)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-gray-200)' }}>
          {selectedZone.name}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          {/* Zone Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-gray-400)' }}>
              Zone
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
              {selectedZone.name}
            </p>
          </div>

          {/* Risk Level Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-gray-400)' }}>
              Risk Level
            </p>
            <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-gray-100)' }}>
              {selectedZone.riskLevel} Risk
            </p>
          </div>

          {/* Red Pipe % Section */}
          {selectedZone.redPipePercent !== undefined && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-gray-400)' }}>
                Red Pipe %
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
                {selectedZone.redPipePercent.toFixed(2)} %
              </p>
            </div>
          )}

          {/* Complaints Section */}
          {selectedZone.complaints !== undefined && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-gray-400)' }}>
                Complaints
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
                {selectedZone.complaints}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
