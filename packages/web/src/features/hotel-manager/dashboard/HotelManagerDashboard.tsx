import { ArrowRight, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getActiveKycSession } from '@/features/verification/services/kycSessionService'

import { DraftListingsAlert } from './components/DraftListingsAlert'
import { EarningsChart } from './components/EarningsChart'
import { ListingsGrid } from './components/ListingsGrid'
import { RecentBookings } from './components/RecentBookings'
import { StatsOverview } from './components/StatsOverview'

export function HotelManagerDashboard() {
  const { user, activeRole } = useAuth()
  const navigate = useNavigate()
  const verificationStatus = activeRole?.verification_status ?? 'incomplete'
  const [isKycProcessing, setIsKycProcessing] = useState(false)
  const [isKycPendingAdminReview, setIsKycPendingAdminReview] = useState(false)

  useEffect(() => {
    let cancelled = false

    const readLocalHint = () => {
      try {
        const raw = localStorage.getItem('tripavail_kyc_processing')
        if (!raw) return false
        const parsed = JSON.parse(raw)
        const isForThisRole = parsed?.role === 'hotel_manager'
        const startedAt = typeof parsed?.startedAt === 'number' ? parsed.startedAt : 0
        return Boolean(isForThisRole && Date.now() - startedAt < 15 * 60 * 1000)
      } catch {
        return false
      }
    }

    const refresh = async () => {
      if (!user?.id) return
      const localHint = readLocalHint()
      const session = await getActiveKycSession(user.id, 'hotel_manager')
      const processing = session?.status === 'processing'
      const pendingAdmin = session?.status === 'pending_admin_review'

      if (cancelled) return
      setIsKycProcessing(Boolean((localHint || processing) && verificationStatus !== 'approved'))
      setIsKycPendingAdminReview(Boolean(pendingAdmin && verificationStatus !== 'approved'))

      if (!processing) {
        try { localStorage.removeItem('tripavail_kyc_processing') } catch {}
      }
    }

    refresh()
    const id = window.setInterval(refresh, 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [user?.id, verificationStatus])

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

          {isKycProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Verification processing</p>
                  <p className="text-xs text-gray-600 font-medium">We’re running OCR on your CNIC. This usually takes a few minutes — you can keep using the dashboard.</p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-xl h-10 px-5 font-bold gap-2 flex-shrink-0"
                onClick={() => navigate('/manager/verification')}
              >
                View Status <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {isKycPendingAdminReview && !isKycProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-gray-200 bg-white px-6 py-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Verification pending review</p>
                  <p className="text-xs text-gray-600 font-medium">Your CNIC was processed successfully and is now queued for admin approval.</p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-xl h-10 px-5 font-bold gap-2 flex-shrink-0"
                onClick={() => navigate('/manager/verification')}
              >
                View Details <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

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
