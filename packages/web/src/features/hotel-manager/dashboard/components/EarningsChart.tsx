import { Calendar, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'

export function EarningsChart() {
  return (
    <GlassCard variant="card" className="p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Revenue data will appear here once you have bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm">
              30 Days
            </button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900">
              3 Months
            </button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900">
              Year
            </button>
          </div>

          {/* Export Button */}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Chart Placeholder - Will be replaced with Recharts */}
      <div className="h-80 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-200">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-700 font-medium">No revenue yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete listings and start receiving bookings.
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
