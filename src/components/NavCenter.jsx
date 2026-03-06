import { Search, Calendar, ChevronDown } from 'lucide-react'

export default function NavCenter() {
  return (
    <div className="flex-1 flex items-center justify-center gap-4 mx-4">
      <div className="relative max-w-xs hidden md:block">
        <Search
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400"
          aria-hidden="true"
        />
        <input
          className="flex rounded-md border px-3 py-1 shadow-sm transition-colors h-7 text-xs pl-7 pr-7 w-44"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
          }}
          placeholder="Search..."
          defaultValue=""
          onFocus={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onBlur={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        />
      </div>
      <button
        className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium transition-colors text-white"
        style={{ opacity: 0.7 }}
        title="Time filter (Cmd+T)"
        type="button"
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Calendar className="w-3 h-3" aria-hidden="true" />
        <span className="hidden sm:inline">All Time</span>
        <span className="sm:hidden">Filter</span>
        <ChevronDown className="w-3 h-3 transition-transform" aria-hidden="true" />
      </button>
    </div>
  )
}
