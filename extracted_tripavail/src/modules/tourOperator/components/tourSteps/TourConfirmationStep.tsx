import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar,
  Camera,
  Shield,
  Star,
  Edit,
  Eye,
  Share2
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { ImageWithFallback } from '../../../../components/figma/ImageWithFallback';

interface TourConfirmationStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

export function TourConfirmationStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourConfirmationStepProps) {
  const [confirmationData, setConfirmationData] = useState({
    publishImmediately: data.publishImmediately || true,
    sendNotifications: data.sendNotifications || true,
    isComplete: false
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    onUpdate(confirmationData);
  }, [confirmationData]);

  const handleInputChange = (field: string, value: any) => {
    setConfirmationData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    setConfirmationData(prev => ({ ...prev, isComplete: true }));
    onNext();
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 8;

    if (data.name) completed++;
    if (data.description) completed++;
    if (data.category) completed++;
    if (data.location) completed++;
    if (data.itinerary && data.itinerary.length > 0) completed++;
    if (data.basePricePerPerson) completed++;
    if (data.coverImage || (data.gallery && data.gallery.length > 0)) completed++;
    if (data.schedules && data.schedules.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: data.currency || 'PKR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const completionPercentage = getCompletionPercentage();
  const isReadyToPublish = completionPercentage >= 80;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-[#5FAD43] to-[#4a9637] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Review & Confirm</h2>
            <p className="text-green-100">Review your tour details before publishing</p>
          </div>
        </div>
        
        {/* Completion Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-100">Tour Completion</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {!isReadyToPublish && (
            <p className="text-xs text-green-100 mt-1">
              Complete at least 80% to publish your tour
            </p>
          )}
        </div>
      </Card>

      {/* Tour Summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {data.name || 'Untitled Tour'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {data.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{data.location}</span>
                </div>
              )}
              {data.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{data.duration}</span>
                </div>
              )}
              {data.groupSize && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{data.groupSize}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Cover Image */}
        {data.coverImage && (
          <div className="mb-4">
            <ImageWithFallback
              src={data.coverImage}
              alt="Tour cover"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.category && (
            <Badge variant="secondary">{data.category}</Badge>
          )}
          {data.difficulty && (
            <Badge variant="outline">{data.difficulty} difficulty</Badge>
          )}
          {data.highlights && data.highlights.map((highlight: string, index: number) => (
            <Badge key={index} variant="outline" className="bg-[#5FAD43] bg-opacity-10 text-[#5FAD43]">
              {highlight}
            </Badge>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-[#5FAD43]" />
            <p className="text-sm text-gray-600">Starting Price</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.basePricePerPerson ? formatPrice(Number(data.basePricePerPerson)) : 'Not set'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Schedules</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.schedules ? data.schedules.length : 0} dates
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Camera className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Media</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.gallery ? data.gallery.length : 0} items
            </p>
          </div>
        </div>
      </Card>

      {/* Itinerary Preview */}
      {data.itinerary && data.itinerary.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Itinerary Overview</h4>
          <div className="space-y-3">
            {data.itinerary.slice(0, 3).map((day: any, index: number) => (
              <div key={day.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#5FAD43] rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {day.day}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{day.title}</h5>
                  <p className="text-sm text-gray-600">{day.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {day.activities ? day.activities.length : 0} activities planned
                  </p>
                </div>
              </div>
            ))}
            {data.itinerary.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                + {data.itinerary.length - 3} more days
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Policy Summary */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          <Shield className="w-5 h-5 inline mr-2" />
          Policy Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Cancellation Policy</p>
            <p className="font-medium text-gray-900">
              {data.cancellationPolicy || 'Flexible'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Active Rules</p>
            <p className="font-medium text-gray-900">
              {data.tourRules ? data.tourRules.filter((r: any) => r.isActive).length : 0} rules
            </p>
          </div>
          <div>
            <p className="text-gray-600">Insurance Required</p>
            <p className="font-medium text-gray-900">
              {data.insuranceRequired ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Liability Waiver</p>
            <p className="font-medium text-gray-900">
              {data.liabilityWaiver ? 'Required' : 'Not required'}
            </p>
          </div>
        </div>
      </Card>

      {/* Publishing Options */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Publishing Options</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Publish Immediately</label>
              <p className="text-sm text-gray-600">Make your tour available for booking right away</p>
            </div>
            <input
              type="checkbox"
              checked={confirmationData.publishImmediately}
              onChange={(e) => handleInputChange('publishImmediately', e.target.checked)}
              className="rounded border-gray-300"
              disabled={!isReadyToPublish}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Send Notifications</label>
              <p className="text-sm text-gray-600">Notify followers about your new tour</p>
            </div>
            <input
              type="checkbox"
              checked={confirmationData.sendNotifications}
              onChange={(e) => handleInputChange('sendNotifications', e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
        </div>

        {!isReadyToPublish && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Your tour is {completionPercentage}% complete. Complete at least 80% to publish.
            </p>
          </div>
        )}
      </Card>

      {/* Pre-launch Checklist */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">🚀 Pre-Launch Checklist</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.name ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.name ? 'text-blue-800' : 'text-gray-500'}>
              Tour name and description
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.basePricePerPerson ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.basePricePerPerson ? 'text-blue-800' : 'text-gray-500'}>
              Pricing information
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.itinerary && data.itinerary.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.itinerary && data.itinerary.length > 0 ? 'text-blue-800' : 'text-gray-500'}>
              Detailed itinerary
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.coverImage || (data.gallery && data.gallery.length > 0) ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.coverImage || (data.gallery && data.gallery.length > 0) ? 'text-blue-800' : 'text-gray-500'}>
              Photos and media
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.schedules && data.schedules.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.schedules && data.schedules.length > 0 ? 'text-blue-800' : 'text-gray-500'}>
              Available dates
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${data.cancellationPolicy ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.cancellationPolicy ? 'text-blue-800' : 'text-gray-500'}>
              Policies and terms
            </span>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      {isReadyToPublish && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🎉 Ready to Launch!</h4>
          <p className="text-sm text-green-800 mb-3">
            Your tour looks great! Once published, travelers can discover and book your tour.
          </p>
          <div className="text-xs text-green-700">
            <p>• Your tour will appear in search results</p>
            <p>• You'll receive booking notifications</p>
            <p>• You can edit details anytime from your dashboard</p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className="px-6"
        >
          Previous
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleInputChange('publishImmediately', false)}
            disabled={!isReadyToPublish}
          >
            Save as Draft
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !isReadyToPublish}
            className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-6"
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish Tour
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tour Preview</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
              
              {/* Preview content would go here */}
              <div className="space-y-4">
                <div className="text-center text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-2" />
                  <p>Tour preview will show how your tour appears to customers</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}