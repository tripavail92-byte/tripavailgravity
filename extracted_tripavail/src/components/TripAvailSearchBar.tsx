import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar, DollarSign, Star, Filter, 
  X, ChevronDown, Users, Clock, Sparkles,
  Plane, Building, Utensils, Mic, MicOff, TrendingUp,
  History, Zap, Globe, Mountain, Heart, Camera
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Slider } from './ui/slider';


interface SearchFilters {
  query: string;
  category: string;
  location: string;
  duration: string;
  priceRange: [number, number];
  minRating: number;
  experienceType: string[];
}

interface TripAvailSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  className?: string;
  onSearchOverlayToggle?: (isOpen: boolean, filters?: SearchFilters) => void;
}

export function TripAvailSearchBar({ onSearch, className = '', onSearchOverlayToggle }: TripAvailSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    location: '',
    duration: '',
    priceRange: [0, 5000],
    minRating: 0,
    experienceType: []
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);



  // Recent searches (from localStorage or mock data)
  const recentSearches = [
    { query: 'Bali beach resorts', category: 'hotels', timestamp: '2 hours ago' },
    { query: 'Paris city tour', category: 'tours', timestamp: '1 day ago' },
    { query: 'Tokyo food experience', category: 'experiences', timestamp: '3 days ago' },
    { query: 'Dubai luxury hotels', category: 'hotels', timestamp: '5 days ago' }
  ];

  // Trending destinations with popularity indicators
  const trendingDestinations = [
    { name: 'Bali, Indonesia', trend: '+25%', bookings: '2.3k', icon: '🏝️', popularity: 95 },
    { name: 'Paris, France', trend: '+18%', bookings: '1.8k', icon: '🗼', popularity: 88 },
    { name: 'Tokyo, Japan', trend: '+32%', bookings: '1.5k', icon: '🗾', popularity: 92 },
    { name: 'Dubai, UAE', trend: '+15%', bookings: '1.2k', icon: '🏙️', popularity: 85 },
    { name: 'Santorini, Greece', trend: '+28%', bookings: '980', icon: '🇬🇷', popularity: 90 },
    { name: 'Maldives', trend: '+22%', bookings: '750', icon: '🏖️', popularity: 87 }
  ];

  // Smart suggestions based on user behavior (mock data)
  const smartSuggestions = [
    { query: 'Beach resorts under $200', reason: 'Based on your budget preference' },
    { query: 'Weekend getaways near you', reason: 'Perfect for short trips' },
    { query: 'Romantic destinations', reason: 'Popular with similar travelers' },
    { query: 'Adventure tours', reason: 'Matches your interests' }
  ];

  // Quick filter chips
  const quickFilters = [
    { id: 'budget', label: 'Budget Friendly', icon: DollarSign, color: 'bg-green-500' },
    { id: 'weekend', label: 'Weekend Trips', icon: Calendar, color: 'bg-blue-500' },
    { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'bg-orange-500' },
    { id: 'luxury', label: 'Luxury', icon: Star, color: 'bg-purple-500' },
    { id: 'family', label: 'Family Friendly', icon: Users, color: 'bg-pink-500' },
    { id: 'romantic', label: 'Romantic', icon: Heart, color: 'bg-red-500' }
  ];

  // Duration options
  const durationOptions = [
    { value: '', label: 'Any Duration' },
    { value: '1-3', label: '1-3 Days' },
    { value: '4-7', label: '4-7 Days' },
    { value: '8-14', label: '1-2 Weeks' },
    { value: '15+', label: '2+ Weeks' }
  ];

  // Experience types
  const experienceTypes = [
    { id: 'beach', label: 'Beach', icon: '🏖️' },
    { id: 'city', label: 'City Break', icon: '🏙️' },
    { id: 'nature', label: 'Nature', icon: '🌿' },
    { id: 'food', label: 'Food & Wine', icon: '🍷' },
    { id: 'wellness', label: 'Wellness', icon: '🧘' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' }
  ];

  // Rating options
  const ratingOptions = [
    { value: 0, label: 'Any Rating' },
    { value: 3, label: '3+ Stars' },
    { value: 4, label: '4+ Stars' },
    { value: 4.5, label: '4.5+ Stars' },
    { value: 5, label: '5 Stars Only' }
  ];

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFilters(prev => ({ ...prev, query: transcript }));
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.start();
    } else {
      // Fallback for browsers that don't support speech recognition
      alert('Voice search is not supported in your browser');
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };



  // Handle search
  const handleSearch = () => {
    // Save to recent searches (in real app, this would go to localStorage)
    if (filters.query.trim()) {
      // Add to recent searches logic here
    }
    
    onSearch(filters);
    setIsExpanded(false);
    setShowFilters(false);
    setShowRecentSearches(false);
  };

  // Handle quick filter click
  const handleQuickFilterClick = (filterId: string) => {
    let updatedFilters = { ...filters };
    
    switch (filterId) {
      case 'budget':
        updatedFilters.priceRange = [0, 100];
        break;
      case 'weekend':
        updatedFilters.duration = '1-3';
        break;
      case 'adventure':
        updatedFilters.experienceType = ['nature'];
        break;
      case 'luxury':
        updatedFilters.priceRange = [500, 5000];
        updatedFilters.minRating = 4.5;
        break;
      case 'family':
        updatedFilters.experienceType = ['family'];
        break;
      case 'romantic':
        updatedFilters.experienceType = ['wellness'];
        break;
    }
    
    setFilters(updatedFilters);
    onSearch(updatedFilters);
  };



  // Handle experience type toggle
  const handleExperienceTypeToggle = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      experienceType: prev.experienceType.includes(typeId)
        ? prev.experienceType.filter(id => id !== typeId)
        : [...prev.experienceType, typeId]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      location: '',
      duration: '',
      priceRange: [0, 5000],
      minRating: 0,
      experienceType: []
    });
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'query' || key === 'category') return count;
    if (key === 'priceRange' && (value[0] !== 0 || value[1] !== 5000)) return count + 1;
    if (key === 'experienceType' && value.length > 0) return count + 1;
    if (value && value !== 0 && value !== '') return count + 1;
    return count;
  }, 0);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowFilters(false);
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-show recent searches when input is focused and empty
  useEffect(() => {
    if (isExpanded && !filters.query.trim()) {
      setShowRecentSearches(true);
    } else {
      setShowRecentSearches(false);
    }
  }, [isExpanded, filters.query]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main Search Bar */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Search Input */}
        <div className="relative bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50 dark:border-border/50">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search destinations, hotels, or experiences..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onFocus={() => {
                setIsExpanded(true);
                onSearchOverlayToggle?.(true, filters);
              }}
              className="border-0 bg-transparent text-gray-900 dark:text-foreground placeholder:text-gray-500 focus:ring-0 p-0"
            />
            <div className="flex items-center gap-2">
              {/* Voice Search Button */}
              <motion.button
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-primary text-white' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                whileTap={{ scale: 0.95 }}
                title={isListening ? 'Stop voice search' : 'Start voice search'}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <MicOff className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </motion.button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`relative ${activeFiltersCount > 0 ? 'text-primary' : 'text-gray-500'}`}
              >
                <Filter className="w-4 h-4" />
                {activeFiltersCount > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    {activeFiltersCount}
                  </motion.div>
                )}
              </Button>
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters Chips */}
        <AnimatePresence>
          {(isExpanded || showQuickFilters) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick filters:</span>
                {quickFilters.map((filter) => (
                  <motion.button
                    key={filter.id}
                    onClick={() => handleQuickFilterClick(filter.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-2 h-2 rounded-full ${filter.color}`} />
                    <filter.icon className="w-3 h-3" />
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>



      {/* Recent Searches Dropdown */}
      <AnimatePresence>
        {showRecentSearches && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="p-4 shadow-xl border-0 bg-white dark:bg-card">
              <div className="space-y-4">
                {/* Recent Searches */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Searches</h4>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 4).map((search, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, query: search.query }));
                          setIsExpanded(false);
                        }}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{search.query}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {search.category}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{search.timestamp}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Smart Suggestions */}
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Smart Suggestions</h4>
                  </div>
                  <div className="space-y-1">
                    {smartSuggestions.slice(0, 3).map((suggestion, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, query: suggestion.query }));
                          setIsExpanded(false);
                        }}
                        className="w-full flex items-start gap-3 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion.query}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.reason}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Destinations & Search Results */}
      <AnimatePresence>
        {isExpanded && filters.query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="p-4 shadow-xl border-0 bg-white dark:bg-card">
              <div className="space-y-4">
                {/* Trending Destinations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trending Destinations</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {trendingDestinations
                      .filter(dest => dest.name.toLowerCase().includes(filters.query.toLowerCase()))
                      .slice(0, 4)
                      .map((destination) => (
                        <motion.button
                          key={destination.name}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, query: destination.name }));
                            setIsExpanded(false);
                          }}
                          className="flex items-center justify-between p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{destination.icon}</span>
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {destination.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0"
                                >
                                  {destination.trend}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {destination.bookings} bookings
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-primary">Hot</span>
                          </div>
                        </motion.button>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="p-6 shadow-xl border-0 bg-white dark:bg-card">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Filters</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-gray-500 hover:text-primary"
                      >
                        Clear all
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Location Filter */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <Input
                        placeholder="Any location"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>

                    {/* Duration Filter */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        Duration
                      </label>
                      <select
                        value={filters.duration}
                        onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-foreground"
                      >
                        {durationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        Price Range
                      </label>
                      <div className="px-3">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                          max={5000}
                          min={0}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <span>${filters.priceRange[0]}</span>
                          <span>${filters.priceRange[1]}+</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Star className="w-4 h-4" />
                        Minimum Rating
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ratingOptions.map((option) => (
                          <Button
                            key={option.value}
                            variant={filters.minRating === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, minRating: option.value }))}
                            className={filters.minRating === option.value ? "bg-primary hover:bg-primary/90" : ""}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Experience Types */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Sparkles className="w-4 h-4" />
                        Experience Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {experienceTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={filters.experienceType.includes(type.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleExperienceTypeToggle(type.id)}
                            className={`${
                              filters.experienceType.includes(type.id) 
                                ? "bg-primary hover:bg-primary/90" 
                                : ""
                            }`}
                          >
                            <span className="mr-1">{type.icon}</span>
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Filters Button */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                    </span>
                    <Button
                      onClick={handleSearch}
                      className="bg-primary hover:bg-primary/90 text-white px-8"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>


      </motion.div>
    </div>
  );
}