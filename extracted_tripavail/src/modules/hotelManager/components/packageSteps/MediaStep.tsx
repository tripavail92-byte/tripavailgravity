import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, X, Play, Image as ImageIcon, Star, Eye } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { ImageWithFallback } from '../../../../components/figma/ImageWithFallback';

interface MediaStepProps {
  onComplete: (data: {
    media: {
      coverPhoto?: string;
      supportingPhotos?: string[];
      video?: string;
    }
  }) => void;
  onUpdate: (data: {
    media: {
      coverPhoto?: string;
      supportingPhotos?: string[];
      video?: string;
    }
  }) => void;
  existingData?: {
    media?: {
      coverPhoto?: string;
      supportingPhotos?: string[];
      video?: string;
    };
    packageType?: string;
  };
}

export function MediaStep({ onComplete, onUpdate, existingData }: MediaStepProps) {
  const [coverPhoto, setCoverPhoto] = useState(existingData?.media?.coverPhoto || '');
  const [supportingPhotos, setSupportingPhotos] = useState<string[]>(existingData?.media?.supportingPhotos || []);
  const [video, setVideo] = useState(existingData?.media?.video || '');

  // Sample stock photos for different package types (in a real app, these would come from unsplash_tool)
  const getSamplePhotos = (packageType: string) => {
    // These would normally be actual image URLs from Unsplash
    return {
      cover: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop`,
      supporting: [
        `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop`,
        `https://images.unsplash.com/photo-1578662996442-48da7fd4c8c6?w=400&h=300&fit=crop`,
        `https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop`,
        `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop`
      ]
    };
  };

  const samplePhotos = getSamplePhotos(existingData?.packageType || 'weekend');

  const updateMedia = () => {
    const media = {
      coverPhoto: coverPhoto || undefined,
      supportingPhotos: supportingPhotos.length > 0 ? supportingPhotos : undefined,
      video: video || undefined
    };
    onUpdate({ media });
  };

  const handleCoverPhotoSelect = (photoUrl: string) => {
    setCoverPhoto(photoUrl);
    setTimeout(updateMedia, 100);
  };

  const handleSupportingPhotoAdd = (photoUrl: string) => {
    if (!supportingPhotos.includes(photoUrl) && supportingPhotos.length < 6) {
      const updated = [...supportingPhotos, photoUrl];
      setSupportingPhotos(updated);
      setTimeout(updateMedia, 100);
    }
  };

  const handleSupportingPhotoRemove = (index: number) => {
    const updated = supportingPhotos.filter((_, i) => i !== index);
    setSupportingPhotos(updated);
    setTimeout(updateMedia, 100);
  };

  const handleVideoAdd = (videoUrl: string) => {
    setVideo(videoUrl);
    setTimeout(updateMedia, 100);
  };

  const handleContinue = () => {
    const media = {
      coverPhoto: coverPhoto || undefined,
      supportingPhotos: supportingPhotos.length > 0 ? supportingPhotos : undefined,
      video: video || undefined
    };
    onComplete({ media });
  };

  // Mock file upload handler (in real app, would upload to cloud storage)
  const handleFileUpload = (type: 'cover' | 'supporting' | 'video') => {
    // Simulate file upload with sample image
    setTimeout(() => {
      if (type === 'cover') {
        handleCoverPhotoSelect(samplePhotos.cover);
      } else if (type === 'supporting') {
        handleSupportingPhotoAdd(samplePhotos.supporting[supportingPhotos.length] || samplePhotos.supporting[0]);
      } else if (type === 'video') {
        handleVideoAdd('https://sample-video-url.mp4');
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos & Media</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Add high-quality photos and videos to showcase your package and attract more bookings.
        </p>
      </motion.div>

      {/* Cover Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#5FAD43]" />
              <label className="text-sm font-medium text-gray-700">
                Cover Photo *
              </label>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>

            {coverPhoto ? (
              <div className="relative group">
                <div className="aspect-video w-full rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={coverPhoto}
                    alt="Package cover photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCoverPhoto('')}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="aspect-video w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#5FAD43] transition-colors bg-gray-50"
                onClick={() => handleFileUpload('cover')}
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Click to upload cover photo</p>
                <p className="text-xs text-gray-500">Recommended: 1200x800px, max 5MB</p>
              </div>
            )}

            {/* Sample Cover Photos */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Or choose from samples:</p>
              <div className="grid grid-cols-4 gap-2">
                {[samplePhotos.cover, ...samplePhotos.supporting.slice(0, 3)].map((photoUrl, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleCoverPhotoSelect(photoUrl)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#5FAD43] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageWithFallback
                      src={photoUrl}
                      alt={`Sample photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Supporting Photos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#5FAD43]" />
                <label className="text-sm font-medium text-gray-700">
                  Supporting Photos ({supportingPhotos.length}/6)
                </label>
              </div>
              {supportingPhotos.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileUpload('supporting')}
                  className="border-[#5FAD43] text-[#5FAD43] hover:bg-green-50"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Add Photo
                </Button>
              )}
            </div>

            {/* Current Supporting Photos */}
            {supportingPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {supportingPhotos.map((photo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={photo}
                        alt={`Supporting photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleSupportingPhotoRemove(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Sample Supporting Photos */}
            <div>
              <p className="text-xs text-gray-600 mb-2">Add from samples:</p>
              <div className="grid grid-cols-4 gap-2">
                {samplePhotos.supporting
                  .filter(photo => !supportingPhotos.includes(photo))
                  .map((photoUrl, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSupportingPhotoAdd(photoUrl)}
                      disabled={supportingPhotos.length >= 6}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#5FAD43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: supportingPhotos.length < 6 ? 1.05 : 1 }}
                      whileTap={{ scale: supportingPhotos.length < 6 ? 0.95 : 1 }}
                    >
                      <ImageWithFallback
                        src={photoUrl}
                        alt={`Sample supporting photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Video (Optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-medium text-gray-700">
                  Promotional Video (Optional)
                </label>
              </div>
              {!video && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileUpload('video')}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Add Video
                </Button>
              )}
            </div>

            {video ? (
              <div className="relative group">
                <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-2 opacity-80" />
                    <p className="text-sm">Video Preview</p>
                    <p className="text-xs opacity-60">{video}</p>
                  </div>
                </div>
                <button
                  onClick={() => setVideo('')}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Play className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Add a promotional video to boost engagement</p>
                <p className="text-xs text-gray-500">Recommended: 30-90 seconds, max 100MB</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Media Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Visual Content Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-resolution, well-lit photos that showcase your best features</li>
                <li>• Include a mix of room shots, amenities, food, and guest experiences</li>
                <li>• Videos should be short, engaging, and highlight unique selling points</li>
                <li>• Avoid cluttered or poorly lit images that may turn guests away</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Media Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Media Summary</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Cover Photo: {coverPhoto ? '✅ Added' : '❌ Required'}</p>
            <p>• Supporting Photos: {supportingPhotos.length} of 6 added</p>
            <p>• Promotional Video: {video ? '✅ Added' : '⭕ Optional'}</p>
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          disabled={!coverPhoto}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!coverPhoto ? 'Add cover photo to continue' : 'Continue to Policies'}
        </Button>
      </motion.div>
    </div>
  );
}