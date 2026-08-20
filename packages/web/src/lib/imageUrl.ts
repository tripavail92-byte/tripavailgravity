/**
 * Right-size catalogue images through Supabase's image transform endpoint.
 *
 * WHY THIS EXISTS. Operator photos are served as uploaded — original dimensions AND original
 * format. One tour image was a 3.2 MB PNG (a photo saved as PNG doesn't compress) rendered in a
 * ~300 px tile; the rest were full-size JPEGs. Supabase Storage has image transformation enabled,
 * so swapping the object URL for the render URL with a width returns a WebP sized to the slot —
 * that 3.2 MB PNG becomes ~12 KB at 200 px, ~128 KB at 800 px. WebP negotiation is automatic
 * (the browser's Accept header), so we only pass width + quality.
 *
 * Only rewrites public Supabase storage object URLs; anything else (Unsplash fallback, data URIs,
 * already-transformed URLs) passes through untouched.
 */
const OBJECT_SEGMENT = '/storage/v1/object/public/'
const RENDER_SEGMENT = '/storage/v1/render/image/public/'

export function tourImage(url: string | null | undefined, width: number, quality = 72): string {
  if (!url || typeof url !== 'string') return ''
  // Leave anything that isn't a plain Supabase public object alone.
  if (!url.includes(OBJECT_SEGMENT)) return url
  const base = url.replace(OBJECT_SEGMENT, RENDER_SEGMENT)
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}width=${Math.round(width)}&quality=${quality}`
}
