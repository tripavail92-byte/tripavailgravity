import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, MapPin, Calendar, DollarSign, 
  Users, Star, SlidersHorizontal, X
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';

interface FilterOptions {
  searchQuery: string;
  location: string;
  priceRange: [number, number];
  duration: string;
  rating: number;
  packageType: string;
  sortBy: string;
}

interface PackageSearchFilterProps {
  onFiltersChange: (filters: FilterOptions) => void;
  packageCount: number;
}

export function PackageSearchFilter({ onFiltersChange, packageCount }: PackageSearchFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    location: '',
    priceRange: [0, 2000],
    duration: '',
    rating: 0,
    packageType: '',
    sortBy: 'popularity'
  });

  const packageTypes = [
    'All Types',
    'Romantic',
    'Adventure', 
    'Business',
    'Wellness',
    'Luxury',
    'Family',
    'Beach',
    'Mountain',
    'City'
  ];

  const locations = [
    'All Locations',
    'Bali, Indonesia',
    'Swiss Alps, Switzerland',
    'New York, USA',
    'Tuscany, Italy',
    'Santorini, Greece',
    'Dubai, UAE',
    'Paris, France',
    'Tokyo, Japan',
    'Maldives',
    'Iceland'
  ];

  const durations = [
    'Any Duration',
    '1-2 Days',
    '3-4 Days',
    '5-7 Days',
    '1-2 Weeks',
    '2+ Weeks'
  ];

  const sortOptions = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'savings', label: 'Best Savings' }
  ];

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      searchQuery: '',
      location: '',
      priceRange: [0, 2000],
      duration: '',
      rating: 0,
      packageType: '',
      sortBy: 'popularity'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.location && filters.location !== 'All Locations') count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) count++;
    if (filters.duration && filters.duration !== 'Any Duration') count++;
    if (filters.rating > 0) count++;
    if (filters.packageType && filters.packageType !== 'All Types') count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search destinations, hotels, or experiences..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-[#E11D48] transition-colors"
        />
        {filters.searchQuery && (
          <button
            onClick={() => updateFilters({ searchQuery: '' })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Filter Toggle */}
          <motion.button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
              isFilterOpen 
                ? 'bg-[#E11D48] text-white border-[#E11D48]' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#E11D48]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </Badge>
            )}
          </motion.button>

          {/* Quick Type Filters */}
          {packageTypes.slice(0, 6).map((type, index) => (
            <motion.button
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={() => updateFilters({ packageType: type })}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ${
                filters.packageType === type || (type === 'All Types' && !filters.packageType)
                  ? 'bg-[#E11D48] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {type}
            </motion.button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between text-sm text-gray-600"
      >
        <span>{packageCount} packages found</span>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-[#E11D48] hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </motion.div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="p-6 space-y-6 bg-gray-50 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <Select value={filters.location} onValueChange={(value) => updateFilters({ location: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Duration
                  </label>
                  <Select value={filters.duration} onValueChange={(value) => updateFilters({ duration: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Price Range
                  </label>
                  <div className="px-3">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                      max={2000}
                      min={0}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}+</span>
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Minimum Rating
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5, 5].map((rating) => (
                      <motion.button
                        key={rating}
                        onClick={() => updateFilters({ rating })}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          filters.rating === rating
                            ? 'bg-[#E11D48] text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-[#E11D48]'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                        {rating > 0 && <Star className="w-3 h-3 ml-1 inline fill-current" />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Filters Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="bg-[#E11D48] hover:bg-[#BE185D] text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}