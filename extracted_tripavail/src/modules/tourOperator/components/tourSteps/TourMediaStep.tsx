import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Play, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Badge } from '../../../../components/ui/badge';
import { ImageWithFallback } from '../../../../components/figma/ImageWithFallback';
// Note: In a real implementation, this would use the unsplash_tool function
// For now, we'll use placeholder images

interface TourMediaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  isPrimary: boolean;
}

const SAMPLE_MEDIA_SUGGESTIONS = [
  'scenic mountain landscape',
  'cultural heritage site',
  'local food dishes',
  'adventure activities',
  'traditional architecture',
  'wildlife photography',
  'people enjoying tour',
  'group activities'
];

export function TourMediaStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourMediaStepProps) {
  const [mediaData, setMediaData] = useState({
    coverImage: data.coverImage || '',
    gallery: data.gallery || [],
    videoUrl: data.videoUrl || '',
    virtualTourUrl: data.virtualTourUrl || '',
    brochureUrl: data.brochureUrl || ''
  });

  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    onUpdate(mediaData);
  }, [mediaData]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setMediaData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addSampleImages = async () => {
    setIsLoadingSample(true);
    try {
      // Add sample images using unsplash
      const suggestions = SAMPLE_MEDIA_SUGGESTIONS.slice(0, 6);
      const newImages: MediaItem[] = [];

      for (let i = 0; i < suggestions.length; i++) {
        try {
          // In a real implementation, this would use unsplash_tool({ query: suggestions[i] })
          const imageUrl = `https://images.unsplash.com/photo-${1600000000 + i}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
          newImages.push({
            id: Date.now().toString() + i,
            type: 'image',
            url: imageUrl,
            caption: suggestions[i],
            isPrimary: i === 0 && !mediaData.coverImage
          });
        } catch (error) {
          console.error('Failed to fetch sample image:', error);
        }
      }

      setMediaData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...newImages],
        coverImage: !prev.coverImage && newImages.length > 0 ? newImages[0].url : prev.coverImage
      }));
    } catch (error) {
      console.error('Failed to add sample images:', error);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const simulateFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const fileId = Date.now().toString();
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }));
        
        if (progress >= 100) {
          clearInterval(interval);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          // Return a placeholder URL
          resolve(`https://via.placeholder.com/800x600?text=${encodeURIComponent(file.name)}`);
        }
      }, 100);
    });
  };

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video' = 'image') => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const url = await simulateFileUpload(file);
        
        const newItem: MediaItem = {
          id: Date.now().toString() + i,
          type,
          url,
          caption: file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: false
        };

        setMediaData(prev => ({
          ...prev,
          gallery: [...prev.gallery, newItem]
        }));
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const removeMediaItem = (itemId: string) => {
    setMediaData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(item => item.id !== itemId)
    }));
  };

  const setPrimaryImage = (itemId: string) => {
    const item = mediaData.gallery.find(item => item.id === itemId);
    if (item && item.type === 'image') {
      setMediaData(prev => ({
        ...prev,
        coverImage: item.url,
        gallery: prev.gallery.map(galleryItem => ({
          ...galleryItem,
          isPrimary: galleryItem.id === itemId
        }))
      }));
    }
  };

  const updateCaption = (itemId: string, caption: string) => {
    setMediaData(prev => ({
      ...prev,
      gallery: prev.gallery.map(item =>
        item.id === itemId ? { ...item, caption } : item
      )
    }));
  };

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
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Media</h2>
            <p className="text-green-100">Showcase your tour with compelling visuals</p>
          </div>
        </div>
      </Card>

      {/* Cover Image */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Cover Image</h3>
        
        {mediaData.coverImage ? (
          <div className="relative group">
            <ImageWithFallback
              src={mediaData.coverImage}
              alt="Tour cover"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-gray-900"
                onClick={() => handleInputChange('coverImage', '')}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Choose a cover image for your tour</p>
            <div className="space-y-2">
              <Button
                onClick={addSampleImages}
                disabled={isLoadingSample}
                className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
              >
                {isLoadingSample ? 'Loading...' : 'Add Sample Images'}
              </Button>
              <p className="text-sm text-gray-500">or upload your own images below</p>
            </div>
          </div>
        )}
      </Card>

      {/* Image Gallery */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Image Gallery</h3>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'image')}
                className="hidden"
              />
              <Button size="sm" className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white">
                <Upload className="w-4 h-4 mr-1" />
                Upload Images
              </Button>
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#5FAD43] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {mediaData.gallery.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No images uploaded yet</p>
            <p className="text-sm">Upload some images to showcase your tour</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mediaData.gallery.map((item) => (
              <motion.div
                key={item.id}
                className="relative group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {item.type === 'image' ? (
                  <ImageWithFallback
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="p-2 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-auto">
                      <div className="flex gap-1">
                        {item.type === 'image' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-gray-900 h-6 px-2 text-xs"
                            onClick={() => setPrimaryImage(item.id)}
                          >
                            {item.isPrimary ? 'Primary' : 'Set Primary'}
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-600 text-white border-red-600 h-6 w-6 p-0"
                        onClick={() => removeMediaItem(item.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="mt-2">
                  <Input
                    value={item.caption}
                    onChange={(e) => updateCaption(item.id, e.target.value)}
                    placeholder="Add caption..."
                    className="text-sm"
                  />
                </div>

                {/* Primary Badge */}
                {item.isPrimary && (
                  <Badge className="absolute top-2 left-2 bg-[#5FAD43] text-white">
                    Primary
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Video Content */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Video Content (Optional)</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promotional Video URL
            </label>
            <Input
              value={mediaData.videoUrl}
              onChange={(e) => handleInputChange('videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-sm text-gray-500 mt-1">
              YouTube or Vimeo links work best
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Virtual Tour URL
            </label>
            <Input
              value={mediaData.virtualTourUrl}
              onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-sm text-gray-500 mt-1">
              360° tour or interactive map link
            </p>
          </div>
        </div>
      </Card>

      {/* Additional Resources */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Resources (Optional)</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Tour Brochure/PDF URL
          </label>
          <Input
            value={mediaData.brochureUrl}
            onChange={(e) => handleInputChange('brochureUrl', e.target.value)}
            placeholder="Link to downloadable brochure or detailed itinerary"
          />
        </div>
      </Card>

      {/* Media Guidelines */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📸 Media Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (minimum 1200x800 pixels)</li>
          <li>• Include diverse shots: landscapes, activities, people, food</li>
          <li>• Ensure you have rights to use all media</li>
          <li>• Videos should be under 3 minutes for best engagement</li>
          <li>• Consider adding captions for accessibility</li>
        </ul>
      </Card>

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
        
        <Button
          onClick={onNext}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-6"
        >
          Next: Policies
        </Button>
      </div>
    </motion.div>
  );
}