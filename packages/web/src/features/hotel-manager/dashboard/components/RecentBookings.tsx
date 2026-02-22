import { Calendar, CheckCircle, Clock, MessageCircle, User } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'

interface BookingCardProps {
  id: string
  guestName: string
  roomType: string
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: string
  status: 'confirmed' | 'pending' | 'checkin-today'
}

function BookingCard({
  guestName,
  roomType,
  checkIn,
  nights,
  totalPrice,
  status,
}: BookingCardProps) {
  const statusConfig = {
    confirmed: {
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success-foreground',
      label: 'Confirmed',
    },
    pending: {
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning-foreground',
      label: 'Pending',
    },
    'checkin-today': {
      icon: Calendar,
      color: 'text-info',
      bg: 'bg-primary/10',
      label: 'Check-in Today',
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className={`p-4 rounded-lg ${config.bg} border border-gray-100`}>
      <div className="flex items-start gap-3">
        {/* Guest Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-gradient">
          <User className="w-5 h-5 text-white" />
        </div>

        {/* Booking Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-medium text-gray-900">{guestName}</h4>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </div>

          <p className="text-sm text-gray-600 mb-2">{roomType}</p>

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Calendar className="w-3 h-3" />
            <span>
              {checkIn} • {nights} nights
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">{totalPrice}</span>
            <Button variant="ghost" size="sm" className="h-8 hover:bg-primary/10 text-primary">
              <MessageCircle className="w-3 h-3 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RecentBookings() {
  // No mock/demo data: show empty state until real bookings are wired.
  const bookings: BookingCardProps[] = []

  return (
    <div>
      <GlassCard variant="card" className="p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <p className="text-sm text-gray-600 mt-1">Upcoming check-ins</p>
          </div>
          <Button variant="ghost" className="hover:bg-primary/10 text-primary">
            View All
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-600 font-medium">No bookings yet</p>
            <p className="text-xs text-gray-500 mt-1">
              New reservations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
              >
                <BookingCard {...booking} />
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
