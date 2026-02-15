import { Camera, Clock, MapPin, Plus, Utensils, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tour } from '@/features/tour-operator/services/tourService'

interface TourItineraryStepProps {
  data: Partial<Tour>
  onUpdate: (data: Partial<Tour>) => void
  onNext: () => void
  onBack: () => void
}

interface ItineraryDay {
  id: string
  day: number
  title: string
  description: string
  activities: Activity[]
}

interface Activity {
  id: string
  time: string
  title: string
  description: string
  location: string
  type: 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'activity' | 'free-time'
  duration: string
}

const ACTIVITY_TYPES = [
  { id: 'sightseeing', label: 'Sightseeing', icon: Camera, color: 'var(--primary)' },
  { id: 'meal', label: 'Meal', icon: Utensils, color: '#f59e0b' }, // amber-500
  { id: 'transport', label: 'Transport', icon: MapPin, color: '#3b82f6' }, // blue-500
  { id: 'accommodation', label: 'Accommodation', icon: Clock, color: '#a855f7' }, // purple-500
  { id: 'activity', label: 'Activity', icon: Plus, color: '#ef4444' }, // red-500
  { id: 'free-time', label: 'Free Time', icon: Clock, color: '#10b981' }, // emerald-500
]

const SUGGESTED_ACTIVITIES = {
  sightseeing: [
    'Visit Historical Monument',
    'City Walking Tour',
    'Museum Visit',
    'Cultural Site Tour',
  ],
  meal: ['Local Breakfast', 'Traditional Lunch', 'Dinner at Local Restaurant', 'Street Food Tour'],
  transport: ['Hotel Pickup', 'Airport Transfer', 'Local Transportation', 'Return Journey'],
  accommodation: ['Hotel Check-in', 'Hotel Check-out', 'Camp Setup', 'Rest at Hotel'],
  activity: ['Hiking', 'Photography Session', 'Shopping', 'Local Market Visit'],
  'free-time': ['Rest & Relaxation', 'Personal Time', 'Optional Activities', 'Leisure Time'],
}

export function TourItineraryStep({ data, onUpdate, onNext, onBack }: TourItineraryStepProps) {
  // Initialize state from prop data or default to Day 1
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    (data as any).itinerary || [
      {
        id: '1',
        day: 1,
        title: 'Day 1',
        description: '',
        activities: [],
      },
    ],
  )

  const [selectedDay, setSelectedDay] = useState(0)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    time: '',
    title: '',
    description: '',
    location: '',
    type: 'sightseeing',
    duration: '1 hour',
  })

  // Sync local state to parent
  useEffect(() => {
    onUpdate({ itinerary: itinerary } as any)
  }, [itinerary])

  const addDay = useCallback(() => {
    setItinerary((prev) => {
      const newDay: ItineraryDay = {
        id: Date.now().toString(),
        day: prev.length + 1,
        title: `Day ${prev.length + 1}`,
        description: '',
        activities: [],
      }
      return [...prev, newDay]
    })
    // Auto-select the new day
    setSelectedDay(itinerary.length)
  }, [itinerary.length])

  const removeDay = useCallback((dayId: string) => {
    setItinerary((prev) => {
      if (prev.length > 1) {
        const newItinerary = prev
          .filter((day) => day.id !== dayId)
          // Re-index days
          .map((day, index) => ({
            ...day,
            day: index + 1,
            title: day.title.startsWith('Day ') ? `Day ${index + 1}` : day.title,
          }))

        setSelectedDay((current) =>
          current >= newItinerary.length ? Math.max(0, current - 1) : current,
        )
        return newItinerary
      }
      return prev
    })
  }, [])

  const updateDay = useCallback((dayId: string, field: string, value: string) => {
    setItinerary((prev) => prev.map((day) => (day.id === dayId ? { ...day, [field]: value } : day)))
  }, [])

  const addActivity = () => {
    if (newActivity.title && newActivity.time) {
      const activity: Activity = {
        id: Date.now().toString(),
        time: newActivity.time!,
        title: newActivity.title!,
        description: newActivity.description || '',
        location: newActivity.location || '',
        type: newActivity.type as Activity['type'],
        duration: newActivity.duration || '1 hour',
      }

      setItinerary((prev) =>
        prev.map((day, index) =>
          index === selectedDay
            ? {
                ...day,
                activities: [...day.activities, activity].sort((a, b) =>
                  a.time.localeCompare(b.time),
                ),
              }
            : day,
        ),
      )

      setNewActivity({
        time: '',
        title: '',
        description: '',
        location: '',
        type: 'sightseeing',
        duration: '1 hour',
      })
      setShowAddActivity(false)
    }
  }

  const removeActivity = (activityId: string) => {
    setItinerary((prev) =>
      prev.map((day, index) =>
        index === selectedDay
          ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) }
          : day,
      ),
    )
  }

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === type) || ACTIVITY_TYPES[0]
  }

  const currentDay = itinerary[selectedDay]

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tour Itinerary</h2>
            <p className="text-white/90 text-sm font-medium">Plan your day-by-day tour schedule</p>
          </div>
        </div>
      </Card>

      {/* Day Tabs */}
      <Card className="p-4 bg-white border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Itinerary Days</h3>
          <Button
            size="sm"
            onClick={addDay}
            className="bg-primary hover:bg-primary/90 text-white border-none shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Day
          </Button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {itinerary.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                selectedDay === index
                  ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>

        {/* Day Details */}
        {currentDay && (
          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Day Title
                </label>
                <Input
                  value={currentDay.title}
                  onChange={(e) => updateDay(currentDay.id, 'title', e.target.value)}
                  placeholder={`Day ${currentDay.day} - Enter title`}
                  className="bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Day Description
                </label>
                <Textarea
                  value={currentDay.description}
                  onChange={(e) => updateDay(currentDay.id, 'description', e.target.value)}
                  placeholder="Describe what happens on this day..."
                  rows={2}
                  className="bg-white resize-none"
                />
              </div>
            </div>

            {itinerary.length > 1 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDay(currentDay.id)}
                  className="text-destructive border-red-100 hover:bg-red-50 hover:border-red-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove Day
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Activities */}
      <Card className="p-4 bg-white border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">
            Activities - <span className="text-primary">Day {currentDay?.day}</span>
          </h3>
          <Button
            size="sm"
            onClick={() => setShowAddActivity(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Activity
          </Button>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {currentDay?.activities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-medium">No activities added yet</p>
              <p className="text-sm text-gray-500">
                Click "Add Activity" to start planning Day {currentDay?.day}
              </p>
            </div>
          ) : (
            currentDay?.activities.map((activity) => {
              const typeInfo = getActivityTypeInfo(activity.type)
              const TypeIcon = typeInfo.icon

              return (
                <motion.div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-white hover:border-primary/30 hover:shadow-md transition-all group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${typeInfo.color}15` }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: typeInfo.color }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                            {activity.time}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase tracking-wider border-none"
                            style={{
                              backgroundColor: `${typeInfo.color}15`,
                              color: typeInfo.color,
                            }}
                          >
                            {typeInfo.label}
                          </Badge>
                          <span className="text-xs font-semibold text-gray-400">
                            {' '}
                            • {activity.duration}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{activity.title}</h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {activity.description}
                          </p>
                        )}
                        {activity.location && (
                          <div className="flex items-center gap-1.5 mt-2 text-gray-500 bg-gray-50 inline-flex px-2 py-1 rounded-lg">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs font-medium">{activity.location}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActivity(activity.id)}
                        className="text-gray-300 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </Card>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddActivity(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Add New Activity</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddActivity(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) =>
                        setNewActivity((prev) => ({ ...prev, time: e.target.value }))
                      }
                      className="font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Duration
                    </label>
                    <Select
                      value={newActivity.duration}
                      onValueChange={(value) =>
                        setNewActivity((prev) => ({ ...prev, duration: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 minutes">30 minutes</SelectItem>
                        <SelectItem value="1 hour">1 hour</SelectItem>
                        <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                        <SelectItem value="2 hours">2 hours</SelectItem>
                        <SelectItem value="3 hours">3 hours</SelectItem>
                        <SelectItem value="4 hours">4 hours</SelectItem>
                        <SelectItem value="Half day">Half day</SelectItem>
                        <SelectItem value="Full day">Full day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Activity Type
                  </label>
                  <Select
                    value={newActivity.type}
                    onValueChange={(value) =>
                      setNewActivity((prev) => ({ ...prev, type: value as Activity['type'] }))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: type.color }} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Activity Title
                  </label>
                  <Input
                    value={newActivity.title}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Visit the National Museum"
                    className="font-medium"
                  />

                  {/* Quick suggestions */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {SUGGESTED_ACTIVITIES[newActivity.type as keyof typeof SUGGESTED_ACTIVITIES]
                      ?.slice(0, 4)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setNewActivity((prev) => ({ ...prev, title: suggestion }))}
                          className="text-[10px] font-bold bg-gray-50 text-gray-600 hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full transition-colors border border-gray-100"
                        >
                          + {suggestion}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Location (Optional)
                  </label>
                  <Input
                    value={newActivity.location}
                    onChange={(e) =>
                      setNewActivity((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g. 123 Main St, City Center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={newActivity.description}
                    onChange={(e) =>
                      setNewActivity((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Any important details for this activity..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddActivity(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addActivity}
                  disabled={!newActivity.title || !newActivity.time}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  Add Activity
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="flex justify-between pt-6 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} size="lg" className="px-8 border-gray-200">
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-8 bg-primary hover:bg-primary/90 text-white font-bold"
          disabled={itinerary.length === 0}
        >
          Next Step
        </Button>
      </div>
    </motion.div>
  )
}
