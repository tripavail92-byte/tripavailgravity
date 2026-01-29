import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MapPin, Clock, Camera, Utensils, X, GripVertical } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';

interface TourItineraryStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

interface ItineraryDay {
  id: string;
  day: number;
  title: string;
  description: string;
  activities: Activity[];
}

interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  type: 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'activity' | 'free-time';
  duration: string;
}

const ACTIVITY_TYPES = [
  { id: 'sightseeing', label: 'Sightseeing', icon: Camera, color: '#5FAD43' },
  { id: 'meal', label: 'Meal', icon: Utensils, color: '#FF9800' },
  { id: 'transport', label: 'Transport', icon: MapPin, color: '#2196F3' },
  { id: 'accommodation', label: 'Accommodation', icon: Clock, color: '#9C27B0' },
  { id: 'activity', label: 'Activity', icon: Plus, color: '#F44336' },
  { id: 'free-time', label: 'Free Time', icon: Clock, color: '#4CAF50' }
];

const SUGGESTED_ACTIVITIES = {
  sightseeing: ['Visit Historical Monument', 'City Walking Tour', 'Museum Visit', 'Cultural Site Tour'],
  meal: ['Local Breakfast', 'Traditional Lunch', 'Dinner at Local Restaurant', 'Street Food Tour'],
  transport: ['Hotel Pickup', 'Airport Transfer', 'Local Transportation', 'Return Journey'],
  accommodation: ['Hotel Check-in', 'Hotel Check-out', 'Camp Setup', 'Rest at Hotel'],
  activity: ['Hiking', 'Photography Session', 'Shopping', 'Local Market Visit'],
  'free-time': ['Rest & Relaxation', 'Personal Time', 'Optional Activities', 'Leisure Time']
};

export function TourItineraryStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourItineraryStepProps) {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    data.itinerary || [
      {
        id: '1',
        day: 1,
        title: 'Day 1',
        description: '',
        activities: []
      }
    ]
  );

  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    time: '',
    title: '',
    description: '',
    location: '',
    type: 'sightseeing',
    duration: '1 hour'
  });

  useEffect(() => {
    onUpdate({ itinerary });
  }, [itinerary]);

  const addDay = useCallback(() => {
    setItinerary(prev => {
      const newDay: ItineraryDay = {
        id: Date.now().toString(),
        day: prev.length + 1,
        title: `Day ${prev.length + 1}`,
        description: '',
        activities: []
      };
      return [...prev, newDay];
    });
  }, []);

  const removeDay = useCallback((dayId: string) => {
    setItinerary(prev => {
      if (prev.length > 1) {
        const newItinerary = prev.filter(day => day.id !== dayId);
        setSelectedDay(current => current >= newItinerary.length ? Math.max(0, current - 1) : current);
        return newItinerary;
      }
      return prev;
    });
  }, []);

  const updateDay = useCallback((dayId: string, field: string, value: string) => {
    setItinerary(prev => prev.map(day => 
      day.id === dayId ? { ...day, [field]: value } : day
    ));
  }, []);

  const addActivity = () => {
    if (newActivity.title && newActivity.time) {
      const activity: Activity = {
        id: Date.now().toString(),
        time: newActivity.time!,
        title: newActivity.title!,
        description: newActivity.description || '',
        location: newActivity.location || '',
        type: newActivity.type as Activity['type'],
        duration: newActivity.duration || '1 hour'
      };

      setItinerary(prev => prev.map((day, index) => 
        index === selectedDay 
          ? { ...day, activities: [...day.activities, activity].sort((a, b) => a.time.localeCompare(b.time)) }
          : day
      ));

      setNewActivity({
        time: '',
        title: '',
        description: '',
        location: '',
        type: 'sightseeing',
        duration: '1 hour'
      });
      setShowAddActivity(false);
    }
  };

  const removeActivity = (activityId: string) => {
    setItinerary(prev => prev.map((day, index) => 
      index === selectedDay 
        ? { ...day, activities: day.activities.filter(activity => activity.id !== activityId) }
        : day
    ));
  };

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.id === type) || ACTIVITY_TYPES[0];
  };

  const currentDay = itinerary[selectedDay];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-[#5FAD43] to-[#4a9637] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Itinerary</h2>
            <p className="text-green-100">Plan your day-by-day tour schedule</p>
          </div>
        </div>
      </Card>

      {/* Day Tabs */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Itinerary Days</h3>
          <Button
            size="sm"
            onClick={addDay}
            className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Day
          </Button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {itinerary.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedDay === index
                  ? 'border-[#5FAD43] bg-[#5FAD43] text-white'
                  : 'border-gray-200 hover:border-[#5FAD43] text-gray-700'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>

        {/* Day Details */}
        {currentDay && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day Title
                </label>
                <Input
                  value={currentDay.title}
                  onChange={(e) => updateDay(currentDay.id, 'title', e.target.value)}
                  placeholder={`Day ${currentDay.day} - Enter title`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day Description
                </label>
                <Textarea
                  value={currentDay.description}
                  onChange={(e) => updateDay(currentDay.id, 'description', e.target.value)}
                  placeholder="Describe what happens on this day..."
                  rows={2}
                />
              </div>
            </div>

            {itinerary.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeDay(currentDay.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Remove Day
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Activities */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Activities - Day {currentDay?.day}
          </h3>
          <Button
            size="sm"
            onClick={() => setShowAddActivity(true)}
            className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Activity
          </Button>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {currentDay?.activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No activities added yet</p>
              <p className="text-sm">Click "Add Activity" to get started</p>
            </div>
          ) : (
            currentDay?.activities.map((activity) => {
              const typeInfo = getActivityTypeInfo(activity.type);
              const TypeIcon = typeInfo.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${typeInfo.color}20` }}
                    >
                      <TypeIcon 
                        className="w-4 h-4" 
                        style={{ color: typeInfo.color }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{activity.time}</span>
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${typeInfo.color}20`,
                              color: typeInfo.color 
                            }}
                          >
                            {typeInfo.label}
                          </Badge>
                          <span className="text-sm text-gray-500">({activity.duration})</span>
                        </div>
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        {activity.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-500">{activity.location}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActivity(activity.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddActivity && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">Add New Activity</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <Select 
                      value={newActivity.duration} 
                      onValueChange={(value) => setNewActivity(prev => ({ ...prev, duration: value }))}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, type: value as Activity['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Title
                  </label>
                  <Input
                    value={newActivity.title}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter activity title"
                  />
                  
                  {/* Quick suggestions */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {SUGGESTED_ACTIVITIES[newActivity.type as keyof typeof SUGGESTED_ACTIVITIES]?.slice(0, 3).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setNewActivity(prev => ({ ...prev, title: suggestion }))}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Optional)
                  </label>
                  <Input
                    value={newActivity.location}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
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
                  className="flex-1 bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
                >
                  Add Activity
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className="px-6"
        >
          Previous
        </Button>
        
        <Button
          onClick={onNext}
          className="bg-tour-operator text-white px-6"
        >
          Next: Pricing
        </Button>
      </div>
    </motion.div>
  );
}