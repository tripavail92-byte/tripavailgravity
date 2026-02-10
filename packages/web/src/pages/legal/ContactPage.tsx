import { COMPANY } from '@/config/company';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
          <p className="mt-2 text-sm text-gray-600">We typically respond within 1–2 business days.</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2>Support email</h2>
          <p>
            <a className="underline" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
          </p>

          <h2>Mailing address</h2>
          <p>{COMPANY.mailingAddress}</p>

          <h2>Booking issues</h2>
          <p>
            For the fastest help, include your booking reference, travel date, and the email used to book.
          </p>
        </div>
      </main>
    </div>
  );
}
