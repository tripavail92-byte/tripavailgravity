import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MessageCircle, User, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface BookingCardProps {
    id: string;
    guestName: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: string;
    status: 'confirmed' | 'pending' | 'checkin-today';
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
            color: 'text-green-600',
            bg: 'bg-green-50',
            label: 'Confirmed',
        },
        pending: {
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            label: 'Pending',
        },
        'checkin-today': {
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            label: 'Check-in Today',
        },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <div className={`p-4 rounded-lg ${config.bg} border border-gray-100`}>
            <div className="flex items-start gap-3">
                {/* Guest Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                        <span>{checkIn} • {nights} nights</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{totalPrice}</span>
                        <Button variant="ghost" size="sm" className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Message
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RecentBookings() {
    // Mock data - will be replaced with real data
    const bookings = [
        {
            id: '1',
            guestName: 'John Doe',
            roomType: 'Deluxe Ocean View',
            checkIn: 'Jan 15',
            checkOut: 'Jan 20',
            nights: 5,
            totalPrice: '$1,200',
            status: 'confirmed' as const,
        },
        {
            id: '2',
            guestName: 'Sarah Miller',
            roomType: 'Executive Suite',
            checkIn: 'Jan 22',
            checkOut: 'Jan 25',
            nights: 3,
            totalPrice: '$900',
            status: 'pending' as const,
        },
        {
            id: '3',
            guestName: 'Mike Johnson',
            roomType: 'Standard Room',
            checkIn: 'Today',
            checkOut: 'Jan 18',
            nights: 3,
            totalPrice: '$450',
            status: 'checkin-today' as const,
        },
    ];

    return (
        <div>
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                        <p className="text-sm text-gray-600 mt-1">Upcoming check-ins</p>
                    </div>
                    <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                        View All
                    </Button>
                </div>

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
            </Card>
        </div>
    );
}
