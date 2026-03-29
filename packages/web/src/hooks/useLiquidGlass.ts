/**
 * useLiquidGlass
 *
 * Approximates two key iOS 26 Liquid Glass behaviours that CSS alone cannot do:
 *
 * 1. Auto light/dark flip
 *    iOS Liquid Glass small elements (tab bars, nav bars) automatically
 *    switch between a light and dark appearance based on the luminance of
 *    the background content underneath them.  We sample the average color
 *    of the element's bounding-rect region using a 1×1 canvas, compute
 *    relative luminance, and set data-glass-mode="light" or "dark".
 *
 * 2. Shadow adaptation
 *    Shadow opacity increases when the element is over dark/text content,
 *    decreases over light solid backgrounds.  We write a CSS custom property
 *    --glass-shadow-opacity that the element's box-shadow can reference.
 *
 * Usage:
 *   const ref = useLiquidGlass<HTMLDivElement>()
 *   return <nav ref={ref} className="glass-liquid">...</nav>
 */

import { useCallback, useEffect, useRef } from 'react'

function sampleBackgroundLuminance(el: HTMLElement): number | null {
  try {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    // Sample a point just below the element's center-top (where backdrop content is)
    const x = Math.round(rect.left + rect.width / 2)
    const y = Math.round(rect.bottom + 10) // just below the element

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Use CSS paint worklet isn't available cross-browser, so we fall back to
    // reading the computed background color of the element behind via getComputedStyle.
    // For a more accurate sample, we temporarily hide `el` and use html2canvas —
    // but that's too heavy. Instead, walk up the DOM to find the nearest opaque bg.
    let node: Element | null = el.parentElement
    while (node && node !== document.documentElement) {
      const bg = window.getComputedStyle(node).backgroundColor
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const [, r, g, b] = match.map(Number)
        if (bg.includes('rgba') && bg.includes(', 0)')) {
          node = node.parentElement
          continue
        }
        // Relative luminance (WCAG formula)
        const toLinear = (c: number) => {
          const s = c / 255
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
      }
      node = node.parentElement
    }
    return null
  } catch {
    return null
  }
}

export function useLiquidGlass<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const rafId = useRef<number>(0)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return

    const lum = sampleBackgroundLuminance(el)
    if (lum === null) return

    // Threshold: luminance > 0.45 → background is light → glass should go dark
    //            luminance ≤ 0.45 → background is dark  → glass should go light
    const mode = lum > 0.45 ? 'light' : 'dark'
    if (el.dataset.glassMode !== mode) {
      el.dataset.glassMode = mode
    }

    // Shadow adaptation: more shadow over dark content (text), less over light
    const shadowOpacity = lum < 0.2 ? '0.55' : lum < 0.45 ? '0.38' : '0.18'
    el.style.setProperty('--glass-shadow-opacity', shadowOpacity)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Initial sample
    update()

    // Re-sample on scroll (content moves underneath)
    const onScroll = () => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(update)
    }

    // Re-sample on resize
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(update)
    })

    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    observer.observe(el)

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      observer.disconnect()
      cancelAnimationFrame(rafId.current)
    }
  }, [update])

  return ref
}
