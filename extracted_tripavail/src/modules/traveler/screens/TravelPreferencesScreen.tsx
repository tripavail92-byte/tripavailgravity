import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, Save, Mountain, Waves, Building2, Trees, 
  Camera, Utensils, Palette, Music, Heart, Star, 
  Plane, Car, Train, Ship, MapPin, Calendar,
  DollarSign, Users, Clock, Thermometer
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Slider } from '../../../components/ui/slider';
import { Checkbox } from '../../../components/ui/checkbox';

interface TravelPreferencesScreenProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

export default function TravelPreferencesScreen({ onNavigate, onBack }: TravelPreferencesScreenProps) {
  const [preferences, setPreferences] = useState({
    interests: ['Adventure', 'Culture', 'Food', 'Photography'],
    destinations: ['Beach', 'Mountains'],
    budget: [500, 2000],
    travelStyle: 'mid-range',
    groupSize: 'couple',
    transportation: ['Plane', 'Car'],
    accommodation: ['Hotel', 'Resort'],
    season: ['Spring', 'Summer'],
    duration: [3, 14],
    activities: ['Sightseeing', 'Restaurants', 'Shopping']
  });

  const interestOptions = [
    { id: 'adventure', label: 'Adventure', icon: Mountain, color: '#EF4444' },
    { id: 'culture', label: 'Culture', icon: Palette, color: '#8B5CF6' },
    { id: 'food', label: 'Food', icon: Utensils, color: '#F59E0B' },
    { id: 'photography', label: 'Photography', icon: Camera, color: '#3B82F6' },
    { id: 'nature', label: 'Nature', icon: Trees, color: '#10B981' },
    { id: 'nightlife', label: 'Nightlife', icon: Music, color: '#EC4899' },
    { id: 'wellness', label: 'Wellness', icon: Heart, color: '#06B6D4' },
    { id: 'history', label: 'History', icon: Building2, color: '#78716C' }
  ];

  const destinationTypes = [
    { id: 'beach', label: 'Beach', icon: Waves, color: '#0EA5E9' },
    { id: 'mountains', label: 'Mountains', icon: Mountain, color: '#84CC16' },
    { id: 'cities', label: 'Cities', icon: Building2, color: '#6B7280' },
    { id: 'countryside', label: 'Countryside', icon: Trees, color: '#22C55E' }
  ];

  const transportOptions = [
    { id: 'plane', label: 'Plane', icon: Plane },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'ship', label: 'Ship', icon: Ship }
  ];

  const accommodationTypes = [
    'Hotel', 'Resort', 'Apartment', 'Hostel', 'Villa', 'B&B', 'Camping'
  ];

  const activityTypes = [
    'Sightseeing', 'Restaurants', 'Shopping', 'Museums', 'Tours', 
    'Beach Activities', 'Hiking', 'Water Sports', 'Cultural Events', 'Nightlife'
  ];

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];

  const handleInterestToggle = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleDestinationToggle = (destination: string) => {
    setPreferences(prev => ({
      ...prev,
      destinations: prev.destinations.includes(destination)
        ? prev.destinations.filter(d => d !== destination)
        : [...prev.destinations, destination]
    }));
  };

  const handleTransportToggle = (transport: string) => {
    setPreferences(prev => ({
      ...prev,
      transportation: prev.transportation.includes(transport)
        ? prev.transportation.filter(t => t !== transport)
        : [...prev.transportation, transport]
    }));
  };

  const handleActivityToggle = (activity: string) => {
    setPreferences(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const handleSeasonToggle = (season: string) => {
    setPreferences(prev => ({
      ...prev,
      season: prev.season.includes(season)
        ? prev.season.filter(s => s !== season)
        : [...prev.season, season]
    }));
  };

  const handleAccommodationToggle = (accommodation: string) => {
    setPreferences(prev => ({
      ...prev,
      accommodation: prev.accommodation.includes(accommodation)
        ? prev.accommodation.filter(a => a !== accommodation)
        : [...prev.accommodation, accommodation]
    }));
  };

  const handleSave = () => {
    // Save preferences
    console.log('Saving preferences:', preferences);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">Travel Preferences</h2>
        </div>
        <Button onClick={handleSave} className="bg-[#5FAD43] hover:bg-[#4a8f35]">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Travel Interests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Travel Interests</h3>
          <p className="text-sm text-gray-600 mb-4">
            What type of experiences do you enjoy most?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {interestOptions.map((interest) => (
              <motion.button
                key={interest.id}
                onClick={() => handleInterestToggle(interest.label)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.interests.includes(interest.label)
                    ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${interest.color}15` }}
                  >
                    <interest.icon className="w-5 h-5" style={{ color: interest.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{interest.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Destination Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preferred Destinations</h3>
          <p className="text-sm text-gray-600 mb-4">
            What type of places do you like to visit?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {destinationTypes.map((destination) => (
              <motion.button
                key={destination.id}
                onClick={() => handleDestinationToggle(destination.label)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.destinations.includes(destination.label)
                    ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${destination.color}15` }}
                  >
                    <destination.icon className="w-5 h-5" style={{ color: destination.color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{destination.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Budget Range */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Budget Range (USD)</h3>
          <p className="text-sm text-gray-600 mb-4">
            How much do you typically spend on a trip?
          </p>
          <div className="space-y-4">
            <Slider
              value={preferences.budget}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, budget: value }))}
              max={5000}
              min={100}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>${preferences.budget[0]}</span>
              <span>${preferences.budget[1]}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Travel Style & Group Size */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Travel Style</h3>
          <Select value={preferences.travelStyle} onValueChange={(value) => setPreferences(prev => ({ ...prev, travelStyle: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="mid-range">Mid-range</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="backpacking">Backpacking</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Group Size</h3>
          <Select value={preferences.groupSize} onValueChange={(value) => setPreferences(prev => ({ ...prev, groupSize: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Solo</SelectItem>
              <SelectItem value="couple">Couple</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="group">Large Group</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </motion.div>

      {/* Trip Duration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Duration (Days)</h3>
          <p className="text-sm text-gray-600 mb-4">
            How long are your typical trips?
          </p>
          <div className="space-y-4">
            <Slider
              value={preferences.duration}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, duration: value }))}
              max={30}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{preferences.duration[0]} day{preferences.duration[0] > 1 ? 's' : ''}</span>
              <span>{preferences.duration[1]} days</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Transportation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Transportation</h3>
          <p className="text-sm text-gray-600 mb-4">
            How do you prefer to travel?
          </p>
          <div className="grid grid-cols-4 gap-3">
            {transportOptions.map((transport) => (
              <motion.button
                key={transport.id}
                onClick={() => handleTransportToggle(transport.label)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.transportation.includes(transport.label)
                    ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <transport.icon className="w-6 h-6 text-gray-600" />
                  <span className="text-xs font-medium text-gray-900">{transport.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Accommodation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Accommodation</h3>
          <p className="text-sm text-gray-600 mb-4">
            What type of places do you like to stay?
          </p>
          <div className="flex flex-wrap gap-2">
            {accommodationTypes.map((accommodation) => (
              <motion.button
                key={accommodation}
                onClick={() => handleAccommodationToggle(accommodation)}
                className={`px-4 py-2 rounded-full border-2 transition-all ${
                  preferences.accommodation.includes(accommodation)
                    ? 'border-[#5FAD43] bg-[#5FAD43] text-white'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm font-medium">{accommodation}</span>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Preferred Season */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preferred Season</h3>
          <p className="text-sm text-gray-600 mb-4">
            When do you prefer to travel?
          </p>
          <div className="grid grid-cols-4 gap-3">
            {seasons.map((season) => (
              <motion.button
                key={season}
                onClick={() => handleSeasonToggle(season)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  preferences.season.includes(season)
                    ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Thermometer className="w-6 h-6 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{season}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preferred Activities</h3>
          <p className="text-sm text-gray-600 mb-4">
            What do you like to do when you travel?
          </p>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((activity) => (
              <motion.button
                key={activity}
                onClick={() => handleActivityToggle(activity)}
                className={`px-4 py-2 rounded-full border-2 transition-all ${
                  preferences.activities.includes(activity)
                    ? 'border-[#5FAD43] bg-[#5FAD43] text-white'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm font-medium">{activity}</span>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}