/**
 * Development-Only Audit Logger
 * 
 * Logs warnings when hardcoded colors are detected in development.
 * This helps catch regressions during migration.
 * 
 * Usage: Import at top of main.tsx during development
 */

if (import.meta.env.DEV) {
  // Intercept className assignments to detect hardcoded colors
  const originalSetAttribute = Element.prototype.setAttribute

  Element.prototype.setAttribute = function (name: string, value: string) {
    if (name === 'class' || name === 'className') {
      // Detect hardcoded color patterns
      const hardcodedPatterns = [
        /bg-gray-\d+/,
        /text-gray-\d+/,
        /border-gray-\d+/,
        /bg-red-\d+/,
        /bg-green-\d+/,
        /bg-blue-\d+/,
        /bg-yellow-\d+/,
        /bg-purple-\d+/,
        /bg-pink-\d+/,
        /bg-orange-\d+/,
        /text-red-\d+/,
        /text-green-\d+/,
        /text-blue-\d+/,
        /border-red-\d+/,
        /border-green-\d+/,
        /border-blue-\d+/,
      ]

      for (const pattern of hardcodedPatterns) {
        if (pattern.test(value)) {
          const matches = value.match(pattern)
          console.warn(
            `🎨 [Theme Audit] Hardcoded color detected: ${matches?.[0]}`,
            '\n  Element:', this,
            '\n  Full className:', value,
            '\n  ❌ Should use semantic tokens instead (e.g., bg-surface-*, text-*, bg-category-*)',
          )
        }
      }
    }

    return originalSetAttribute.call(this, name, value)
  }

  console.log('🎨 [Theme Audit] Color detection enabled for development')
}

export {}
