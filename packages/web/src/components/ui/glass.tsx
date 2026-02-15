/**
 * Glassmorphism UI Components
 *
 * A collection of reusable glass-effect components for TripAvail
 * Provides consistent, premium UI across the application
 */

// Glass Card Components
export {
  GlassCard,
  type GlassCardProps,
  GlassContent,
  GlassDescription,
  GlassFooter,
  GlassHeader,
  GlassTitle,
  type GlassVariant,
} from './glass-card'

// Glass Button Component
export { GlassButton, type GlassButtonProps, glassButtonVariants } from './glass-button'

// Glass Badge Component
export { GlassBadge, type GlassBadgeProps, glassBadgeVariants } from './glass-badge'

/**
 * Quick Start
 *
 * @example Basic glass card
 * ```tsx
 * import { GlassCard, GlassHeader, GlassTitle, GlassContent } from '@/components/ui/glass'
 *
 * <GlassCard variant="card" className="rounded-2xl p-6">
 *   <GlassHeader>
 *     <GlassTitle>Premium Content</GlassTitle>
 *   </GlassHeader>
 *   <GlassContent>
 *     Your content here
 *   </GlassContent>
 * </GlassCard>
 * ```
 *
 * @example Glass button
 * ```tsx
 * import { GlassButton } from '@/components/ui/glass'
 *
 * <GlassButton variant="floating" size="lg">
 *   Book Now
 * </GlassButton>
 * ```
 *
 * @example Glass badge
 * ```tsx
 * import { GlassBadge } from '@/components/ui/glass'
 *
 * <GlassBadge variant="success">
 *   Featured
 * </GlassBadge>
 * ```
 */
