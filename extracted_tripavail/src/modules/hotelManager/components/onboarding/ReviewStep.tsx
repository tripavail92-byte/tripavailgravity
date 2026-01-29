import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Edit3, Hotel, MapPin, Star, Users, DollarSign } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Badge } from '../../../../components/ui/badge';
import { AmenityIcon } from '../AmenityIcon';

interface ReviewStepProps {
  data: any;
  onComplete: (data: any) => void;
  onSubmit: () => void;
}

export function ReviewStep({ data, onComplete, onSubmit }: ReviewStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = () => {
    if (isConfirmed) {
      onSubmit();
    }
  };

  const totalAmenities = data.selectedAmenities?.length || 0;
  const totalRooms = data.rooms?.length || 0;
  const averagePrice = data.rooms?.reduce((sum: number, room: any) => sum + room.basePrice, 0) / totalRooms || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Final Review & Confirmation
          </h2>
          <p className="text-gray-600">
            Review your information before submitting
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-lg font-semibold text-gray-900">{totalAmenities}</p>
          <p className="text-sm text-gray-600">Amenities</p>
        </Card>
        <Card className="p-4 text-center">
          <Hotel className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-lg font-semibold text-gray-900">{totalRooms}</p>
          <p className="text-sm text-gray-600">Room Types</p>
        </Card>
      </div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Full Name:</span>
              <span className="font-medium">{data.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{data.phone}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Hotel Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Hotel Information</h3>
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Hotel className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <span className="font-medium">{data.hotelName}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <span className="text-gray-700">{data.hotelAddress}</span>
                {data.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    Location confirmed via GPS
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Policies */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Policies</h3>
            <Button variant="ghost" size="sm">
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Check-in</p>
              <p className="font-medium">{data.checkIn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-out</p>
              <p className="font-medium">{data.checkOut}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Children</p>
              <p className="font-medium">{data.childrenPolicy ? 'Allowed' : 'Not allowed'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pets</p>
              <p className="font-medium">{data.petPolicy ? 'Allowed' : 'Not allowed'}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Selected Amenities */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Selected Amenities</h3>
            <Badge variant="secondary">{totalAmenities} amenities</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.selectedAmenities?.slice(0, 9).map((amenityId: string) => (
              <div key={amenityId} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                  <AmenityIcon name="star" className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700 truncate">{amenityId}</span>
              </div>
            ))}
            {totalAmenities > 9 && (
              <div className="text-sm text-gray-500">
                +{totalAmenities - 9} more
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Room Types Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Room Types</h3>
            <Badge variant="secondary">{totalRooms} room types</Badge>
          </div>
          <div className="space-y-3">
            {data.rooms?.map((room: any, index: number) => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Hotel className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.maxOccupancy}
                      </span>
                      <span>{room.bedType}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {room.basePrice}
                  </p>
                  <p className="text-xs text-gray-500">per night</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Confirmation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={setIsConfirmed}
              className="mt-1"
            />
            <div>
              <label htmlFor="confirm" className="text-sm font-medium text-green-900 cursor-pointer">
                I confirm that all information and documents are correct and ready for submission.
              </label>
              <p className="text-xs text-green-700 mt-1">
                Your listing will be reviewed by our team within 24-48 hours.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="sticky bottom-4 pt-4"
      >
        <Button
          onClick={handleSubmit}
          disabled={!isConfirmed}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Submit for Review
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}