import { Loader2, Package, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@tripavail/shared/core/client'

import { RecentBookings } from '../../hotel-manager/dashboard/components/RecentBookings'
import { StatsOverview } from '../../hotel-manager/dashboard/components/StatsOverview'
import { Tour, tourService } from '../services/tourService'
import { ActiveToursGrid } from './components/ActiveToursGrid'
import { DraftsAlert } from './components/DraftsAlert'

export function TourOperatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [publishedTours, setPublishedTours] = useState<Tour[]>([])
  const [drafts, setDrafts] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return
      try {
        const { data: profile, error: profileError } = await supabase
          .from('tour_operator_profiles')
          .select('setup_completed')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError
        setSetupCompleted(profile?.setup_completed === true)

        const [pub, drf] = await Promise.all([
          tourService.fetchPublishedTours(user.id),
          tourService.fetchDraftTours(user.id),
        ])
        setPublishedTours(pub)
        setDrafts(drf)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const handleCreateTour = () => {
    if (setupCompleted !== true) {
      navigate('/operator/setup')
      return
    }
    navigate('/operator/tours/new')
  }

  const handleEditTour = (tour: Tour) => {
    navigate(`/operator/tours/new?tour_id=${encodeURIComponent(tour.id)}`)
  }

  const handleViewTour = (tour: Tour) => {
    window.open(`/tours/${tour.id}`, '_blank')
  }

  const handleDeleteTour = async (tour: Tour) => {
    if (window.confirm(`Are you sure you want to delete "${tour.title}"?`)) {
      // Implementation for deletion
    }
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Welcome back, Partner!{' '}
                <span className="animate-wave inline-block origin-bottom-right">🎒</span>
              </h1>
              <p className="text-muted-foreground font-medium">
                Manage your tour packages and track your business performance
              </p>
            </div>
            <Button
              data-tour="add-tour"
              onClick={handleCreateTour}
              disabled={setupCompleted !== true}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-12 px-6 rounded-2xl font-bold gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Create Tour Package
            </Button>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Drafts Notification */}
          <DraftsAlert drafts={drafts} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Tour Packages (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Active Tour Packages
                  {publishedTours.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                      {publishedTours.length}
                    </Badge>
                  )}
                </h2>
                {publishedTours.length > 0 && (
                  <button className="text-primary hover:text-primary/80 text-sm font-bold transition-colors">
                    View all
                  </button>
                )}
              </div>

              {loading ? (
                <div className="bg-background rounded-3xl border border-border shadow-sm p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground font-medium">Loading your tours...</p>
                </div>
              ) : publishedTours.length > 0 ? (
                <ActiveToursGrid
                  tours={publishedTours}
                  onEdit={handleEditTour}
                  onDelete={handleDeleteTour}
                  onView={handleViewTour}
                />
              ) : (
                <div className="bg-background rounded-3xl border border-border shadow-sm p-12 text-center">
                  <div className="bg-primary/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform">
                    <span className="text-4xl">🗓️</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No active tours yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                    Start by creating your first tour package to reach travellers worldwide.
                  </p>
                  <Button
                    data-tour="add-tour"
                    onClick={handleCreateTour}
                    variant="outline"
                    className="h-11 px-8 rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5"
                  >
                    Create First Tour
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Recent Activity (1/3 width) */}
            <div className="lg:col-span-1 border-l border-border lg:pl-8">
              <RecentBookings />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
