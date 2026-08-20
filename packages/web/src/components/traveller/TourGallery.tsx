import { Camera, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { tourImage } from '@/lib/imageUrl'
import { cn } from '@/lib/utils'

/**
 * Tour photo gallery.
 *
 * Replaces a fixed five-slot grid that PADDED missing photos with hardcoded
 * Unsplash images — so a tour with two real photos advertised three pictures of
 * somewhere else as its own, captioned "{title} photo 3". Photos are the single
 * biggest conversion driver on a tour page; showing someone else's is worse than
 * showing fewer.
 *
 * Now: real images only, a layout that adapts to how many exist, a proper mobile
 * carousel (the old grid hid every secondary column behind `hidden md:grid`, so
 * phones saw exactly one photo), and a lightbox actually wired to the button.
 */
export function TourGallery({ images, title }: { images: string[]; title: string }) {
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

  // No operator media — say so plainly rather than dressing the page in stock photos.
  if (photos.length === 0) {
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

      {/* Lightbox */}
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
    </>
  )
}
