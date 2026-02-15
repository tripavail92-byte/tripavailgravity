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
      value: '$12,450',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      period: 'this month',
    },
    {
      label: 'Total Bookings',
      value: '42',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Calendar,
      period: 'active',
    },
    {
      label: 'Occupancy Rate',
      value: '78%',
      change: '+5.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      period: 'this month',
    },
    {
      label: 'Average Rating',
      value: '4.8',
      change: '+0.2',
      trend: 'up' as const,
      icon: Star,
      period: 'from 124 reviews',
    },
  ]

  const tourStats = [
    {
      label: 'Tour Revenue',
      value: '$8,240',
      change: '+15.2%',
      trend: 'up' as const,
      icon: DollarSign,
      period: 'this month',
    },
    {
      label: 'Total Travellers',
      value: '156',
      change: '+22.4%',
      trend: 'up' as const,
      icon: Users,
      period: 'this month',
    },
    {
      label: 'Active Tours',
      value: '12',
      change: '+2',
      trend: 'up' as const,
      icon: MapPin,
      period: 'published',
    },
    {
      label: 'Experience Rating',
      value: '4.9',
      change: '+0.1',
      trend: 'up' as const,
      icon: Star,
      period: 'from 84 reviews',
    },
  ]

  const stats = isTourOperator ? tourStats : hotelStats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
