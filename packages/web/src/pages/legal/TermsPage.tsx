import { Link } from 'react-router-dom'

import { COMPANY } from '@/config/company'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: February 10, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p>
            These Terms of Service ("Terms") govern your access to and use of {COMPANY.name}'s
            website and services (the "Service"). By using the Service, you agree to these Terms.
          </p>

          <h2>1. The Service</h2>
          <p>
            {COMPANY.name} enables travelers to discover and book travel products (such as tours,
            packages, and accommodations) offered by third-party providers ("Providers"). Providers
            are responsible for delivering the booked services.
          </p>

          <h2>2. Eligibility and Accounts</h2>
          <p>
            You must provide accurate information and keep it up to date. You are responsible for
            activity that occurs under your account.
          </p>

          <h2>3. Pricing, Taxes, and Fees</h2>
          <p>
            Prices shown may include provider charges and platform fees, and may vary based on
            dates, availability, and local taxes/fees. You will see the total before confirming
            payment.
          </p>

          <h2>4. Payments</h2>
          <p>
            Payments are processed securely through our payment processor. We do not store your full
            card details. Your statement may show a descriptor related to {COMPANY.name}.
          </p>

          <h2>5. Cancellations and Refunds</h2>
          <p>
            Cancellation and refund terms depend on the listing and the provider’s policy. Please
            review the cancellation/refund policy shown during checkout and on the booking details.
          </p>
          <p>
            For platform-wide information, see our{' '}
            <Link to="/refunds" className="underline">
              Refund & Cancellation Policy
            </Link>
            .
          </p>

          <h2>6. Prohibited Use</h2>
          <p>
            You may not use the Service for unlawful, fraudulent, or abusive activity, including
            card testing, impersonation, or attempts to evade payment network rules.
          </p>

          <h2>7. Disputes and Chargebacks</h2>
          <p>
            If you have an issue with a booking, contact support first so we can help resolve it.
            Filing a chargeback without attempting resolution may delay the outcome and can impact
            future use.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service and its content are owned by {COMPANY.name} or its licensors and are
            protected by applicable laws.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {COMPANY.name} will not be liable for indirect,
            incidental, special, consequential, or punitive damages.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these Terms:{' '}
            <a className="underline" href={`mailto:${COMPANY.supportEmail}`}>
              {COMPANY.supportEmail}
            </a>
            .
          </p>
          <p>Mailing address: {COMPANY.mailingAddress}.</p>
        </div>
      </main>
    </div>
  )
}
