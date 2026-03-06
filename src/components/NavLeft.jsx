import { MapPin, ChevronDown } from 'lucide-react'

export default function NavLeft() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center justify-center h-8 shrink-0">
          <span className="text-xl font-bold text-white leading-tight tracking-tight">
            SAND
          </span>
        </div>
        <div className="h-6 w-px shrink-0" style={{ background: 'rgba(255, 255, 255, 0.2)' }} aria-hidden="true" />
        <div>
          <p className="text-xs leading-tight tracking-wide uppercase" style={{ opacity: 0.7 }}>
            St. Louis, MO
          </p>
          <h1 className="font-semibold text-sm leading-tight">
            Water OS
          </h1>
        </div>
      </div>
      <div className="relative">
        <button 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          title="Switch city"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-medium">St. Louis, MO</span>
          <ChevronDown className="w-3 h-3 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
