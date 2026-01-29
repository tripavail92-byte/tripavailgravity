import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, ArrowRight, Map } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Card } from '../../../../components/ui/card';

interface LocationStepProps {
  data: any;
  onComplete: (data: any) => void;
}

export function LocationStep({ data, onComplete }: LocationStepProps) {
  const [formData, setFormData] = useState({
    coordinates: data.coordinates || null,
    hotelAddress: data.hotelAddress || '',
    useCurrentLocation: false,
  });

  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setFormData(prev => ({ 
            ...prev, 
            coordinates: coords,
            useCurrentLocation: true 
          }));
          setIsLocating(false);
          
          // Simulate reverse geocoding with a more realistic address
          const mockAddresses = [
            "123 Sunset Boulevard, Beverly Hills, CA 90210",
            "456 Ocean Drive, Miami Beach, FL 33139",
            "789 Mountain View Ave, Aspen, CO 81611",
            "321 City Center Plaza, New York, NY 10001"
          ];
          const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
          
          setFormData(prev => ({
            ...prev,
            hotelAddress: randomAddress
          }));
          
          // Show success toast
          console.log("Location detected successfully!");
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          
          // More user-friendly error handling
          let errorMessage = 'Unable to get your location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Please enter address manually.';
              break;
          }
          alert(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
      );
    } else {
      setIsLocating(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleOpenMaps = () => {
    if (formData.hotelAddress) {
      const encodedAddress = encodeURIComponent(formData.hotelAddress);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open('https://maps.google.com/', '_blank');
    }
  };

  const handleContinue = () => {
    onComplete({
      coordinates: formData.coordinates,
      hotelAddress: formData.hotelAddress,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center"
        >
          <MapPin className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Confirm Your Hotel Location
          </h2>
          <p className="text-gray-600">
            Help travelers find you easily
          </p>
        </div>
      </div>

      {/* Location Options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {/* Use Current Location */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Use My Current Location</h4>
                <p className="text-sm text-gray-600">Auto-detect via GPS</p>
              </div>
            </div>
            <Button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              variant="outline"
              size="sm"
            >
              {isLocating ? 'Locating...' : 'Use GPS'}
            </Button>
          </div>
        </Card>

        {/* Map View */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Map className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Open Maps</h4>
                <p className="text-sm text-gray-600">View on map with draggable pin</p>
              </div>
            </div>
            <Button
              onClick={handleOpenMaps}
              variant="outline"
              size="sm"
            >
              Open Maps
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Address Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <Label htmlFor="address">Hotel Address</Label>
        <Input
          id="address"
          type="text"
          placeholder="Enter or confirm your hotel address"
          value={formData.hotelAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, hotelAddress: e.target.value }))}
        />
        <p className="text-xs text-gray-500">
          You can edit this address after GPS detection
        </p>
      </motion.div>

      {/* Location Status */}
      {formData.coordinates && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 p-4 rounded-lg border border-green-200"
        >
          <div className="flex items-center gap-2 text-green-800">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Location confirmed!</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
          </p>
        </motion.div>
      )}

      {/* Important Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-amber-50 p-4 rounded-lg border border-amber-200"
      >
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Please ensure your location is correct — it will be shown to travelers in the app.
        </p>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Button
          onClick={handleContinue}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
          disabled={!formData.hotelAddress}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}