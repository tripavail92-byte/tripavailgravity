import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Users, Star, Sparkles, Globe } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';

interface TourBasicsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

const TOUR_CATEGORIES = [
  { id: 'adventure', label: 'Adventure Tours', icon: '🏔️', color: '#5FAD43' },
  { id: 'cultural', label: 'Cultural Tours', icon: '🏛️', color: '#9D6777' },
  { id: 'nature', label: 'Nature & Wildlife', icon: '🌿', color: '#4CAF50' },
  { id: 'city', label: 'City Tours', icon: '🏙️', color: '#2196F3' },
  { id: 'food', label: 'Food & Culinary', icon: '🍜', color: '#FF9800' },
  { id: 'beach', label: 'Beach & Coastal', icon: '🏖️', color: '#00BCD4' },
  { id: 'historical', label: 'Historical Tours', icon: '🏰', color: '#795548' },
  { id: 'religious', label: 'Religious Tours', icon: '🕌', color: '#9C27B0' }
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', description: 'Suitable for all ages', color: '#4CAF50' },
  { id: 'moderate', label: 'Moderate', description: 'Some physical activity required', color: '#FF9800' },
  { id: 'challenging', label: 'Challenging', description: 'Good fitness level required', color: '#F44336' },
  { id: 'extreme', label: 'Extreme', description: 'Excellent fitness required', color: '#9C27B0' }
];

const SUGGESTED_LOCATIONS = [
  'Islamabad, Pakistan', 'Lahore, Pakistan', 'Karachi, Pakistan', 'Murree, Pakistan',
  'Skardu, Pakistan', 'Hunza Valley, Pakistan', 'Swat, Pakistan', 'Naran Kaghan, Pakistan'
];

const SUGGESTED_TOUR_NAMES = [
  'Magnificent Hunza Valley Experience', 'Karakoram Highway Adventure', 'Ancient Lahore Walking Tour',
  'Skardu Mountain Expedition', 'Swat Valley Cultural Journey', 'Naran Kaghan Nature Trail',
  'Islamabad City Discovery', 'Northern Areas Trekking'
];

export function TourBasicsStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourBasicsStepProps) {
  const [formData, setFormData] = useState({
    name: data.name || '',
    description: data.description || '',
    category: data.category || '',
    location: data.location || '',
    duration: data.duration || '',
    groupSize: data.groupSize || '',
    difficulty: data.difficulty || '',
    highlights: data.highlights || []
  });

  const [showSuggestions, setShowSuggestions] = useState({
    name: false,
    location: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev[field] ? { ...prev, [field]: '' } : prev);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Tour name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.groupSize) newErrors.groupSize = 'Group size is required';
    if (!formData.difficulty) newErrors.difficulty = 'Difficulty level is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const addHighlight = (highlight: string) => {
    if (highlight && !formData.highlights.includes(highlight)) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlight]
      }));
    }
  };

  const removeHighlight = (highlight: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h !== highlight)
    }));
  };

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
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Basics</h2>
            <p className="text-green-100">Let's start with the essentials of your tour</p>
          </div>
        </div>
      </Card>

      {/* Tour Name */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tour Name *
        </label>
        <div className="relative">
          <Input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onFocus={() => setShowSuggestions(prev => ({ ...prev, name: true }))}
            onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, name: false })), 200)}
            placeholder="Enter your tour name"
            className={errors.name ? 'border-red-500' : ''}
          />
          
          <AnimatePresence>
            {showSuggestions.name && formData.name.length < 3 && (
              <motion.div
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-2">
                  <p className="text-xs text-gray-500 mb-2">Suggested names:</p>
                  {SUGGESTED_TOUR_NAMES.map((name, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                      onClick={() => handleInputChange('name', name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </Card>

      {/* Description */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tour Description *
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what makes your tour special..."
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </Card>

      {/* Category Selection */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tour Category *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TOUR_CATEGORIES.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => handleInputChange('category', category.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.category === category.id
                  ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <p className="text-sm font-medium text-gray-900">{category.label}</p>
            </motion.button>
          ))}
        </div>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </Card>

      {/* Location */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Tour Location *
        </label>
        <div className="relative">
          <Input
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            onFocus={() => setShowSuggestions(prev => ({ ...prev, location: true }))}
            onBlur={() => setTimeout(() => setShowSuggestions(prev => ({ ...prev, location: false })), 200)}
            placeholder="Enter tour location"
            className={errors.location ? 'border-red-500' : ''}
          />
          
          <AnimatePresence>
            {showSuggestions.location && (
              <motion.div
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-2">
                  <p className="text-xs text-gray-500 mb-2">Popular locations:</p>
                  {SUGGESTED_LOCATIONS
                    .filter(loc => loc.toLowerCase().includes(formData.location.toLowerCase()))
                    .slice(0, 5)
                    .map((location, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                      onClick={() => handleInputChange('location', location)}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </Card>

      {/* Duration & Group Size */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Duration *
          </label>
          <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
            <SelectTrigger className={errors.duration ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="half-day">Half Day (4-6 hours)</SelectItem>
              <SelectItem value="full-day">Full Day (8-10 hours)</SelectItem>
              <SelectItem value="2-days">2 Days</SelectItem>
              <SelectItem value="3-days">3 Days</SelectItem>
              <SelectItem value="4-days">4 Days</SelectItem>
              <SelectItem value="5-days">5 Days</SelectItem>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
        </Card>

        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Group Size *
          </label>
          <Select value={formData.groupSize} onValueChange={(value) => handleInputChange('groupSize', value)}>
            <SelectTrigger className={errors.groupSize ? 'border-red-500' : ''}>
              <SelectValue placeholder="Max group size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-4">1-4 people</SelectItem>
              <SelectItem value="5-8">5-8 people</SelectItem>
              <SelectItem value="9-15">9-15 people</SelectItem>
              <SelectItem value="16-25">16-25 people</SelectItem>
              <SelectItem value="26-50">26-50 people</SelectItem>
              <SelectItem value="50+">50+ people</SelectItem>
            </SelectContent>
          </Select>
          {errors.groupSize && <p className="text-red-500 text-sm mt-1">{errors.groupSize}</p>}
        </Card>
      </div>

      {/* Difficulty Level */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Star className="w-4 h-4 inline mr-1" />
          Difficulty Level *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTY_LEVELS.map((level) => (
            <motion.button
              key={level.id}
              onClick={() => handleInputChange('difficulty', level.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.difficulty === level.id
                  ? 'border-[#5FAD43] bg-[#5FAD43] bg-opacity-10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: level.color }}
                />
                <p className="font-medium text-gray-900">{level.label}</p>
              </div>
              <p className="text-xs text-gray-600">{level.description}</p>
            </motion.button>
          ))}
        </div>
        {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty}</p>}
      </Card>

      {/* Tour Highlights */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tour Highlights (Optional)
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.highlights.map((highlight, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-[#5FAD43] bg-opacity-10 text-[#5FAD43] hover:bg-[#5FAD43] hover:text-white cursor-pointer"
                onClick={() => removeHighlight(highlight)}
              >
                {highlight} ×
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Scenic Views', 'Local Cuisine', 'Cultural Sites', 'Adventure Activities', 'Photography', 'Wildlife Viewing'].map((highlight) => (
              <button
                key={highlight}
                onClick={() => addHighlight(highlight)}
                className="p-2 text-sm border border-gray-200 rounded-lg hover:border-[#5FAD43] hover:bg-[#5FAD43] hover:bg-opacity-10 transition-colors"
                disabled={formData.highlights.includes(highlight)}
              >
                + {highlight}
              </button>
            ))}
          </div>
        </div>
      </Card>

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
          onClick={handleNext}
          className="bg-tour-operator text-white px-6"
        >
          Next: Itinerary
        </Button>
      </div>
    </motion.div>
  );
}