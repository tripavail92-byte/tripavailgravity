import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const glassButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'glass-button text-primary-foreground hover:opacity-90 hover:shadow-md hover:shadow-primary/20',
        light:
          'bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 hover:border-white/50 hover:shadow-lg hover:shadow-white/20',
        dark: 'bg-black/20 backdrop-blur-md hover:bg-black/30 border border-white/20 hover:border-white/30 text-white hover:shadow-lg hover:shadow-black/20',
        outline:
          'bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 hover:shadow-md',
        ghost:
          'bg-transparent backdrop-blur-none hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-sm',
        floating:
          'bg-white/90 backdrop-blur-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 border border-white/50 hover:scale-105',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> {
  /**
   * Render as child component (for react-router Link, etc.)
   * @default false
   */
  asChild?: boolean
  /**
   * Custom blur intensity
   */
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

const blurClasses: Record<string, string> = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

/**
 * GlassButton - A glassmorphism button component
 *
 * @example
 * ```tsx
 * <GlassButton variant="light" size="lg">
 *   Click Me
 * </GlassButton>
 * ```
 *
 * @example Floating action button
 * ```tsx
 * <GlassButton variant="floating" size="icon">
 *   <Heart className="w-4 h-4" />
 * </GlassButton>
 * ```
 */
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, blur, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const blurClass = blur ? blurClasses[blur] : ''

    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }), blurClass)}
        ref={ref}
        {...props}
      />
    )
  },
)

GlassButton.displayName = 'GlassButton'

export { GlassButton, glassButtonVariants }
