import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY } from '@/config/company';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-12 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            <li><Link to="/refunds" className="hover:underline">Refunds & cancellations</Link></li>
            <li><a href={`mailto:${COMPANY.supportEmail}`} className="hover:underline">{COMPANY.supportEmail}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Partners</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/partner/onboarding" className="hover:underline">Become a partner</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/terms" className="hover:underline">Terms</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link to="/refunds" className="hover:underline">Refund & Cancellation Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>
          © 2026 {COMPANY.legalName} · <Link to="/privacy" className="hover:underline">Privacy</Link> ·{' '}
          <Link to="/terms" className="hover:underline">Terms</Link> · <Link to="/refunds" className="hover:underline">Refunds</Link>
        </p>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-1"><Globe size={14} /> English (US)</div>
          <div>$ USD</div>
        </div>
      </div>
    </footer>
  );
}
