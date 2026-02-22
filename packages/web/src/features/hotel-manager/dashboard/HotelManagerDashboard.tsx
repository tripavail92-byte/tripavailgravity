import { motion } from 'motion/react'

import { useAuth } from '@/hooks/useAuth'

import { DraftListingsAlert } from './components/DraftListingsAlert'
import { EarningsChart } from './components/EarningsChart'
import { ListingsGrid } from './components/ListingsGrid'
import { RecentBookings } from './components/RecentBookings'
import { StatsOverview } from './components/StatsOverview'

export function HotelManagerDashboard() {
  const { user } = useAuth()

  const displayName =
    user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Partner'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
            <p className="text-gray-600">Manage your properties and bookings</p>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Draft Listings Alert */}
          <DraftListingsAlert />

          {/* Earnings Chart */}
          <EarningsChart />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Listings (2/3 width) */}
            <div className="lg:col-span-2">
              <ListingsGrid />
            </div>

            {/* Right Column - Recent Bookings (1/3 width) */}
            <div className="lg:col-span-1">
              <RecentBookings />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
