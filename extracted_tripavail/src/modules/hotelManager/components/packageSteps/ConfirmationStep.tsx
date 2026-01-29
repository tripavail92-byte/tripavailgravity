import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, Eye, Edit, Share2, Calendar, DollarSign, 
  Star, Gift, AlertTriangle, Camera, Shield, Sparkles
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Switch } from '../../../../components/ui/switch';
import { ImageWithFallback } from '../../../../components/figma/ImageWithFallback';
import type { PackageData } from '../PackageListingFlow';

interface ConfirmationStepProps {
  onComplete: (data: { published: boolean; draft: boolean }) => void;
  onUpdate: (data: any) => void;
  existingData?: PackageData;
}

export function ConfirmationStep({ onComplete, onUpdate, existingData }: ConfirmationStepProps) {
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [saveDraft, setSaveDraft] = useState(false);

  // Package type display names
  const packageTypeNames: { [key: string]: string } = {
    weekend: 'Weekend Getaway',
    romantic: 'Romantic Escape',
    family: 'Family Adventure',
    business: 'Business Elite',
    adventure: 'Adventure Package',
    culinary: 'Culinary Journey',
    wellness: 'Wellness Retreat',
    luxury: 'Luxury Experience'
  };

  // Policy display names
  const policyNames: { [key: string]: string } = {
    flexible: 'Flexible (24h free cancellation)',
    moderate: 'Moderate (5 days free cancellation)',
    strict: 'Strict (14 days free cancellation)',
    non_refundable: 'Non-Refundable'
  };

  const handlePublish = () => {
    onComplete({ published: publishImmediately, draft: saveDraft });
  };

  const getCompletionScore = () => {
    let score = 0;
    let maxScore = 10;

    if (existingData?.packageType) score++;
    if (existingData?.smallDescription) score++;
    if (existingData?.title && existingData?.fullDescription && existingData?.hotelName) score++;
    if (existingData?.freeInclusions && existingData.freeInclusions.length >= 3) score++;
    if (existingData?.availability) score++;
    if ((existingData?.freeInclusions && existingData.freeInclusions.length > 0) || 
        (existingData?.discountOffers && existingData.discountOffers.length > 0)) score++;
    if (existingData?.basePrice && existingData?.totalPrice) score++;
    if (existingData?.media?.coverPhoto) score++;
    if (existingData?.policies?.cancellationPolicy) score++;
    if (existingData?.exclusions || existingData?.policies?.customPolicies) score++;

    return Math.round((score / maxScore) * 100);
  };

  const completionScore = getCompletionScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-20 h-20 bg-gradient-to-br from-[#5FAD43] to-[#4A9C39] rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Ready!</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Review your package details and publish to start receiving bookings.
        </p>
      </motion.div>

      {/* Completion Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#5FAD43] mb-2">
              {completionScore}%
            </div>
            <div className="text-sm text-gray-600 mb-4">Package Completion Score</div>
            <div className="w-full bg-green-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-[#5FAD43] to-[#4A9C39] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <p className="text-xs text-green-700 mt-2">
              {completionScore >= 90 ? 'Excellent! Your package is ready to attract guests.' :
               completionScore >= 70 ? 'Good! Consider adding more details for better visibility.' :
               'Add more information to improve your package appeal.'}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Package Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-900">Package Preview</h3>
            <Badge variant="secondary" className="bg-[#5FAD43] text-white">
              {packageTypeNames[existingData?.packageType || 'weekend']}
            </Badge>
          </div>

          {/* Package Header */}
          <div className="space-y-4">
            {existingData?.media?.coverPhoto && (
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={existingData.media.coverPhoto}
                  alt="Package cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                {existingData?.title || 'Package Title'}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {existingData?.hotelName || 'Hotel Name'}
              </p>
              <p className="text-gray-700">
                {existingData?.smallDescription || 'Package description'}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#5FAD43]">
                    ${existingData?.totalPrice?.toFixed(0) || '199'}
                  </span>
                  <span className="text-sm text-gray-600">per night</span>
                  {existingData?.basePrice && existingData?.totalPrice && 
                   existingData.basePrice > existingData.totalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${existingData.basePrice.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {existingData?.availability?.minStay}-{existingData?.availability?.maxStay} night minimum
                </div>
              </div>
              <Button size="sm" className="bg-[#5FAD43] hover:bg-[#4A9C39]">
                Book Now
              </Button>
            </div>

            {/* Highlights */}
            {existingData?.highlights && existingData.highlights.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Package Highlights</h5>
                <div className="grid grid-cols-1 gap-1">
                  {existingData.highlights.slice(0, 4).map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#5FAD43]" />
                      <span className="text-sm text-gray-700">{highlight}</span>
                    </div>
                  ))}
                  {existingData.highlights.length > 4 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{existingData.highlights.length - 4} more highlights
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Package Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Package Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-[#5FAD43] mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Free Inclusions</h4>
                  <p className="text-sm text-gray-600">
                    {existingData?.freeInclusions?.length || 0} items included
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Discount Offers</h4>
                  <p className="text-sm text-gray-600">
                    {existingData?.discountOffers?.length || 0} special offers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Availability</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {existingData?.availability?.type?.replace('-', ' ') || 'Year-round'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Media</h4>
                  <p className="text-sm text-gray-600">
                    {existingData?.media?.coverPhoto ? '1 cover photo' : 'No photos'} + 
                    {existingData?.media?.supportingPhotos?.length || 0} supporting
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Policies</h4>
                  <p className="text-sm text-gray-600">
                    {policyNames[existingData?.policies?.cancellationPolicy || 'flexible']}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Pricing</h4>
                  <p className="text-sm text-gray-600">
                    ${existingData?.totalPrice?.toFixed(0) || '199'}/night
                    {existingData?.basePrice && existingData?.totalPrice && 
                     existingData.basePrice > existingData.totalPrice && 
                     ` (${Math.round(((existingData.basePrice - existingData.totalPrice) / existingData.basePrice) * 100)}% off)`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Publishing Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Publishing Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#5FAD43]" />
                <div>
                  <h4 className="font-medium text-gray-900">Publish Immediately</h4>
                  <p className="text-sm text-gray-600">Make your package available for booking right away</p>
                </div>
              </div>
              <Switch
                checked={publishImmediately}
                onCheckedChange={setPublishImmediately}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Save as Draft</h4>
                  <p className="text-sm text-gray-600">Save for editing later without publishing</p>
                </div>
              </div>
              <Switch
                checked={saveDraft}
                onCheckedChange={setSaveDraft}
              />
            </div>
          </div>

          {publishImmediately && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Ready to Go Live!</span>
              </div>
              <p className="text-xs text-blue-800">
                Your package will appear in search results and be available for booking immediately.
              </p>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Final Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <div className="space-y-3">
          <Button
            onClick={handlePublish}
            className="w-full gradient-hotel-manager text-white py-4 rounded-xl text-lg font-medium"
          >
            {publishImmediately ? '🎉 Publish Package' : '💾 Save Package'}
          </Button>
          
          <p className="text-center text-xs text-gray-500">
            You can always edit your package details after publishing
          </p>
        </div>
      </motion.div>
    </div>
  );
}