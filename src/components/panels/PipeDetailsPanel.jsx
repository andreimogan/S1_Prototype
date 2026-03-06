import { X, GripVertical } from 'lucide-react'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'

export default function PipeDetailsPanel({ waterMain, index }) {
  const { removeWaterMain } = usePanelContext()
  // Offset each dialog slightly based on index
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ 
    x: 288 + (index * 30), 
    y: 80 + (index * 30) 
  })

  if (!waterMain) return null

  const riskLevel = waterMain.properties?.riskLevel || 'medium'
  const waterMainId = waterMain.uniqueId

  // Generate pipe ID in format LN######
  let idNumber = '000000'
  if (waterMain.id) {
    const parts = String(waterMain.id).split('-')
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      idNumber = lastPart.padStart(6, '0').slice(-6)
    }
  }
  const pipeId = `LN${idNumber}`

  // Static values based on risk level
  const pipeType = riskLevel === 'high' ? 'Type 0 (Local)' : riskLevel === 'medium' ? 'Type 1 (Secondary)' : 'Type 2 (Main)'
  const material = 'Ductile Iron Pipe (DIP)'
  const diameter = riskLevel === 'high' ? 200 : riskLevel === 'medium' ? 250 : 300
  const length = riskLevel === 'high' ? 407.00 : riskLevel === 'medium' ? 520.50 : 680.25
  const installYear = riskLevel === 'high' ? 1985 : riskLevel === 'medium' ? 1995 : 2005
  
  // Static age calculation
  const currentYear = 2022
  const age = currentYear - installYear
  const agePercentage = ((age / (currentYear - 1930)) * 100)
  
  // Badge styling
  const badgeStyle = riskLevel === 'high' 
    ? { backgroundColor: 'var(--color-red-900)', color: 'var(--color-red-300)' }
    : riskLevel === 'medium' 
    ? { backgroundColor: 'var(--color-orange-900)', color: 'var(--color-orange-300)' }
    : { backgroundColor: 'var(--color-green-600)', color: 'var(--color-green-100)' }
  
  const badgeText = riskLevel === 'high' 
    ? 'Distribution Main' 
    : riskLevel === 'medium' 
    ? 'Secondary Main' 
    : 'Primary Main'

  return (
    <div 
      ref={dragRef}
      className="fixed z-50 w-[380px] max-h-[calc(100vh-8rem)] border shadow-lg overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      data-state="open"
    >
      <div className="flex flex-col h-full">
        {/* Header - draggable */}
        <div 
          className="flex justify-between items-center p-3 border-b select-none shrink-0"
          style={{
            borderColor: 'var(--color-gray-700)',
            cursor: 'grab',
            backgroundColor: 'var(--sand-surface)'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              Water Main - Pipe Details
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              style={{ color: 'var(--color-gray-400)' }}
              aria-label="Close information panel"
              onClick={() => removeWaterMain(waterMainId)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {/* Asset Header */}
          <div 
            className="rounded-lg p-2.5 border"
            style={{
              backgroundColor: 'var(--color-blue-900)',
              borderColor: 'var(--color-blue-700)'
            }}
          >
            <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--color-blue-300)' }}>
              Asset ID: <span>{pipeId}</span>
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-blue-400)' }}>
              <span className="font-medium">EXECUTIVE CRT</span>
            </p>
            <div 
              className="mt-1 text-xs px-2 py-0.5 rounded-full inline-block"
              style={badgeStyle}
            >
              {badgeText}
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            {/* Pipe Type and Material */}
            <div className="grid grid-cols-2 gap-2">
              <div 
                className="p-2.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4 className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-gray-400)' }}>
                  Pipe Type
                </h4>
                <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                  {pipeType}
                </p>
              </div>
              <div 
                className="p-2.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4 className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-gray-400)' }}>
                  Material
                </h4>
                <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                  {material}
                </p>
              </div>
            </div>

            {/* Diameter and Length */}
            <div className="grid grid-cols-2 gap-2">
              <div 
                className="p-2.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4 className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-gray-400)' }}>
                  Diameter
                </h4>
                <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                  {diameter} mm
                </p>
              </div>
              <div 
                className="p-2.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: 'var(--color-gray-700)'
                }}
              >
                <h4 className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-gray-400)' }}>
                  Length
                </h4>
                <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                  {length} m
                </p>
              </div>
            </div>

            {/* Installation Year */}
            <div 
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-gray-400)' }}>
                Installation Year
              </h4>
              <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                {installYear}
              </p>
              <div 
                className="mt-1.5 rounded-full h-1.5"
                style={{ backgroundColor: 'var(--color-gray-700)' }}
              >
                <div 
                  className="h-1.5 rounded-full" 
                  style={{ 
                    width: `${agePercentage}%`,
                    backgroundColor: 'var(--color-orange-500)'
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--color-gray-400)' }}>
                <span>1930</span>
                <span>{age} years old</span>
                <span>{currentYear}</span>
              </div>
            </div>

            {/* Connected Pipes */}
            <div 
              className="pt-3"
              style={{ borderTop: '1px solid var(--color-gray-700)' }}
            >
              <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--color-gray-100)' }}>
                Connected Pipes
              </h4>
              <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
                Data not available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
