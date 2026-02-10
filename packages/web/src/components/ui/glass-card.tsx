import * as React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

export type GlassVariant = 'light' | 'dark' | 'card' | 'nav' | 'nav-bottom' | 'button' | 'overlay' | 'badge'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Glass effect variant
   * @default 'light'
   */
  variant?: GlassVariant
  /**
   * Custom blur intensity (overrides variant default)
   * @default undefined (uses variant's default)
   */
  blur?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  /**
   * Whether to render as a section element instead of div
   * @default false
   */
  asSection?: boolean
  /**
   * Whether to render as an article element instead of div
   * @default false
   */
  asArticle?: boolean
  /**
   * Whether to render as a motion.div for animations
   * @default false
   */
  asMotion?: boolean
  /**
   * Motion props (only used when asMotion is true)
   */
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  transition?: HTMLMotionProps<'div'>['transition']
  exit?: HTMLMotionProps<'div'>['exit']
}

const variantClasses: Record<GlassVariant, string> = {
  light: 'glass',
  dark: 'glass-dark',
  card: 'glass-card',
  nav: 'glass-nav',
  'nav-bottom': 'glass-nav-bottom',
  button: 'glass-button',
  overlay: 'glass-overlay',
  badge: 'glass-badge',
}

const blurClasses: Record<string, string> = {
  xs: 'backdrop-blur-xs',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl',
  '4xl': 'backdrop-blur-4xl',
}

/**
 * GlassCard - A reusable glassmorphism component
 * 
 * @example
 * ```tsx
 * <GlassCard variant="card" className="p-6 rounded-2xl">
 *   <h2>Premium Content</h2>
 * </GlassCard>
 * ```
 * 
 * @example Custom blur
 * ```tsx
 * <GlassCard variant="light" blur="xl" className="rounded-lg p-4">
 *   More blur intensity
 * </GlassCard>
 * ```
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', blur, asSection, asArticle, asMotion, children, initial, animate, transition, exit, ...props }, ref) => {
    const glassClass = variantClasses[variant]
    const blurClass = blur ? blurClasses[blur] : ''
    
    const classes = cn(
      glassClass,
      blurClass,
      'transition-all duration-300',
      className
    )

    // Motion version
    if (asMotion) {
      return (
        <motion.div
          ref={ref}
          className={classes}
          initial={initial}
          animate={animate}
          transition={transition}
          exit={exit}
          {...(props as any)}
        >
          {children}
        </motion.div>
      )
    }

    // Semantic HTML version
    const Component = asSection ? 'section' : asArticle ? 'article' : 'div'
    
    return (
      <Component
        ref={ref as any}
        className={classes}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

GlassCard.displayName = 'GlassCard'

/**
 * GlassContent - Wrapper for content inside glass cards
 * Adds subtle padding and ensures good readability
 */
export const GlassContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))

GlassContent.displayName = 'GlassContent'

/**
 * GlassHeader - Header section for glass cards
 */
export const GlassHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))

GlassHeader.displayName = 'GlassHeader'

/**
 * GlassTitle - Title for glass cards
 */
export const GlassTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))

GlassTitle.displayName = 'GlassTitle'

/**
 * GlassDescription - Description text for glass cards
 */
export const GlassDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))

GlassDescription.displayName = 'GlassDescription'

/**
 * GlassFooter - Footer section for glass cards
 */
export const GlassFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))

GlassFooter.displayName = 'GlassFooter'
