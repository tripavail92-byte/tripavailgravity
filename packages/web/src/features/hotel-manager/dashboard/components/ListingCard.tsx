import { GlassCard, GlassBadge } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { Building, Eye, Edit, Pause, Play, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

interface ListingCardProps {
    id: string;
    name: string;
    location: string;
    status: 'published' | 'draft' | 'paused';
    imageUrl?: string;
    bookings: number;
    rating: number;
    revenue: string;
}

export function ListingCard({
    name,
    location,
    status,
    imageUrl,
    bookings,
    rating,
    revenue,
}: ListingCardProps) {
    const statusConfig = {
        published: {
            badge: 'Published',
            color: 'bg-success-foreground text-success border-success/20',
            icon: Play,
        },
        draft: {
            badge: 'Draft',
            color: 'bg-warning-foreground text-warning border-warning/20',
            icon: Edit,
        },
        paused: {
            badge: 'Paused',
            color: 'bg-gray-100 text-gray-700 border-gray-200',
            icon: Pause,
        },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <GlassCard variant="card" className="overflow-hidden rounded-2xl hover:shadow-lg transition-shadow duration-200 group">
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flexitems-center justify-center">
                        <Building className="w-16 h-16 text-gray-400 mx-auto mt-16" />
                    </div>
                )}

                {/* Status Badge */}
                <GlassBadge variant="light" className={`absolute top-3 left-3 flex items-center gap-1 ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.badge}
                </GlassBadge>

                {/* Actions Menu */}
                <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-gray-700" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{name}</h3>
                <p className="text-sm text-gray-600 mb-3">{location}</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div>
                        <p className="text-xs text-gray-500">Bookings</p>
                        <p className="text-sm font-semibold text-gray-900">{bookings}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="text-sm font-semibold text-gray-900">⭐ {rating}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-sm font-semibold text-gray-900">{revenue}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Stats
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}
