import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'glass-badge text-foreground',
        light: 'bg-white/90 backdrop-blur-md border border-white/30 text-gray-900 shadow-sm',
        dark: 'bg-black/70 backdrop-blur-md border border-white/20 text-white',
        primary: 'bg-primary/80 backdrop-blur-md text-primary-foreground border border-primary/40',
        secondary: 'bg-secondary/80 backdrop-blur-md text-secondary-foreground border border-secondary/40',
        success: 'bg-green-500/80 backdrop-blur-md text-white border border-green-400/40',
        warning: 'bg-yellow-500/80 backdrop-blur-md text-white border border-yellow-400/40',
        error: 'bg-red-500/80 backdrop-blur-md text-white border border-red-400/40',
        info: 'bg-blue-500/80 backdrop-blur-md text-white border border-blue-400/40',
        outline: 'bg-white/20 backdrop-blur-sm border border-white/40 text-foreground',
        ghost: 'bg-transparent backdrop-blur-none hover:bg-white/10 hover:backdrop-blur-sm',
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
  }
)

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassBadgeVariants> {
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
    <div
      className={cn(glassBadgeVariants({ variant, size }), blurClass, className)}
      {...props}
    >
      {icon && <span className="mr-1 inline-flex items-center">{icon}</span>}
      {children}
    </div>
  )
}

export { GlassBadge, glassBadgeVariants }
