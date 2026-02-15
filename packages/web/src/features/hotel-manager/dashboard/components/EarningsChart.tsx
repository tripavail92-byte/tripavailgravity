import { Calendar, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'

export function EarningsChart() {
  return (
    <GlassCard variant="card" className="p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Overview</h2>
          <p className="text-sm text-gray-600 mt-1">Track your earnings over time</p>
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
      <div
        className="h-80 rounded-xl flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
        }}
      >
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#9D4EDD' }} />
          <p className="text-gray-600 font-medium">Interactive chart coming soon</p>
          <p className="text-sm text-gray-500 mt-1">Revenue visualization with Recharts</p>
        </div>
      </div>
    </GlassCard>
  )
}
