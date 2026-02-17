import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HorizontalPreviewSliderProps {
  children: React.ReactNode
  className?: string
}

export function HorizontalPreviewSlider({ children, className }: HorizontalPreviewSliderProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return

    const amount = Math.max(280, Math.round(el.clientWidth * 0.9))
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-end gap-2 pb-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollByAmount('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollByAmount('right')}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  )
}
