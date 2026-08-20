import { Camera, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { tourImage } from '@/lib/imageUrl'
import { cn } from '@/lib/utils'

/**
 * Tour photo gallery / hero.
 *
 * Real images only — a tour with two photos shows two, not three stock pictures of somewhere
 * else captioned as its own. A proper mobile experience, and a lightbox wired to the buttons.
 *
 * Two layouts:
 *   - `overlay` given  → a single full-width hero image with the title/badges overlaid on it (a
 *     dark gradient keeps the text legible), a "show all photos" button, and a thumbnail strip of
 *     the remaining photos below. This is the tour page's hero.
 *   - no `overlay`     → the original adaptive grid (kept for any caller that just wants photos).
 */
export function TourGallery({
  images,
  title,
  overlay,
}: {
  images: string[]
  title: string
  /** When provided, renders the hero-overlay layout with this content laid over the hero photo. */
  overlay?: ReactNode
}) {
  const photos = (images || []).filter((src) => typeof src === 'string' && src.trim().length > 0)
  const [lightboxAt, setLightboxAt] = useState<number | null>(null)
  const [mobileIndex, setMobileIndex] = useState(0)

  const open = (i: number) => setLightboxAt(i)
  const close = () => setLightboxAt(null)
  const step = (delta: number) =>
    setLightboxAt((cur) => (cur === null ? cur : (cur + delta + photos.length) % photos.length))

  useEffect(() => {
    if (lightboxAt === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxAt, photos.length])

  // No operator media AND nothing to overlay — say so plainly rather than dressing the page in
  // stock photos. (With an overlay we still render the hero over a gradient so the title shows.)
  if (photos.length === 0 && overlay === undefined) {
    return (
      <div className="mb-12 flex h-[240px] items-center justify-center rounded-3xl border border-border/60 bg-muted/40 md:h-[380px]">
        <div className="text-center">
          <ImageOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            The operator has not added photos for this trip yet
          </p>
        </div>
      </div>
    )
  }

  const hero = photos[0]
  const rest = photos.slice(1, 5)

  const lightbox = (
    <Dialog open={lightboxAt !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{title} — photos</DialogTitle>
        {lightboxAt !== null && (
          <div className="relative">
            <img
              src={tourImage(photos[lightboxAt], 1600)}
              alt={`${title} — photo ${lightboxAt + 1} of ${photos.length}`}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close photos"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <X size={18} />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                  {lightboxAt + 1} / {photos.length}
                </span>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // ── Hero-overlay layout ────────────────────────────────────────────────────────────────────
  if (overlay !== undefined) {
    return (
      <>
        <div className="relative mb-4 overflow-hidden rounded-3xl shadow-2xl">
          {hero ? (
            <img
              src={tourImage(hero, 1600)}
              alt={title}
              loading="eager"
              className="h-[360px] w-full object-cover sm:h-[440px] md:h-[520px]"
            />
          ) : (
            <div className="h-[360px] w-full bg-gradient-to-br from-primary/30 to-muted sm:h-[440px] md:h-[520px]" />
          )}
          {/* Legibility scrim — strongest at the bottom where the title sits. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5" />
          {/* Overlaid title / badges / subtitle. */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">{overlay}</div>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => open(0)}
              className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Show all {photos.length} photos</span>
              <span className="sm:hidden">{photos.length}</span>
            </button>
          )}
        </div>

        {/* Remaining photos as a thumbnail strip — the last tile counts any beyond the fifth. */}
        {rest.length > 0 && (
          <div className="mb-10 grid grid-cols-4 gap-2 sm:gap-3">
            {rest.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => open(i + 1)}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <img
                  src={tourImage(src, 500)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {i === rest.length - 1 && photos.length > 5 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-base font-bold text-white">
                    +{photos.length - 5}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {lightbox}
      </>
    )
  }

  // ── Original adaptive grid (no overlay) ────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile: swipeable carousel with a counter */}
      <div className="relative mb-8 md:hidden">
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget
            setMobileIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
          }}
        >
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => open(i)}
              className="h-[260px] w-full flex-none snap-center overflow-hidden rounded-2xl bg-muted/60"
            >
              <img
                src={tourImage(src, 800)}
                alt={i === 0 ? title : ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
            {Math.min(mobileIndex + 1, photos.length)} / {photos.length}
          </span>
        )}
      </div>

      {/* Desktop: layout adapts to how many real photos exist */}
      <div
        className={cn(
          'mb-12 hidden gap-3 overflow-hidden rounded-3xl shadow-2xl md:grid md:h-[500px]',
          rest.length === 0 ? 'md:grid-cols-1' : 'md:grid-cols-4',
        )}
      >
        <button
          type="button"
          onClick={() => open(0)}
          className={cn(
            'group relative h-full overflow-hidden bg-muted/60',
            rest.length === 0 ? 'md:col-span-1' : 'md:col-span-2',
          )}
        >
          <img
            src={tourImage(hero, 1200)}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </button>

        {rest.length > 0 && (
          <div
            className={cn(
              'grid h-full gap-3 md:col-span-2',
              rest.length > 1 ? 'md:grid-cols-2' : '',
              rest.length > 2 ? 'md:grid-rows-2' : '',
            )}
          >
            {rest.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => open(i + 1)}
                className="group relative h-full overflow-hidden bg-muted/60"
              >
                <img
                  src={tourImage(src, 700)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* "Show all" sits on the last visible tile, and actually opens the lightbox. */}
                {i === rest.length - 1 && photos.length > 1 && (
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur">
                    <Camera size={16} />
                    Show all {photos.length} photos
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox}
    </>
  )
}
