import { AlertCircle, ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { PackageCard } from '@/components/traveller/PackageCard'
import { TourCard } from '@/components/traveller/TourCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SearchListing } from '@/queries/searchQueries'

import { askAssistant, AssistantError, type AssistantMessage } from '../services/assistantService'

/**
 * Ask TripAvail — a grounded assistant over real inventory.
 *
 * THE DESIGN RULE THAT MATTERS: the model writes search FILTERS, the database returns ROWS, and
 * this component renders those rows as the same cards the search page uses. The prose is a
 * commentary on a result set that the traveller can see and click. Nothing here paraphrases a
 * price or invents an option, because nothing here is free to.
 *
 * Ratings are never shown. Every listing's rating and review_count are 0 (nothing writes them), so
 * a star row would be a lie either way it rendered.
 */

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60'

const STARTERS = [
  'Family trip to Hunza under PKR 80,000',
  'What is included in the Skardu tours?',
  'Cheapest tours you have',
  'Something adventurous for 4 people',
]

function ListingCards({ listings }: { listings: SearchListing[] }) {
  if (listings.length === 0) return null
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {listings.slice(0, 6).map((item) =>
        item.listingType === 'tour' ? (
          <TourCard
            key={`tour-${item.listingId}`}
            id={item.listingId}
            slug={item.slug ?? undefined}
            image={item.images?.[0] || FALLBACK_IMG}
            title={item.title}
            location={item.locationLabel ?? item.country ?? 'Pakistan'}
            duration={item.durationDays ? `${item.durationDays} days` : 'Multi-day'}
            // Zero, so the card renders "no reviews yet" rather than a score. Nothing on the
            // platform writes rating or review_count, so any other value would be invented.
            // TourCard omits reviewCount from its public props and derives it itself.
            rating={0}
            price={item.price ?? 0}
            currency={item.currency}
            type={item.badge ?? 'Tour'}
            isFeatured={item.isFeatured}
          />
        ) : (
          <PackageCard
            key={`package-${item.listingId}`}
            id={item.listingId}
            slug={item.slug ?? undefined}
            images={item.images?.length ? item.images : [FALLBACK_IMG]}
            title={item.title}
            subtitle={item.subtitle ?? undefined}
            location={item.locationLabel ?? item.country ?? undefined}
            priceFrom={item.price}
            currency={item.currency}
            badge={item.badge ?? 'Stay'}
          />
        ),
      )}
    </div>
  )
}

export function TravelAssistant({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const send = async (text: string) => {
    const question = text.trim()
    if (!question || isThinking) return

    setError(null)
    setInput('')
    const next: AssistantMessage[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setIsThinking(true)

    try {
      const reply = await askAssistant(next)
      setMessages([...next, reply])
    } catch (e) {
      // The user's question stays on screen — losing what they typed because the network failed
      // would be its own small betrayal.
      setError(
        e instanceof AssistantError
          ? e.message
          : 'The assistant could not answer just now. Please try again.',
      )
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Ask TripAvail</h2>
          <p className="text-xs text-muted-foreground">
            Searches only what’s actually listed here — real trips, real prices.
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-[280px] flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && !isThinking && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tell me where you’d like to go, who’s travelling and what you can spend.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {m.role === 'user' ? (
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                    {m.content}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {m.content}
                  </p>
                  {m.listings && <ListingCards listings={m.listings} />}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching what’s available…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="flex items-center gap-2 border-t border-border pt-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Where would you like to go?"
          maxLength={800}
          disabled={isThinking}
          aria-label="Ask about trips"
        />
        <Button type="submit" size="icon" disabled={isThinking || !input.trim()}>
          <ArrowUp className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>

      <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
        Answers come from TripAvail listings and can be incomplete. Check dates, prices and
        conditions with the operator before you book — mountain weather and roads change.
      </p>
    </div>
  )
}
