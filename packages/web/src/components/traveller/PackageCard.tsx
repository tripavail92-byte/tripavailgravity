
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PackageCardProps {
    id: string;
    image: string;
    title: string;
    location?: string;
    duration?: number;
    rating?: number;
    price: number;
    type: string;
}

export function PackageCard({ id, image, title, location, duration, rating, price, type }: PackageCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
            onClick={() => navigate(`/packages/${id}`)}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/90 font-medium capitalize">
                        {type.replace('-', ' ')}
                    </Badge>
                </div>
                <div className="absolute top-3 right-3">
                    <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-white hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                    </h3>
                    {rating && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span>{rating}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate max-w-[100px]">{location || 'Multiple Locations'}</span>
                    </div>
                    {duration && (
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{duration} Days</span>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100 mt-3">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">From</span>
                        <span className="font-bold text-lg text-primary">${price}</span>
                    </div>
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                        View Details
                    </Badge>
                </div>
            </div>
        </Card>
    );
}
