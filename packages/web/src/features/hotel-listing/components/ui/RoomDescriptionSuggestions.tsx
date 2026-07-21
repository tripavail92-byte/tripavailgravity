import { Check, Copy, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import {
  buildRoomDetail,
  composeSuggestions,
  type CopyFragment,
  fetchFragments,
} from '../../lib/listingCopy'
import type { RoomType } from '../steps/RoomsStep'

interface RoomDescriptionSuggestionsProps {
  room: Partial<RoomType>
  onSelect: (description: string) => void
}

/**
 * Room descriptions composed from the curated fragment library (public.listing_copy_fragments).
 *
 * This surface has been through three versions. It began as a fake — setTimeout(1500) under a
 * spinner, returning canned strings. It was then wired to a real model. It now reads a curated
 * library instead: no per-call cost, no API dependency, instant, and admin-editable through the
 * fragments table without a deploy.
 *
 * The library is composed rather than quoted — an opener for the room type, the room's real beds,
 * size and capacity, then a closer. See lib/listingCopy.ts for why that matters.
 */

export function RoomDescriptionSuggestions({ room, onSelect }: RoomDescriptionSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fragments, setFragments] = useState<CopyFragment[] | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [cycle, setCycle] = useState(0)

  const build = (loaded: CopyFragment[], nextCycle: number) =>
    composeSuggestions({
      kind: 'room',
      fragments: loaded,
      vars: { roomName: room.name },
      detail: buildRoomDetail(room),
      seed: room.name || room.type || 'room',
      cycle: nextCycle,
    })

  const load = async () => {
    setLoading(true)
    try {
      const loaded = await fetchFragments('room', room.type ?? 'standard')
      setFragments(loaded)
      setSuggestions(build(loaded, 0))
    } catch {
      // composeSuggestions falls back to its bundled fragments when handed an empty list, so the
      // partner still gets usable suggestions rather than an empty panel.
      setFragments([])
      setSuggestions(build([], 0))
    } finally {
      setCycle(0)
      setLoading(false)
    }
  }

  const shuffle = () => {
    const next = cycle + 1
    setCycle(next)
    setSuggestions(build(fragments ?? [], next))
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && suggestions.length === 0) void load()
  }

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="h-auto gap-1.5 px-2 py-1 text-xs text-primary hover:text-primary"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading ? 'Loading…' : open ? 'Hide suggestions' : 'Suggest a description'}
      </Button>

      {open && !loading && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Written around your room’s type, beds and size. Edit freely — it’s a starting point.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={shuffle}
              className="h-auto shrink-0 gap-1 px-2 py-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Show others
            </Button>
          </div>
          {suggestions.map((text, i) => (
            <div
              key={`${cycle}-${i}`}
              className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground"
            >
              <p className="leading-relaxed">{text}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    onSelect(text)
                    setCopiedIndex(i)
                    setTimeout(() => setCopiedIndex(null), 1500)
                  }}
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="mr-1 h-3 w-3" /> Added
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" /> Use this
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
