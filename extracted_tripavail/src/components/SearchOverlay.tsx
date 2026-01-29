import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, MapPin, Calendar, Users, Star, Filter,
  TrendingUp, Clock, Mic, MicOff, DollarSign,
  Plane, Building, Utensils, History, Zap, Globe,
  ChevronDown, Camera, Sparkles
} from 'lucide-react';
import { 
  SimpleBeachIcon, 
  SimpleCityIcon, 
  SimpleAdventureIcon, 
  SimpleLuxuryIcon, 
  SimpleBudgetIcon, 
  SimpleRomanticIcon 
} from './icons/search-filters/SimpleQuickFilterIcons';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export function SearchOverlay({ isOpen, onClose, onSearch, initialFilters }: SearchOverlayProps) {
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters || {
      query: '',
      category: 'all',
      location: '',
      duration: '',
      priceRange: [0, 5000],
      minRating: 0,
      experienceType: []
    }
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Mock data (same as your original)
  const recentSearches = [
    { id: 1, query: "Paris Hotels", location: "Paris, France", icon: Building },
    { id: 2, query: "Beach Tours", location: "Maldives", icon: Globe },
    { id: 3, query: "City Break", location: "New York, USA", icon: Building }
  ];

  const trendingPackages = [
    { 
      id: 1, 
      name: "5-Star Beach Resort Package", 
      location: "Bali, Indonesia",
      popularity: 95, 
      type: "Hotel Package",
      packageType: "hotel",
      duration: "5 days, 4 nights",
      avgPrice: "$299/package",
      originalPrice: "$450",
      savings: "33% off"
    },
    { 
      id: 2, 
      name: "Cultural City Tour", 
      location: "Tokyo, Japan",
      popularity: 88, 
      type: "Tour Package",
      packageType: "tour",
      duration: "7 days guided tour",
      avgPrice: "$650/person",
      originalPrice: "$850",
      savings: "24% off"
    },
    { 
      id: 3, 
      name: "Romantic Sunset Package", 
      location: "Santorini, Greece",
      popularity: 92, 
      type: "Hotel + Tour Package",
      packageType: "combo",
      duration: "4 days, 3 nights",
      avgPrice: "$580/couple",
      originalPrice: "$750",
      savings: "23% off"
    },
    { 
      id: 4, 
      name: "Adventure Mountain Resort", 
      location: "Swiss Alps",
      popularity: 85, 
      type: "Hotel Package",
      packageType: "hotel",
      duration: "6 days, 5 nights",
      avgPrice: "$420/package",
      originalPrice: "$600",
      savings: "30% off"
    }
  ];

  const quickFilterChips = [
    { id: 'beach', label: 'Beach', icon: SimpleBeachIcon, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'city', label: 'City Break', icon: SimpleCityIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { id: 'adventure', label: 'Adventure', icon: SimpleAdventureIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { id: 'luxury', label: 'Luxury', icon: SimpleLuxuryIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: 'budget', label: 'Budget-Friendly', icon: SimpleBudgetIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { id: 'romantic', label: 'Romantic', icon: SimpleRomanticIcon, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' }
  ];

  const experienceTypes = [
    'Adventure Tours', 'Cultural Experiences', 'Food & Wine', 'Wildlife Safari',
    'Beach Activities', 'Mountain Hiking', 'City Tours', 'Art & Museums'
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
    if (filters.query.trim()) {
      // Add to recent searches logic here
    }
    
    onSearch?.(filters);
    onClose();
  };

  // Handle quick filter selection
  const handleQuickFilterClick = (filterId: string) => {
    setFilters(prev => ({
      ...prev,
      experienceType: prev.experienceType.includes(filterId)
        ? prev.experienceType.filter(type => type !== filterId)
        : [...prev.experienceType, filterId]
    }));
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: typeof recentSearches[0]) => {
    setFilters(prev => ({
      ...prev,
      query: search.query,
      location: search.location
    }));
    handleSearch();
  };

  // Handle trending package click
  const handleTrendingClick = (package_: typeof trendingPackages[0]) => {
    setFilters(prev => ({
      ...prev,
      query: package_.name,
      location: package_.location
    }));
    handleSearch();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-white dark:bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Full Screen Search Container */}
          <div className="h-full flex flex-col">
            {/* Header with Close Button */}
            <div className="sticky top-0 bg-white/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-100 dark:border-border z-[110] px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={onClose}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <X className="w-5 h-5 text-gray-700 dark:text-foreground" />
                  </motion.button>
                  <h1 className="text-2xl font-bold text-foreground">Search TripAvail</h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecentSearches(!showRecentSearches)}
                  className="text-primary"
                >
                  <History className="w-4 h-4 mr-1" />
                  Recent
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6 max-w-md mx-auto">
                {/* Main Search Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search destinations, hotels, or experiences..."
                      value={filters.query}
                      onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-lg placeholder:text-gray-500 shadow-sm"
                      autoFocus
                    />
                    
                    {/* Voice Search Button */}
                    <motion.button
                      onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileTap={{ scale: 0.95 }}
                      animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </motion.button>
                  </div>

                  {/* Voice Search Status */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <Mic className="w-5 h-5" />
                          </motion.div>
                          <span className="font-medium">Listening... Speak now</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recent Searches */}
                <AnimatePresence>
                  {showRecentSearches && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Searches
                      </h4>
                      <div className="space-y-3">
                        {recentSearches.map((search) => {
                          const IconComponent = search.icon;
                          return (
                            <motion.button
                              key={search.id}
                              onClick={() => handleRecentSearchClick(search)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-left shadow-sm border border-gray-100 dark:border-gray-800"
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{search.query}</p>
                                <p className="text-gray-500 dark:text-gray-400">{search.location}</p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Filter Chips */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Quick Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickFilters(!showQuickFilters)}
                      className="text-primary"
                    >
                      {showQuickFilters ? 'Less' : 'More'}
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showQuickFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {quickFilterChips.slice(0, showQuickFilters ? undefined : 6).map((chip) => {
                      const IconComponent = chip.icon;
                      const isSelected = filters.experienceType.includes(chip.id);
                      return (
                        <motion.button
                          key={chip.id}
                          onClick={() => handleQuickFilterClick(chip.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary text-white shadow-sm' 
                              : `${chip.color} hover:opacity-80`
                          }`}
                          whileTap={{ scale: 0.98 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <IconComponent isActive={isSelected} className="w-5 h-5" />
                          {chip.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Trending Packages */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trending Packages
                  </h4>
                  <div className="grid gap-4">
                    {trendingPackages.map((package_) => {
                      // Get icon based on package type
                      const getPackageIcon = (type: string) => {
                        switch (type) {
                          case 'hotel': return Building;
                          case 'tour': return Camera;
                          case 'combo': return Sparkles;
                          default: return Globe;
                        }
                      };
                      
                      const IconComponent = getPackageIcon(package_.packageType);
                      
                      return (
                        <motion.button
                          key={package_.id}
                          onClick={() => handleTrendingClick(package_)}
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left shadow-sm border border-gray-100 dark:border-gray-700"
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            package_.packageType === 'hotel' 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : package_.packageType === 'tour'
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}>
                            <IconComponent className={`w-7 h-7 ${
                              package_.packageType === 'hotel' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : package_.packageType === 'tour'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-purple-600 dark:text-purple-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-foreground truncate">{package_.name}</h5>
                                <p className="text-gray-500 dark:text-gray-400">{package_.location}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{package_.duration}</p>
                              </div>
                              <div className="text-right ml-3">
                                <p className="font-bold text-primary">{package_.avgPrice}</p>
                                <p className="text-sm text-gray-400 line-through">{package_.originalPrice}</p>
                                <Badge variant="secondary" className="text-xs mt-1">{package_.savings}</Badge>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Filters Toggle */}
                <div className="border-t border-gray-200 dark:border-border pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full justify-between h-12"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <Filter className="w-5 h-5" />
                      Advanced Filters
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-6"
                    >
                      {/* Location Filter */}
                      <div className="space-y-3">
                        <label className="font-semibold text-foreground flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Location
                        </label>
                        <Input
                          placeholder="Specific location or region"
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          className="bg-gray-50 dark:bg-gray-800 h-12 rounded-xl"
                        />
                      </div>

                      {/* Duration Filter */}
                      <div className="space-y-3">
                        <label className="font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Duration
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {['1-3 days', '1 week', '2 weeks', 'Month+'].map((duration) => (
                            <Button
                              key={duration}
                              variant={filters.duration === duration ? 'default' : 'outline'}
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                duration: prev.duration === duration ? '' : duration 
                              }))}
                              className="justify-center h-12 rounded-xl"
                            >
                              {duration}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-4">
                        <label className="font-semibold text-foreground flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        </label>
                        <div className="px-2">
                          <Slider
                            value={filters.priceRange}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                            max={5000}
                            min={0}
                            step={50}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Minimum Rating */}
                      <div className="space-y-3">
                        <label className="font-semibold text-foreground flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          Minimum Rating
                        </label>
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant={filters.minRating >= rating ? 'default' : 'outline'}
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                minRating: prev.minRating === rating ? 0 : rating 
                              }))}
                              className="w-12 h-12 p-0 rounded-xl"
                            >
                              {rating}★
                            </Button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Buttons */}
                <div className="sticky bottom-0 bg-white/95 dark:bg-background/95 backdrop-blur-xl border-t border-gray-100 dark:border-border pt-6 pb-8 z-[110]">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({
                          query: '',
                          category: 'all',
                          location: '',
                          duration: '',
                          priceRange: [0, 5000],
                          minRating: 0,
                          experienceType: []
                        });
                      }}
                      className="flex-1 h-12 text-base rounded-xl"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleSearch}
                      className="flex-2 h-12 bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 text-base rounded-xl shadow-lg"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}