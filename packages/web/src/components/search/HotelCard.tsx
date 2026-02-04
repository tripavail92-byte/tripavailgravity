import { Hotel } from '@tripavail/shared/services/searchService'
import { Heart, Star } from 'lucide-react'

import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface HotelCardProps {
  hotel: Hotel
  onClick?: () => void
}

export function HotelCard({ hotel, onClick }: HotelCardProps) {
  // Fallback image if none provided
  const image =
    hotel.main_image_url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'

  return (
    <Card
      className="group overflow-hidden cursor-pointer border-0 shadow-none hover:shadow-xl transition-all duration-300 rounded-xl"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
        <img
          src={image}
          alt={hotel.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <button className="absolute top-3 right-3 p-2 bg-transparent hover:bg-white/20 rounded-full transition-colors">
          <Heart className="w-6 h-6 text-white stroke-2" />
        </button>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-lg line-clamp-1">{hotel.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-current text-black" />
            <span className="text-sm font-medium">{hotel.rating || 'New'}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{hotel.location}</p>
        <p className="text-muted-foreground text-sm line-clamp-1">
          {hotel.description || 'Experience a wonderful stay...'}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-lg">${hotel.base_price_per_night}</span>
          <span className="text-muted-foreground text-sm">night</span>
        </div>
      </CardFooter>
    </Card>
  )
}
