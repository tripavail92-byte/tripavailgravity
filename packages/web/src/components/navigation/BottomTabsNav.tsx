import { Link, useLocation } from 'react-router-dom'

export function BottomTabsNav() {
  const { pathname } = useLocation()

  const isActive = (path: string) => pathname === path

  const baseClass = 'flex flex-col items-center gap-1'
  const activeClass = 'text-primary'
  const inactiveClass = 'text-muted-foreground'

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 glass-nav-bottom flex items-center justify-around px-6 z-50">
      <Link
        to="/"
        className={`${baseClass} ${isActive('/') ? activeClass : inactiveClass}`}
        aria-current={isActive('/') ? 'page' : undefined}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center">🏠</div>
        <span className="text-[10px] font-medium">Home</span>
      </Link>

      <Link
        to="/hotels"
        className={`${baseClass} ${isActive('/hotels') ? activeClass : inactiveClass}`}
        aria-current={isActive('/hotels') ? 'page' : undefined}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center">🏨</div>
        <span className="text-[10px] font-medium">Hotels</span>
      </Link>

      <Link
        to="/tours"
        className={`${baseClass} ${isActive('/tours') ? activeClass : inactiveClass}`}
        aria-current={isActive('/tours') ? 'page' : undefined}
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center">🏔️</div>
        <span className="text-[10px] font-medium">Tours</span>
      </Link>
    </div>
  )
}
