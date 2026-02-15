import { COMPANY } from '@/config/company'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: February 10, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p>
            This Privacy Policy explains how {COMPANY.name} collects, uses, and shares information
            when you use our Service.
          </p>

          <h2>1. Information we collect</h2>
          <ul>
            <li>
              <strong>Account information</strong>: name, email, phone (if provided), and profile
              details.
            </li>
            <li>
              <strong>Booking information</strong>: traveler details, trip dates, and booking
              preferences.
            </li>
            <li>
              <strong>Device and usage</strong>: log data, IP address, browser/device information,
              and usage events.
            </li>
          </ul>

          <h2>2. Payments</h2>
          <p>
            Card payments are processed by our payment processor (for example, Stripe). We do not
            store your full card number. Payment processors may process information according to
            their own privacy policies.
          </p>

          <h2>3. How we use information</h2>
          <ul>
            <li>Provide and improve the Service (search, booking, customer support).</li>
            <li>Prevent fraud, abuse, and security incidents.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
            <li>Communicate with you about bookings and account updates.</li>
          </ul>

          <h2>4. How we share information</h2>
          <ul>
            <li>
              <strong>With Providers</strong>: to fulfill bookings (only what’s needed for
              delivery/support).
            </li>
            <li>
              <strong>With vendors</strong>: hosting, analytics, customer support tools, and payment
              processing.
            </li>
            <li>
              <strong>For legal reasons</strong>: to comply with law, protect rights, or respond to
              lawful requests.
            </li>
          </ul>

          <h2>5. Data retention</h2>
          <p>
            We retain information as needed to provide the Service, meet legal requirements, resolve
            disputes, and enforce agreements.
          </p>

          <h2>6. Security</h2>
          <p>
            We use reasonable administrative, technical, and physical safeguards designed to protect
            your information.
          </p>

          <h2>7. Your choices</h2>
          <p>
            You may request access, correction, or deletion of certain information, subject to legal
            and contractual limits.
          </p>

          <h2>8. Contact</h2>
          <p>
            Privacy questions:{' '}
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
