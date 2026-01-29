import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface LocationData {
  address: string;
  city: string;
  area: string;
  country: string;
  coordinates: { lat: number; lng: number };
  placeId: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  onClose?: () => void;
  initialLocation?: LocationData;
  placeholder?: string;
}

export function LocationPicker({ 
  onLocationSelect, 
  onClose, 
  initialLocation,
  placeholder = "Search for your hotel location..." 
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [mapCenter, setMapCenter] = useState({ lat: 31.5204, lng: 74.3587 }); // Lahore default
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<HTMLDivElement>(null);

  // Mock location suggestions (in real app, this would come from Google Places API)
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);

  // Mock popular locations in Pakistan
  const popularLocations = [
    {
      address: "Mall Road, Lahore",
      city: "Lahore",
      area: "Mall Road",
      country: "Pakistan",
      coordinates: { lat: 31.5656, lng: 74.3242 },
      placeId: "mock_1"
    },
    {
      address: "Clifton Beach, Karachi",
      city: "Karachi", 
      area: "Clifton",
      country: "Pakistan",
      coordinates: { lat: 24.8607, lng: 67.0011 },
      placeId: "mock_2"
    },
    {
      address: "F-7 Markaz, Islamabad",
      city: "Islamabad",
      area: "F-7",
      country: "Pakistan", 
      coordinates: { lat: 33.7294, lng: 73.0931 },
      placeId: "mock_3"
    },
    {
      address: "Gulberg III, Lahore",
      city: "Lahore",
      area: "Gulberg",
      country: "Pakistan",
      coordinates: { lat: 31.5497, lng: 74.3436 },
      placeId: "mock_4"
    },
    {
      address: "DHA Phase 5, Karachi",
      city: "Karachi",
      area: "DHA",
      country: "Pakistan",
      coordinates: { lat: 24.8263, lng: 67.0610 },
      placeId: "mock_5"
    }
  ];

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock search results
    const filtered = popularLocations.filter(location =>
      location.address.toLowerCase().includes(query.toLowerCase()) ||
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.area.toLowerCase().includes(query.toLowerCase())
    );
    
    setSuggestions(filtered);
    setIsSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLocationClick = (location: LocationData) => {
    setSelectedLocation(location);
    setMapCenter(location.coordinates);
    setSearchQuery(location.address);
    setShowSuggestions(false);
    setMapZoom(15);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (mock calculation)
    const lat = mapCenter.lat + (rect.height / 2 - y) * 0.001;
    const lng = mapCenter.lng + (x - rect.width / 2) * 0.001;
    
    const mockLocation: LocationData = {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: "Selected Location",
      area: "Custom Pin",
      country: "Pakistan",
      coordinates: { lat, lng },
      placeId: `custom_${Date.now()}`
    };
    
    setSelectedLocation(mockLocation);
    setSearchQuery(mockLocation.address);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  const getCurrentLocation = () => {
    // Mock getting current location
    const mockCurrentLocation: LocationData = {
      address: "Your Current Location",
      city: "Lahore",
      area: "Current Area",
      country: "Pakistan",
      coordinates: { lat: 31.5204, lng: 74.3587 },
      placeId: "current_location"
    };
    
    handleLocationClick(mockCurrentLocation);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Where is your hotel located?</h1>
            <p className="text-sm text-gray-600">Pin the exact location on the map</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 rounded-xl"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={18} />
            )}
          </div>
          
          {/* Current Location Button */}
          <motion.button
            onClick={getCurrentLocation}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-[#ff5a5f] hover:bg-[#ff5a5f]/10 rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Navigation size={16} />
          </motion.button>
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-4 right-4 top-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
            >
              {suggestions.map((location, index) => (
                <motion.button
                  key={location.placeId}
                  onClick={() => handleLocationClick(location)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{location.address}</p>
                      <p className="text-sm text-gray-600">{location.city}, {location.country}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-gray-100">
        <div
          ref={mapRef}
          onClick={handleMapClick}
          className="w-full h-full relative cursor-crosshair"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        >
          {/* Mock Map Grid */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-gray-300"
                style={{ top: `${i * 5}%` }}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-gray-300"
                style={{ left: `${i * 5}%` }}
              />
            ))}
          </div>

          {/* Location Pin */}
          {selectedLocation && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full"
            >
              <div className="relative">
                {/* Pin Shadow */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm" />
                
                {/* Main Pin */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-8 h-8 bg-[#ff5a5f] rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                >
                  <MapPin size={16} className="text-white" />
                </motion.div>
                
                {/* Pin Stick */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-[#ff5a5f]" />
              </div>
            </motion.div>
          )}

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setMapZoom(prev => Math.min(20, prev + 1))}
              className="block w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200"
            >
              <span className="text-lg font-semibold text-gray-700">+</span>
            </button>
            <button
              onClick={() => setMapZoom(prev => Math.max(1, prev - 1))}
              className="block w-10 h-10 flex items-center justify-center hover:bg-gray-50"
            >
              <span className="text-lg font-semibold text-gray-700">−</span>
            </button>
          </div>

          {/* Current Location Button */}
          <button
            onClick={getCurrentLocation}
            className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Navigation size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Map Overlay Info */}
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-4 right-4"
          >
            <Card className="p-4 bg-white/95 backdrop-blur-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[#ff5a5f] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedLocation.address}</h3>
                  <p className="text-sm text-gray-600">{selectedLocation.city}, {selectedLocation.country}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex gap-3">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation}
            className="flex-1 bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white disabled:bg-gray-200 disabled:text-gray-500"
          >
            <Check size={16} className="mr-2" />
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}