import { motion } from 'motion/react'
import { MapPin, Clock, Star, Users, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { Tour } from '@/features/tour-operator/services/tourService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ActiveToursGridProps {
  tours: Tour[]
  onEdit: (tour: Tour) => void
  onDelete: (tour: Tour) => void
  onView: (tour: Tour) => void
}

export function ActiveToursGrid({ tours, onEdit, onDelete, onView }: ActiveToursGridProps) {
  if (tours.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tours.map((tour, index) => (
        <motion.div
          key={tour.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
        >
          {/* Image Placeholder/Preview */}
          <div className="aspect-[16/9] bg-gray-100 relative">
            {tour.images && tour.images.length > 0 ? (
              <img src={tour.images[0]} alt={tour.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-200" />
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-none">
                {tour.tour_type}
              </Badge>
              {tour.is_featured && (
                <Badge className="bg-primary text-white border-none">Featured</Badge>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                  {tour.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium truncate">
                    {tour.location.city}, {tour.location.country}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:text-primary"
                  onClick={() => onEdit(tour)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:text-destructive"
                  onClick={() => onDelete(tour)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {tour.duration}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {tour.min_participants}-{tour.max_participants} px
              </div>
              {tour.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {tour.rating}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Starts from
                </p>
                <p className="text-lg font-bold text-primary">
                  {tour.currency} {tour.price}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => onView(tour)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Live
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
