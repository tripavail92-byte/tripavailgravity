import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const glassBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105',
  {
    variants: {
      variant: {
        default: 'glass-badge text-foreground hover:shadow-sm',
        light:
          'bg-surface-card/90 backdrop-blur-md border border-border-subtle/30 text-default shadow-sm hover:shadow-md hover:bg-surface-card',
        dark: 'bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 hover:shadow-md hover:shadow-black/30',
        primary:
          'bg-primary/80 backdrop-blur-md text-primary-foreground border border-primary/40 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30',
        secondary:
          'bg-secondary/80 backdrop-blur-md text-secondary-foreground border border-secondary/40 hover:bg-secondary/90 hover:shadow-md',
        success:
          'bg-status-success/80 backdrop-blur-md text-white border border-status-success/40 hover:bg-status-success/90 hover:shadow-md hover:shadow-status-success/30 animate-pulse-subtle',
        warning:
          'bg-status-warning/80 backdrop-blur-md text-white border border-status-warning/40 hover:bg-status-warning/90 hover:shadow-md hover:shadow-status-warning/30 animate-pulse-subtle',
        error:
          'bg-status-error/80 backdrop-blur-md text-white border border-status-error/40 hover:bg-status-error/90 hover:shadow-md hover:shadow-status-error/30 animate-pulse-subtle',
        info: 'bg-status-info/80 backdrop-blur-md text-white border border-status-info/40 hover:bg-status-info/90 hover:shadow-md hover:shadow-status-info/30',
        outline:
          'bg-white/20 backdrop-blur-sm border border-white/40 text-foreground hover:bg-white/30 hover:shadow-sm',
        ghost:
          'bg-transparent backdrop-blur-none hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-sm',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
        xl: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof glassBadgeVariants> {
  /**
   * Custom blur intensity
   */
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Icon to display before text
   */
  icon?: React.ReactNode
}

const blurClasses: Record<string, string> = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

/**
 * GlassBadge - A glassmorphism badge component for labels, tags, and status indicators
 *
 * @example
 * ```tsx
 * <GlassBadge variant="light">
 *   Featured
 * </GlassBadge>
 * ```
 *
 * @example With icon
 * ```tsx
 * <GlassBadge variant="success" icon={<Check className="w-3 h-3" />}>
 *   Verified
 * </GlassBadge>
 * ```
 *
 * @example Status badge
 * ```tsx
 * <GlassBadge variant="warning" size="sm">
 *   Pending
 * </GlassBadge>
 * ```
 */
function GlassBadge({ className, variant, size, blur, icon, children, ...props }: GlassBadgeProps) {
  const blurClass = blur ? blurClasses[blur] : ''

  return (
    <div className={cn(glassBadgeVariants({ variant, size }), blurClass, className)} {...props}>
      {icon && <span className="mr-1 inline-flex items-center">{icon}</span>}
      {children}
    </div>
  )
}

export { GlassBadge, glassBadgeVariants }
