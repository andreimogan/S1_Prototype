import NavLeft from './NavLeft'
import NavCenter from './NavCenter'
import NavRight from './NavRight'

export default function TopNav() {
  return (
    <nav
      className="absolute top-4 left-4 right-4 z-50 text-white px-4 py-3 flex items-center justify-between shadow-xl border"
      style={{
        borderRadius: '8px',
        background: 'var(--sand-surface)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <NavLeft />
      <NavCenter />
      <NavRight />
    </nav>
  )
}
