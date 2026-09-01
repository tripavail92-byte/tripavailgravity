import { format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'

/**
 * Trip voucher / e-ticket.
 *
 * Travellers previously had only a plain HTML receipt — fine as a payment record, but nothing to
 * show at the pickup point. This is the thing you hold up on your phone: a scannable code carrying
 * the booking reference, plus the details the operator needs to check you off.
 *
 * The QR encodes the booking id only. It is a LOOKUP KEY, not a credential — whoever scans it still
 * has to be signed in as the operator to see the booking, so a photographed voucher leaks nothing.
 * Print styles keep it to one clean page.
 */
export function BookingVoucher({
  bookingId,
  reference,
  tourTitle,
  travellerName,
  seats,
  departureISO,
  pickupTitle,
  pickupTime,
  manifest,
  operatorName,
}: {
  bookingId: string
  reference: string
  tourTitle: string
  travellerName?: string | null
  seats: number
  departureISO?: string | null
  pickupTitle?: string | null
  pickupTime?: string | null
  manifest?: { name: string; age: number | null }[]
  operatorName?: string | null
}) {
  const departure = departureISO ? new Date(departureISO) : null
  const departureValid = departure && !Number.isNaN(departure.getTime())

  return (
    <div className="voucher-print mx-auto max-w-md rounded-2xl border border-border/60 bg-background p-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .voucher-print, .voucher-print * { visibility: visible; }
          .voucher-print { position: absolute; inset: 0; margin: 0 auto; border: none; }
          .voucher-no-print { display: none !important; }
        }
      `}</style>

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">TripAvail</p>
        <h2 className="mt-1 text-xl font-black leading-tight text-foreground">{tourTitle}</h2>
        {operatorName ? (
          <p className="mt-0.5 text-sm text-muted-foreground">Operated by {operatorName}</p>
        ) : null}
      </div>

      <div className="my-5 flex justify-center">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={bookingId} size={148} level="M" />
        </div>
      </div>

      <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Booking reference
      </p>
      <p className="mb-5 text-center text-lg font-black tracking-wider text-foreground">
        {reference}
      </p>

      <dl className="space-y-3 border-t border-border/50 pt-4 text-sm">
        {departureValid ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Departure</dt>
            <dd className="text-right font-semibold text-foreground">
              {format(departure as Date, 'EEE, d MMM yyyy')}
              <span className="block text-xs font-normal text-muted-foreground">
                {format(departure as Date, 'h:mm a')}
              </span>
            </dd>
          </div>
        ) : null}
        {pickupTitle ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Pickup</dt>
            <dd className="text-right font-semibold text-foreground">
              {pickupTitle}
              {pickupTime ? (
                <span className="block text-xs font-normal text-muted-foreground">{pickupTime}</span>
              ) : null}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Travellers</dt>
          <dd className="text-right font-semibold text-foreground">{seats}</dd>
        </div>
        {travellerName ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Lead traveller</dt>
            <dd className="text-right font-semibold text-foreground">{travellerName}</dd>
          </div>
        ) : null}
      </dl>

      {manifest && manifest.length > 1 ? (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Travelling party
          </p>
          <ul className="space-y-1 text-sm text-foreground">
            {manifest.map((m, i) => (
              <li key={`${m.name}-${i}`}>
                {m.name}
                {m.age ? <span className="text-muted-foreground"> · {m.age}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
        Show this to your operator at pickup.
      </p>
    </div>
  )
}
