import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Edit3, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { LocationPicker } from '../../../components/maps/LocationPicker';

interface LocationData {
  address: string;
  city: string;
  area: string;
  country: string;
  coordinates: { lat: number; lng: number };
  placeId: string;
}

interface ModernLocationStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function ModernLocationStep({ onComplete, existingData, onUpdate }: ModernLocationStepProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    existingData?.locationData || null
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState({
    buildingName: existingData?.buildingName || '',
    floor: existingData?.floor || '',
    landmark: existingData?.landmark || '',
    instructions: existingData?.instructions || ''
  });

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    
    const updateData = {
      locationData: location,
      city: location.city,
      area: location.area,
      country: location.country,
      address: location.address,
      coordinates: location.coordinates,
      ...additionalDetails
    };
    
    if (onUpdate) {
      onUpdate(updateData);
    }
  };

  const handleDetailChange = (field: string, value: string) => {
    const newDetails = { ...additionalDetails, [field]: value };
    setAdditionalDetails(newDetails);
    
    if (selectedLocation && onUpdate) {
      onUpdate({
        locationData: selectedLocation,
        city: selectedLocation.city,
        area: selectedLocation.area,
        country: selectedLocation.country,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates,
        ...newDetails
      });
    }
  };

  const handleContinue = () => {
    if (selectedLocation) {
      onComplete({
        locationData: selectedLocation,
        city: selectedLocation.city,
        area: selectedLocation.area,
        country: selectedLocation.country,
        address: selectedLocation.address,
        coordinates: selectedLocation.coordinates,
        ...additionalDetails
      });
    }
  };

  const isValid = selectedLocation;

  return (
    <>
      <div className="space-y-6">
        {/* Location Selection Card */}
        <Card className="p-6 border-2 border-dashed border-gray-200 hover:border-[#ff5a5f]/50 transition-colors">
          {!selectedLocation ? (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 bg-[#ff5a5f]/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <MapPin className="w-8 h-8 text-[#ff5a5f]" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pin your hotel location</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Use our interactive map to mark the exact location of your property
              </p>
              <Button
                onClick={() => setShowLocationPicker(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
              >
                <MapPin className="mr-2" size={18} />
                Open Map
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Selected Location Display */}
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900">Location Selected</h4>
                  <p className="text-green-700 mb-2">{selectedLocation.address}</p>
                  <p className="text-sm text-green-600">
                    {selectedLocation.city}, {selectedLocation.country}
                  </p>
                  <div className="text-xs text-green-600 mt-1">
                    📍 {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
                  </div>
                </div>
                <Button
                  onClick={() => setShowLocationPicker(true)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Edit3 size={14} className="mr-1" />
                  Edit
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setShowLocationPicker(true)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MapPin className="w-5 h-5 text-[#ff5a5f] mb-2" />
                  <p className="text-sm font-medium text-gray-900">Adjust Pin</p>
                  <p className="text-xs text-gray-600">Fine-tune location</p>
                </motion.button>

                <motion.button
                  onClick={() => {
                    // Mock "get current location" - in real app would use geolocation
                    const mockCurrentLocation: LocationData = {
                      address: "Current Location, Lahore",
                      city: "Lahore",
                      area: "Current Area",
                      country: "Pakistan",
                      coordinates: { lat: 31.5204, lng: 74.3587 },
                      placeId: "current_location"
                    };
                    handleLocationSelect(mockCurrentLocation);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Navigation className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Use Current</p>
                  <p className="text-xs text-gray-600">Auto-detect location</p>
                </motion.button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Additional Location Details */}
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Additional Details (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Help guests find your property more easily
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Pearl Continental, Avari Tower"
                    value={additionalDetails.buildingName}
                    onChange={(e) => handleDetailChange('buildingName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor/Suite
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Ground Floor, Suite 101"
                    value={additionalDetails.floor}
                    onChange={(e) => handleDetailChange('floor', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nearby Landmark
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Near Liberty Market, Opposite Mall Road"
                    value={additionalDetails.landmark}
                    onChange={(e) => handleDetailChange('landmark', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Use main entrance, Ring bell at reception"
                    value={additionalDetails.instructions}
                    onChange={(e) => handleDetailChange('instructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Location Tips */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📍 Location Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Accurate location helps guests find you easily</li>
            <li>• Pin should mark your main entrance</li>
            <li>• Add building name if you're in a complex</li>
            <li>• Mention nearby landmarks for better navigation</li>
          </ul>
        </Card>
      </div>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            onClose={() => setShowLocationPicker(false)}
            initialLocation={selectedLocation}
            placeholder="Search for your hotel location..."
          />
        )}
      </AnimatePresence>
    </>
  );
}