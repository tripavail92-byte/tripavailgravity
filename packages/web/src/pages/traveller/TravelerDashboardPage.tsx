import { format } from 'date-fns'
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronRight,
  Compass,
  Heart,
  Luggage,
  MapPin,
  Settings,
  User,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { bookingService } from '@/features/booking/services/bookingService'
import { getPackagesByIds } from '@/features/package-creation/services/packageService'
import { tourService } from '@/features/tour-operator/services/tourService'
import { useAuth } from '@/hooks/useAuth'
import { wishlistService } from '@/lib/wishlistService'

export default function TravelerDashboardPage() {
  const { user } = useAuth()
  const [nextTrip, setNextTrip] = useState<any>(null)
  const [recentWishlist, setRecentWishlist] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch Bookings and find next upcoming
      const bookings = await bookingService.getTravelerBookings(user!.id)
      const upcoming = bookings
        .filter((b) => b.status === 'confirmed')
        .sort((a, b) => {
          const dateA = new Date(a.booking_date || a.start_time || a.check_in_date).getTime()
          const dateB = new Date(b.booking_date || b.start_time || b.check_in_date).getTime()
          return dateA - dateB
        })
        .find((b) => new Date(b.booking_date || b.start_time || b.check_in_date) >= new Date())

      setNextTrip(upcoming)

      // 2. Fetch Wishlist and get last 2 items
      const wishlist = await wishlistService.getWishlist()
      if (wishlist.length > 0) {
        const recent = wishlist.slice(0, 2)
        const tourIds = recent.filter((i) => i.item_type === 'tour').map((i) => i.item_id)
        const packageIds = recent.filter((i) => i.item_type === 'package').map((i) => i.item_id)

        const [tours, packages] = await Promise.all([
          tourIds.length ? tourService.getToursByIds(tourIds) : Promise.resolve([]),
          packageIds.length ? getPackagesByIds(packageIds) : Promise.resolve([]),
        ])

        const items = [
          ...tours.map((t) => ({ ...t, type: 'tour' })),
          ...packages.map((p) => ({ ...p, type: 'package' })),
        ]
        setRecentWishlist(items)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Hero Welcome */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              Welcome back,{' '}
              <span className="text-primary">
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Traveler'}
              </span>
              !
            </h1>
            <p className="text-gray-500 font-medium">
              Ready for your next adventure? Here's what's happening.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Next Trip & Wishlist */}
          <div className="lg:col-span-2 space-y-8">
            {/* Next Trip Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard
                variant="card"
                className="p-0 overflow-hidden rounded-3xl border-none shadow-xl shadow-gray-200/50"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Luggage className="w-5 h-5 text-primary" />
                    Next Adventure
                  </h2>
                  <Link
                    to="/trips"
                    className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    View All
                  </Link>
                </div>
                {isLoading ? (
                  <div className="p-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : nextTrip ? (
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-40 h-28 rounded-2xl overflow-hidden shadow-sm">
                      <img
                        src={
                          nextTrip.tours
                            ? nextTrip.tours.images?.[0]
                            : nextTrip.packages?.cover_image ||
                              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
                        }
                        className="w-full h-full object-cover"
                        alt="Trip"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-2">
                        {(nextTrip.tours || nextTrip.packages)?.title ||
                          (nextTrip.tours || nextTrip.packages)?.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(
                            new Date(
                              nextTrip.booking_date ||
                                nextTrip.start_time ||
                                nextTrip.check_in_date,
                            ),
                            'MMM dd, yyyy',
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {(nextTrip.tours || nextTrip.packages)?.location?.city ||
                            (nextTrip.tours || nextTrip.packages)?.location ||
                            'TBA'}
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-6 rounded-full px-6"
                      >
                        <Link to="/trips">Manage Booking</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Compass className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium mb-6">No upcoming trips booked yet.</p>
                    <Button asChild className="rounded-full px-8">
                      <Link to="/explore">Explore Experiences</Link>
                    </Button>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Recent Wishlist Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard
                variant="card"
                className="p-0 overflow-hidden rounded-3xl border-none shadow-xl shadow-gray-200/50"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Recently Saved
                  </h2>
                  <Link
                    to="/wishlist"
                    className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {recentWishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentWishlist.map((item) => (
                        <Link
                          key={item.id}
                          to={
                            item.type === 'tour'
                              ? `/tours/${item.slug || item.id}`
                              : `/packages/${item.slug || item.id}`
                          }
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                            <img
                              src={
                                item.images?.[0] ||
                                item.cover_image ||
                                'https://images.unsplash.com/photo-1469474968028-56623f02e42e'
                              }
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt={item.title || item.name}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate mb-1">
                              {item.title || item.name}
                            </h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {typeof item.location === 'string'
                                ? item.location
                                : item.location?.city || 'Globe'}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-gray-400 text-sm italic">Nothing saved yet</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Right Column: Profile & Quick Links */}
          <div className="space-y-8">
            {/* Profile Completion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard
                variant="card"
                className="p-6 rounded-3xl border-none shadow-xl shadow-gray-200/50 bg-primary/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <BadgeCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Profile Completion</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                  Complete your profile to unlock all features.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-black text-primary uppercase tracking-widest">
                    <span>Current Progress</span>
                    <span>40%</span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[40%] rounded-full" />
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-2xl h-12 font-bold bg-white border-none shadow-sm hover:shadow-md transition-all"
                >
                  <Link to="/profile">Complete Profile</Link>
                </Button>
              </GlassCard>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">
                Quick Navigation
              </h3>
              <div className="space-y-3">
                <QuickLink
                  to="/trips"
                  icon={Luggage}
                  label="My Bookings"
                  color="bg-emerald-50 text-emerald-600"
                />
                <QuickLink
                  to="/wishlist"
                  icon={Heart}
                  label="Wishlist"
                  color="bg-rose-50 text-rose-600"
                />
                <QuickLink
                  to="/settings"
                  icon={Settings}
                  label="Settings"
                  color="bg-blue-50 text-blue-600"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  to,
  icon: Icon,
  label,
  color,
}: {
  to: string
  icon: any
  label: string
  color: string
}) {
  return (
    <Link to={to}>
      <GlassCard
        variant="light"
        className="p-4 rounded-2xl border-none shadow-sm hover:shadow-md hover:bg-white transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </GlassCard>
    </Link>
  )
}
