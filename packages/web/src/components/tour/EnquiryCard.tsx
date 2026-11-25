import { ExternalLink, Info, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard, GlassContent, GlassHeader, GlassTitle } from '@/components/ui/glass'
import { COMPANY } from '@/config/company'

/**
 * Trips listed from operators who haven't joined TripAvail yet (booking_mode = 'enquiry').
 * They can't be booked or paid for here: the traveller messages the operator on WhatsApp, and the
 * card says plainly who sets the price and dates. Replaces the booking card for those trips.
 */

export function whatsAppHref(phoneE164: string, message: string) {
  return `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

export function enquiryMessage(
  operatorName: string,
  tourTitle: string,
  pageUrl: string,
  date?: string,
) {
  return (
    `Hi ${operatorName}, I found your trip "${tourTitle}" on TripAvail (${pageUrl}).` +
    (date ? ` Is there space on ${date}?` : ' When is the next departure, and is there space?')
  )
}

export function claimHref(operatorName: string, pageUrl: string) {
  const subject = `Claim listing: ${operatorName}`
  const body =
    `I run ${operatorName} and would like to manage this listing on TripAvail: ${pageUrl}\n\n` +
    `My name:\nMy phone / WhatsApp:\n`
  return `mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

interface EnquiryCardProps {
  tourTitle: string
  operatorName: string
  whatsapp: string | null
  websiteUrl: string | null
  /** Already formatted per-person price, or null when the operator doesn't show one. */
  priceText: string | null
  /** Upcoming departure dates, already formatted. */
  departures: string[]
  /** The operator runs this trip on dates the traveller chooses (no fixed departures). */
  anyDate?: boolean
  pageUrl: string
  onWhatsAppClick: () => void
  onClaimClick: () => void
}

export function EnquiryCard({
  tourTitle,
  operatorName,
  whatsapp,
  websiteUrl,
  priceText,
  departures,
  anyDate = false,
  pageUrl,
  onWhatsAppClick,
  onClaimClick,
}: EnquiryCardProps) {
  return (
    <GlassCard
      variant="card"
      className="relative overflow-hidden rounded-[2.5rem] border-none shadow-2xl shadow-primary/10"
    >
      <GlassHeader>
        <GlassTitle className="type-h2 text-foreground">
          {priceText ? (
            <>
              {priceText}
              <span className="type-body-sm text-muted-foreground"> / person</span>
            </>
          ) : (
            'Price on request'
          )}
        </GlassTitle>
      </GlassHeader>
      <GlassContent className="space-y-4">
        <div className="space-y-2 rounded-3xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {departures.length ? 'Departures listed by the operator' : anyDate ? 'Dates' : 'Departures'}
          </p>
          {!departures.length && anyDate ? (
            <p className="text-sm text-foreground">
              <span className="font-semibold">Any date you choose.</span> {operatorName} runs this
              trip on request — tell them your dates on WhatsApp.
            </p>
          ) : departures.length ? (
            <ul className="flex flex-wrap gap-2">
              {departures.slice(0, 8).map((d) => (
                <li
                  key={d}
                  className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm font-medium text-foreground"
                >
                  {d}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground">Ask the operator for the next date.</p>
          )}
        </div>

        {whatsapp ? (
          <Button
            asChild
            className="h-14 w-full rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90"
          >
            <a
              href={whatsAppHref(
                whatsapp,
                enquiryMessage(operatorName, tourTitle, pageUrl, departures[0]),
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsAppClick}
            >
              <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
              Enquire on WhatsApp
            </a>
          </Button>
        ) : websiteUrl ? (
          <Button asChild variant="outline" className="h-14 w-full rounded-2xl">
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" aria-hidden="true" />
              Visit {operatorName}&apos;s website
            </a>
          </Button>
        ) : null}

        <div className="flex gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            You book this trip directly with{' '}
            <span className="font-semibold text-foreground">{operatorName}</span>. TripAvail lists
            it from the operator&apos;s own public listings; the price and dates are theirs, so
            confirm them before you pay. Payment protection on TripAvail does not apply.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Run {operatorName}?{' '}
          <a
            href={claimHref(operatorName, pageUrl)}
            onClick={onClaimClick}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Claim this listing
          </a>{' '}
          to update it, or ask us to remove it.
        </p>
      </GlassContent>
    </GlassCard>
  )
}
