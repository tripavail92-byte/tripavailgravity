import { COMPANY } from '@/config/company';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Refund & Cancellation Policy</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: February 10, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p>
            This policy explains how cancellations and refunds work on {COMPANY.name}. Specific refund
            eligibility depends on the listing and the Provider’s cancellation policy shown at checkout.
          </p>

          <h2>1. Provider cancellation terms</h2>
          <p>
            Each booking is subject to a cancellation policy (for example: flexible, moderate, strict, or
            non-refundable). The policy and any deadlines are displayed before purchase.
          </p>

          <h2>2. When you cancel</h2>
          <p>
            If you cancel a booking, the refund amount is determined by the booking’s cancellation policy,
            including time before start date/time, no-show rules, and any special terms (for example, weather
            or force majeure).
          </p>

          <h2>3. When a Provider cancels</h2>
          <p>
            If a Provider cancels, you will generally receive a full refund for the canceled service, unless
            the listing terms state an alternative resolution (such as rescheduling) that you accept.
          </p>

          <h2>4. Refund timing</h2>
          <p>
            Once approved, refunds are issued back to the original payment method. Your bank or card issuer
            may take additional time to post the refund.
          </p>

          <h2>5. Disputes and chargebacks</h2>
          <p>
            If something went wrong, contact support first so we can help quickly. Filing a chargeback can
            slow resolution and may limit future use of the Service.
          </p>

          <h2>6. Contact</h2>
          <p>
            Refund/cancellation help: <a className="underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
