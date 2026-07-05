import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/ThemeContext'

/**
 * Dark/Light mode toggle.
 *
 * Single icon button that flips between an explicit light and dark mode based on
 * the currently *resolved* mode (so it does the intuitive thing even when the
 * user is on "system"). Placed in the top header/nav and the role drawer so the
 * theme is switchable from anywhere — not just Account Settings.
 */
export function ThemeToggle({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  const { resolvedMode, setMode } = useTheme()
  const isDark = resolvedMode === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className={cn(
        'rounded-full transition-colors',
        inverted
          ? 'text-white/80 hover:bg-white/10 hover:text-white'
          : 'text-foreground hover:bg-muted',
        className,
      )}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
