import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Search, X, MapPin, Calendar, Star, Filter,
  Clock, Mic, MicOff, DollarSign,
  Building, History, ChevronDown, Globe
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { SearchFilters } from './TripAvailSearchBar'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
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
  )

  const [showFilters, setShowFilters] = useState(false)
  const [showQuickFilters, setShowQuickFilters] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Mock data
  const recentSearches = [
    { id: 1, query: "Paris Hotels", location: "Paris, France", icon: Building },
    { id: 2, query: "Beach Tours", location: "Maldives", icon: Globe },
    { id: 3, query: "City Break", location: "New York, USA", icon: Building }
  ]

  const quickFilterChips = [
    { id: 'beach', label: 'Beach' },
    { id: 'city', label: 'City Break' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'budget', label: 'Budget-Friendly' },
    { id: 'romantic', label: 'Romantic' }
  ]

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setFilters(prev => ({ ...prev, query: transcript }))
        setIsListening(false)
      }
      
      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current.start()
    } else {
      alert('Voice search is not supported in your browser')
    }
  }

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // Handle search
  const handleSearch = () => {
    if (filters.query.trim()) {
      // Save to localStorage
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      recent.unshift({
        query: filters.query,
        location: filters.location,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('recentSearches', JSON.stringify(recent.slice(0, 10)))
    }
    
    onSearch?.(filters)
    onClose()
  }

  // Handle quick filter selection
  const handleQuickFilterClick = (filterId: string) => {
    setFilters(prev => ({
      ...prev,
      experienceType: prev.experienceType.includes(filterId)
        ? prev.experienceType.filter(type => type !== filterId)
        : [...prev.experienceType, filterId]
    }))
  }

  // Handle recent search click
  const handleRecentSearchClick = (search: typeof recentSearches[0]) => {
    setFilters(prev => ({
      ...prev,
      query: search.query,
      location: search.location
    }))
    handleSearch()
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Blurred Backdrop */}
          <div
            className="absolute inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-md"
            onMouseDown={onClose}
          />

          {/* Glass Modal */}
          <motion.div
            className="relative w-full max-w-2xl lg:max-w-3xl max-h-[90vh] md:max-h-[85vh] rounded-2xl overflow-hidden shadow-xl flex flex-col bg-white/45 dark:bg-background/25 backdrop-blur-2xl backdrop-saturate-150 border border-white/25 dark:border-white/10"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />
            {/* Header */}
            <div className="relative px-4 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <motion.button
                    onClick={onClose}
                    className="w-10 h-10 glass-chip rounded-full flex items-center justify-center transition-colors"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </motion.button>
                  <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Search TripAvail</h1>
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

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-4 md:p-6 space-y-6 md:space-y-8 overflow-x-hidden">
                {/* Main Search Input - Glass Effect */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search destinations, hotels, or experiences..."
                      value={filters.query}
                      onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 pr-12 py-4 glass-search rounded-xl text-base md:text-lg text-foreground placeholder:text-muted-foreground shadow-sm border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                    />
                    
                    {/* Voice Search Button */}
                    <motion.button
                      onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                          : 'glass-chip hover:active'
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

                <div className="space-y-6">
                  <div className="space-y-6 min-w-0">
                    {/* Recent Searches */}
                    <AnimatePresence>
                      {showRecentSearches && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 glass-suggestion rounded-2xl p-4"
                        >
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Recent Searches
                          </h4>
                          <div className="space-y-3">
                            {recentSearches.map((search) => {
                              const IconComponent = search.icon
                              return (
                                <motion.button
                                  key={search.id}
                                  onClick={() => handleRecentSearchClick(search)}
                                  className="w-full min-w-0 flex items-center gap-4 p-4 glass-chip hover:active rounded-xl transition-colors text-left"
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="w-12 h-12 glass-chip rounded-xl flex items-center justify-center">
                                    <IconComponent className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">{search.query}</p>
                                    <p className="text-muted-foreground truncate">{search.location}</p>
                                  </div>
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick Filter Chips */}
                    <div className="space-y-4 glass-suggestion rounded-2xl p-4">
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
                          const isSelected = filters.experienceType.includes(chip.id)
                          return (
                            <motion.button
                              key={chip.id}
                              onClick={() => handleQuickFilterClick(chip.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 glass-chip hover:active ${
                                isSelected
                                  ? 'active bg-primary/15 text-primary border-primary/30 dark:bg-primary/20'
                                  : 'text-foreground'
                              }`}
                              whileTap={{ scale: 0.98 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              {chip.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Toggle */}
                <div className="border-t border-gray-200 dark:border-border pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full justify-between h-12 glass-chip hover:active"
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
                          className="glass-chip h-12 rounded-xl"
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
                              className="justify-center h-12 rounded-xl glass-chip hover:active"
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
                              className="w-12 h-12 p-0 rounded-xl glass-chip hover:active"
                            >
                              {rating}★
                            </Button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Footer */}
            <div className="relative px-4 py-4 border-t border-white/20">
              <div className="flex gap-4 max-w-md mx-auto">
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
                      experienceType: [],
                    })
                  }}
                  className="flex-1 h-12 text-base rounded-xl glass-chip"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleSearch}
                  className="flex-1 h-12 font-semibold flex items-center gap-2 text-base rounded-xl"
                >
                  <Search className="w-5 h-5" />
                  Search
                </Button>
              </div>
            </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
