/**
 * Role-based brand colors — ported 1:1 from the web design system
 * (`packages/web/src/theme/tokens/colors.ts` → `colorTokens.roles`).
 *
 * Each role has its OWN primary brand color. The active role drives `--primary`
 * at runtime (see ThemeProvider), exactly like the web `:root[data-role='…']`
 * blocks in `index.css`.
 *
 *   traveller     → #FF385C  Airbnb rose   (hsl 350.5 100% 60%)
 *   tour_operator → #FD5E53  coral         (hsl   4  98% 66%)
 *   hotel_manager → #9D4EDD  purple→cyan   (hsl 274  70% 60%)
 */

export type RoleKey = 'traveller' | 'tour_operator' | 'hotel_manager'

// Raw HSL triplets (space syntax) — the format NativeWind `vars()` needs so the
// Tailwind config can resolve `hsl(var(--primary))`. Matches the web tokens.
const TRIPLETS: Record<RoleKey, { primary: string; light: string; fg: string }> = {
  traveller: { primary: '350.5 100% 60%', light: '350.5 100% 70%', fg: '0 0% 100%' },
  tour_operator: { primary: '4 98% 66%', light: '4 98% 76%', fg: '0 0% 100%' },
  hotel_manager: { primary: '274 70% 60%', light: '186 100% 50%', fg: '0 0% 100%' },
}

/** Convert an HSL triplet ("350.5 100% 60%") to an RN-parseable color string. */
function toRnHsl(triplet: string, alpha?: number): string {
  const [h, s, l] = triplet.split(' ')
  return alpha == null ? `hsl(${h}, ${s}, ${l})` : `hsla(${h}, ${s}, ${l}, ${alpha})`
}

export interface RoleColors {
  key: RoleKey
  /** HSL triplets for NativeWind `vars()` (no `hsl(...)` wrapper). */
  primaryHsl: string
  primaryLightHsl: string
  primaryForegroundHsl: string
  /** RN color strings for raw props (LinearGradient, icon `color`, ActivityIndicator). */
  primary: string
  primaryLight: string
  primaryForeground: string
  /** 2-stop brand gradient (primary → light), matching the web role gradient. */
  gradient: [string, string]
  /** Translucent brand tint for chips / icon circles. */
  softBg: string
}

function build(key: RoleKey): RoleColors {
  const t = TRIPLETS[key]
  return {
    key,
    primaryHsl: t.primary,
    primaryLightHsl: t.light,
    primaryForegroundHsl: t.fg,
    primary: toRnHsl(t.primary),
    primaryLight: toRnHsl(t.light),
    primaryForeground: toRnHsl(t.fg),
    gradient: [toRnHsl(t.primary), toRnHsl(t.light)],
    softBg: toRnHsl(t.primary, 0.1),
  }
}

export const ROLE_COLORS: Record<RoleKey, RoleColors> = {
  traveller: build('traveller'),
  tour_operator: build('tour_operator'),
  hotel_manager: build('hotel_manager'),
}

export function getRoleColors(key: RoleKey): RoleColors {
  return ROLE_COLORS[key]
}

/**
 * Map an `activeRole.role_type` to a theme key.
 * Admin and anonymous users are themed as travellers (mirrors web ThemeContext).
 */
export function resolveRoleKey(roleType?: string | null): RoleKey {
  if (roleType === 'tour_operator') return 'tour_operator'
  if (roleType === 'hotel_manager') return 'hotel_manager'
  return 'traveller'
}
