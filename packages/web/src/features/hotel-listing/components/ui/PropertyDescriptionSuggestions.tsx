import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import {
  buildPropertyDetail,
  composeSuggestions,
  type CopyFragment,
  fetchFragments,
} from '../../lib/listingCopy'

/**
 * Property descriptions composed from the curated fragment library.
 *
 * HISTORY, BECAUSE IT EXPLAINS THE NAMING. This component was PropertyDescriptionAI. Its
 * generateSuggestions() awaited setTimeout(1500) — a hardcoded delay dressed up as thinking — then
 * returned one of three canned strings under a "Generating…" spinner. It told the partner a model
 * had written something when nothing had run. That was fixed by wiring it to a real model, and the
 * model has now been replaced by this library.
 *
 * So the file is renamed and the button no longer says "AI". Labelling a fixed library as AI would
 * be the original defect all over again, just with better copy behind it. What the partner is
 * promised and what they get now match.
 */

/** Categories that have fragments seeded. Anything else falls back to hotel. */
const KNOWN_TYPES = new Set([
  'hotel',
  'resort',
  'boutique',
  'guesthouse',
  'hostel',
  'inn',
  'lodge',
  'motel',
])

interface PropertyDescriptionSuggestionsProps {
  propertyType: string
  hotelName?: string
  city?: string
  country?: string
  starRating?: number
  amenities?: string[]
  onSuggestionSelect: (suggestion: string) => void
  className?: string
}

export function PropertyDescriptionSuggestions({
  propertyType,
  hotelName,
  city,
  country,
  starRating,
  amenities,
  onSuggestionSelect,
  className = '',
}: PropertyDescriptionSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [fragments, setFragments] = useState<CopyFragment[] | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [cycle, setCycle] = useState(0)

  const raw = (propertyType || '').toLowerCase().trim()
  const category = KNOWN_TYPES.has(raw) ? raw : 'hotel'

  const build = (loaded: CopyFragment[], nextCycle: number) =>
    composeSuggestions({
      kind: 'property',
      fragments: loaded,
      vars: { name: hotelName, city, country },
      // The city is skipped here when the chosen opener already names it — otherwise the copy reads
      // "A hotel in Hunza… A 4-star property in Hunza."
      detail: (opener) =>
        buildPropertyDetail({
          starRating,
          city: city && opener.includes(city) ? undefined : city,
          amenities,
        }),
      seed: hotelName || city || category,
      cycle: nextCycle,
    })

  const load = async () => {
    setIsLoading(true)
    setSelectedSuggestion(null)
    try {
      const loaded = await fetchFragments('property', category)
      setFragments(loaded)
      setSuggestions(build(loaded, 0))
    } catch {
      // composeSuggestions substitutes its bundled fragments for an empty list, so the panel is
      // never left empty just because the table was unreachable.
      setFragments([])
      setSuggestions(build([], 0))
    } finally {
      setCycle(0)
      setIsLoading(false)
    }
  }

  const shuffle = () => {
    const next = cycle + 1
    setCycle(next)
    setSuggestions(build(fragments ?? [], next))
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion)
    onSuggestionSelect(suggestion)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Description ideas</span>
        </div>

        <Button
          onClick={suggestions.length > 0 ? shuffle : () => void load()}
          disabled={isLoading || !propertyType}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading…' : suggestions.length > 0 ? 'Show others' : 'Suggest descriptions'}
        </Button>
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <p className="text-xs text-muted-foreground">
              Written around your property type{city ? ` and location` : ''}. Pick one as a starting
              point and edit it to sound like you.
            </p>

            {suggestions.map((suggestion, index) => (
              <motion.div
                key={`${cycle}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer p-4 transition-all duration-200 ${
                    selectedSuggestion === suggestion
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-border hover:shadow-sm'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex-1 text-sm leading-relaxed text-foreground">{suggestion}</p>

                    <div className="flex flex-shrink-0 gap-2">
                      {selectedSuggestion === suggestion && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void navigator.clipboard.writeText(suggestion)
                        }}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {suggestions.length === 0 && !isLoading && (
        <Card className="border-2 border-dashed border-border p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">Not sure how to describe your place?</p>
          <p className="text-xs text-muted-foreground">
            Pick a property type above, then choose “Suggest descriptions” for ready-made openers
            you can edit.
          </p>
        </Card>
      )}
    </div>
  )
}
