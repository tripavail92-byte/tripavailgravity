import { Calendar, DollarSign, MapPin, Star, TrendingUp, Users } from 'lucide-react'
import { motion } from 'motion/react'

import { useAuth } from '@/hooks/useAuth'

import { StatCard } from './StatCard'

export function StatsOverview() {
  const { activeRole } = useAuth()
  const isTourOperator = activeRole?.role_type === 'tour_operator'

  const hotelStats = [
    {
      label: 'Total Revenue',
      value: '$0',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: DollarSign,
    },
    {
      label: 'Total Bookings',
      value: '0',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: Calendar,
    },
    {
      label: 'Occupancy Rate',
      value: '0%',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: TrendingUp,
    },
    {
      label: 'Average Rating',
      value: '—',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: Star,
    },
  ]

  const tourStats = [
    {
      label: 'Tour Revenue',
      value: '$0',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: DollarSign,
    },
    {
      label: 'Total Travellers',
      value: '0',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: Users,
    },
    {
      label: 'Active Tours',
      value: '0',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: MapPin,
    },
    {
      label: 'Experience Rating',
      value: '—',
      change: 'No data yet',
      trend: 'neutral' as const,
      icon: Star,
    },
  ]

  const stats = isTourOperator ? tourStats : hotelStats

  return (
    <div
      data-tour="dashboard-stats"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}
