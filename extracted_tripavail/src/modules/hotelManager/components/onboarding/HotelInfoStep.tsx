import { useState } from 'react';
import { motion } from 'motion/react';
import { Building, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

interface HotelInfoStepProps {
  data: any;
  onComplete: (data: any) => void;
}

export function HotelInfoStep({ data, onComplete }: HotelInfoStepProps) {
  const [formData, setFormData] = useState({
    hotelName: data.hotelName || '',
    hotelAddress: data.hotelAddress || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.hotelName.trim()) {
      newErrors.hotelName = 'Hotel name is required';
    }
    
    if (!formData.hotelAddress.trim()) {
      newErrors.hotelAddress = 'Hotel address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleAddressClick = () => {
    // Open Google Maps for address input
    if (formData.hotelAddress) {
      const encodedAddress = encodeURIComponent(formData.hotelAddress);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    } else {
      // Open maps for general search
      window.open('https://maps.google.com/', '_blank');
    }
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
          className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center"
        >
          <Building className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Hotel Information
          </h2>
          <p className="text-gray-600">
            Tell us about your property
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="hotelName">Hotel Name</Label>
          <Input
            id="hotelName"
            type="text"
            placeholder="Enter your hotel's official name"
            value={formData.hotelName}
            onChange={(e) => setFormData(prev => ({ ...prev, hotelName: e.target.value }))}
            className={errors.hotelName ? 'border-red-500' : ''}
          />
          {errors.hotelName && <p className="text-sm text-red-500">{errors.hotelName}</p>}
          <p className="text-xs text-gray-500">Example: Sunset View Resort</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAddress">Hotel Address</Label>
          <div className="relative">
            <Input
              id="hotelAddress"
              type="text"
              placeholder="Enter your hotel's full address"
              value={formData.hotelAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, hotelAddress: e.target.value }))}
              className={`pr-10 ${errors.hotelAddress ? 'border-red-500' : ''}`}
              onClick={handleAddressClick}
            />
            <button
              type="button"
              onClick={handleAddressClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          {errors.hotelAddress && <p className="text-sm text-red-500">{errors.hotelAddress}</p>}
          <p className="text-xs text-gray-500">Tap to open maps and get precise location</p>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 p-4 rounded-lg"
      >
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the exact name as it appears on your business license</li>
          <li>• Include complete address with postal code</li>
          <li>• This information will be visible to travelers</li>
        </ul>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}