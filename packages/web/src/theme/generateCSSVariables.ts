/**
 * CSS Variable Generation
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH AT RUNTIME.
 *
 * Flow: TS Tokens → CSS Variables → Tailwind → Components
 *
 * CRITICAL: Components should NEVER import colorTokens directly.
 * They must use CSS variables or Tailwind classes.
 */

import { colorTokens } from './tokens/colors'

/**
 * Generate CSS variables for light mode
 */
export function generateLightModeVariables(): string {
  const { light, semantic } = colorTokens

  return `
    /* Surface/Background tokens */
    --surface-default: ${light.background.primary};
    --surface-raised: ${light.background.secondary};
    --surface-card: ${light.background.surface};
    --surface-popover: ${light.background.surface};
    --surface-input: ${light.background.tertiary};
    --surface-overlay: ${light.background.overlay};
    --surface-hover: ${light.background.hover};

    /* Text tokens */
    --text-default: ${light.foreground.primary};
    --text-muted: ${light.foreground.secondary};
    --text-subtle: ${light.foreground.tertiary};
    --text-disabled: ${light.foreground.disabled};
    --text-inverse: ${colorTokens.dark.foreground.primary};

    /* Border tokens */
    --border-default: ${light.border.primary};
    --border-subtle: ${light.border.secondary};
    --border-strong: ${light.border.primary};
    --border-focus: ${light.border.focus};
    --border-hover: ${light.border.hover};

    /* Status tokens */
    --status-success: ${semantic.success.DEFAULT};
    --status-success-subtle: ${semantic.success.light};
    --status-warning: ${semantic.warning.DEFAULT};
    --status-warning-subtle: ${semantic.warning.light};
    --status-error: ${semantic.error.DEFAULT};
    --status-error-subtle: ${semantic.error.light};
    --status-info: ${semantic.info.DEFAULT};
    --status-info-subtle: ${semantic.info.light};

    /* Legacy compatibility */
    --background: ${light.background.primary};
    --foreground: ${light.foreground.primary};
    --card: ${light.background.surface};
    --card-foreground: ${light.foreground.primary};
    --border: ${light.border.primary};
    --input: ${light.border.primary};
  `
}

/**
 * Generate CSS variables for dark mode
 */
export function generateDarkModeVariables(): string {
  const { dark, semantic } = colorTokens

  return `
    /* Surface/Background tokens */
    --surface-default: ${dark.background.primary};
    --surface-raised: ${dark.background.secondary};
    --surface-card: ${dark.background.surface};
    --surface-popover: ${dark.background.surface};
    --surface-input: ${dark.background.tertiary};
    --surface-overlay: ${dark.background.overlay};
    --surface-hover: ${dark.background.hover};

    /* Text tokens */
    --text-default: ${dark.foreground.primary};
    --text-muted: ${dark.foreground.secondary};
    --text-subtle: ${dark.foreground.tertiary};
    --text-disabled: ${dark.foreground.disabled};
    --text-inverse: ${colorTokens.light.foreground.primary};

    /* Border tokens */
    --border-default: ${dark.border.primary};
    --border-subtle: ${dark.border.secondary};
    --border-strong: ${dark.border.primary};
    --border-focus: ${dark.border.focus};
    --border-hover: ${dark.border.hover};

    /* Status tokens */
    --status-success: ${semantic.success.DEFAULT};
    --status-success-subtle: ${semantic.success.dark};
    --status-warning: ${semantic.warning.DEFAULT};
    --status-warning-subtle: ${semantic.warning.dark};
    --status-error: ${semantic.error.DEFAULT};
    --status-error-subtle: ${semantic.error.dark};
    --status-info: ${semantic.info.DEFAULT};
    --status-info-subtle: ${semantic.info.dark};

    /* Legacy compatibility */
    --background: ${dark.background.primary};
    --foreground: ${dark.foreground.primary};
    --card: ${dark.background.surface};
    --card-foreground: ${dark.foreground.primary};
    --border: ${dark.border.primary};
    --input: ${dark.border.primary};
  `
}

/**
 * Generate role-specific CSS variables
 */
export function generateRoleVariables(role: 'traveller' | 'hotelManager' | 'tourOperator'): string {
  const roleColors = colorTokens.roles[role]

  return `
    /* Role-based branding */
    --primary: ${roleColors.primary};
    --primary-foreground: ${roleColors.primaryForeground};
    
    /* Interactive tokens (role-branded) */
    --interactive-primary: ${roleColors.primary};
    --interactive-primary-hover: ${roleColors.primaryHover};
    --interactive-primary-active: ${roleColors.primaryActive};
    --interactive-primary-disabled: ${roleColors.primary} / 0.5;
    
    --text-link: ${roleColors.primary};
    --text-link-hover: ${roleColors.primaryHover};
    
    --border-error: hsl(${colorTokens.semantic.error.DEFAULT});
  `
}
