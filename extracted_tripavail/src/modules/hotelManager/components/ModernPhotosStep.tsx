import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Check, Image as ImageIcon, GripVertical, Star, Camera, ChevronDown, Plus } from 'lucide-react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { getPhotoCategoryIcon } from '../../../components/icons/photos/AnimatedPhotoCategoryIcons';

interface PhotoCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  minPhotos: number;
  icon: string;
}

interface ModernPhotosStepProps {
  onComplete: (data: {
    photos: {
      [categoryId: string]: Array<{
        id: string;
        url: string;
        isCover: boolean;
      }>;
    };
  }) => void;
  onUpdate: (data: any) => void;
  existingData?: {
    photos?: {
      [categoryId: string]: Array<{
        id: string;
        url: string;
        isCover: boolean;
      }>;
    };
  };
}

const photoCategories: PhotoCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior & Building',
    description: 'Outside views, entrance, facade, parking area',
    required: true,
    minPhotos: 5,
    icon: '🏢'
  },
  {
    id: 'lobby',
    name: 'Lobby & Reception',
    description: 'Front desk, waiting areas, lobby decor',
    required: true,
    minPhotos: 5,
    icon: '🛎️'
  },
  {
    id: 'rooms',
    name: 'Guest Rooms',
    description: 'Bedrooms, bathrooms, room amenities',
    required: true,
    minPhotos: 8,
    icon: '🛏️'
  },
  {
    id: 'dining',
    name: 'Dining & Restaurant',
    description: 'Restaurant, cafe, bar, dining areas',
    required: false,
    minPhotos: 3,
    icon: '🍽️'
  },
  {
    id: 'facilities',
    name: 'Facilities & Amenities',
    description: 'Pool, gym, spa, business center',
    required: false,
    minPhotos: 3,
    icon: '🏊'
  },
  {
    id: 'common',
    name: 'Common Areas',
    description: 'Hallways, lounges, outdoor spaces',
    required: false,
    minPhotos: 3,
    icon: '🌳'
  }
];

export function ModernPhotosStep({ onComplete, onUpdate, existingData }: ModernPhotosStepProps) {
  const [photos, setPhotos] = useState<{
    [categoryId: string]: Array<{ id: string; url: string; isCover: boolean }>;
  }>(existingData?.photos || {});
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['exterior']);
  const [draggedPhoto, setDraggedPhoto] = useState<{ categoryId: string; photoId: string } | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Smart accordion: close others when one opens, with auto-scroll
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const isCurrentlyExpanded = prev.includes(categoryId);
      
      if (isCurrentlyExpanded) {
        // Close this category
        return prev.filter(id => id !== categoryId);
      } else {
        // Open this category, close all others, and scroll to it
        setTimeout(() => {
          sectionRefs.current[categoryId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
        
        return [categoryId];
      }
    });
  };

  const handleFileSelect = (categoryId: string, files: FileList | null) => {
    if (!files) return;

    const newPhotos = Array.from(files).map(file => ({
      id: `${categoryId}-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      isCover: false
    }));

    const categoryPhotos = photos[categoryId] || [];
    const updatedPhotos = {
      ...photos,
      [categoryId]: [...categoryPhotos, ...newPhotos]
    };

    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos });
  };

  const removePhoto = (categoryId: string, photoId: string) => {
    const categoryPhotos = photos[categoryId] || [];
    const updatedCategoryPhotos = categoryPhotos.filter(p => p.id !== photoId);
    
    const updatedPhotos = {
      ...photos,
      [categoryId]: updatedCategoryPhotos
    };

    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos });
  };

  const setCoverPhoto = (categoryId: string, photoId: string) => {
    const categoryPhotos = photos[categoryId] || [];
    const updatedCategoryPhotos = categoryPhotos.map(p => ({
      ...p,
      isCover: p.id === photoId
    }));

    const updatedPhotos = {
      ...photos,
      [categoryId]: updatedCategoryPhotos
    };

    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos });
  };

  const handleDragStart = (categoryId: string, photoId: string) => {
    setDraggedPhoto({ categoryId, photoId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (categoryId: string, targetPhotoId: string) => {
    if (!draggedPhoto || draggedPhoto.categoryId !== categoryId) return;

    const categoryPhotos = [...(photos[categoryId] || [])];
    const draggedIndex = categoryPhotos.findIndex(p => p.id === draggedPhoto.photoId);
    const targetIndex = categoryPhotos.findIndex(p => p.id === targetPhotoId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = categoryPhotos.splice(draggedIndex, 1);
    categoryPhotos.splice(targetIndex, 0, removed);

    const updatedPhotos = {
      ...photos,
      [categoryId]: categoryPhotos
    };

    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos });
    setDraggedPhoto(null);
  };

  const getCategoryProgress = (categoryId: string) => {
    const categoryPhotos = photos[categoryId] || [];
    const category = photoCategories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    return Math.min(100, (categoryPhotos.length / category.minPhotos) * 100);
  };

  const getTotalProgress = () => {
    const requiredCategories = photoCategories.filter(c => c.required);
    const completedCategories = requiredCategories.filter(category => {
      const categoryPhotos = photos[category.id] || [];
      return categoryPhotos.length >= category.minPhotos;
    });
    
    return (completedCategories.length / requiredCategories.length) * 100;
  };

  const getTotalPhotos = () => {
    return Object.values(photos).reduce((total, categoryPhotos) => total + categoryPhotos.length, 0);
  };

  const canContinue = () => {
    const requiredCategories = photoCategories.filter(c => c.required);
    return requiredCategories.every(category => {
      const categoryPhotos = photos[category.id] || [];
      return categoryPhotos.length >= category.minPhotos;
    });
  };

  const handleContinue = () => {
    if (canContinue()) {
      onComplete({ photos });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-black flex items-center justify-center"
        >
          <Camera className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Add some photos of your property
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          You'll need at least 5 photos to get started. You can add more or make changes later.
        </p>

        {/* Progress Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(getTotalProgress())}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getTotalProgress()}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{
                background: getTotalProgress() === 100 
                  ? '#000000'
                  : 'linear-gradient(90deg, #9D4EDD 0%, #00D4FF 100%)'
              }}
            />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {getTotalPhotos()} photo{getTotalPhotos() !== 1 ? 's' : ''} uploaded • {
              photoCategories.filter(c => c.required && (photos[c.id]?.length || 0) >= c.minPhotos).length
            }/{photoCategories.filter(c => c.required).length} required categories completed
          </div>
        </div>
      </motion.div>

      {/* Photo Categories */}
      <div className="space-y-4">
        {photoCategories.map((category, index) => {
          const categoryPhotos = photos[category.id] || [];
          const isExpanded = expandedCategories.includes(category.id);
          const progress = getCategoryProgress(category.id);
          const isComplete = categoryPhotos.length >= category.minPhotos;

          return (
            <motion.div
              key={category.id}
              ref={(el) => sectionRefs.current[category.id] = el}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden scroll-mt-6"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                onMouseEnter={() => setHoveredIcon(category.id)}
                onMouseLeave={() => setHoveredIcon(null)}
                className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[80px] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white border border-gray-200">
                    {(() => {
                      const IconComponent = getPhotoCategoryIcon(category.id);
                      return (
                        <IconComponent
                          size={32}
                          isSelected={isExpanded}
                          isHovered={hoveredIcon === category.id}
                        />
                      );
                    })()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {category.name}
                      </h3>
                      {category.required && (
                        <span className="px-2.5 py-1 bg-black text-white text-xs font-medium rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {category.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            background: isComplete 
                              ? '#000000'
                              : 'linear-gradient(90deg, #9D4EDD 0%, #00D4FF 100%)'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-[60px]">
                        {categoryPhotos.length}/{category.minPhotos} photos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-9 h-9 rounded-full bg-black flex items-center justify-center"
                    >
                      <Check size={18} className="text-white" />
                    </motion.div>
                  )}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  </motion.div>
                </div>
              </button>

              {/* Category Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      {/* Upload Area */}
                      <div
                        onClick={() => fileInputRefs.current[category.id]?.click()}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileSelect(category.id, e.dataTransfer.files);
                        }}
                        className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 bg-white hover:border-black hover:bg-gray-50 transition-all cursor-pointer group mb-6"
                      >
                        <input
                          ref={(el) => fileInputRefs.current[category.id] = el}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFileSelect(category.id, e.target.files)}
                          className="hidden"
                        />
                        
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <Upload className="w-12 h-12 text-gray-400 group-hover:text-black transition-colors" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Drag your photos here
                          </h4>
                          <p className="text-sm text-gray-500">
                            Choose at least {category.minPhotos} photos
                          </p>
                        </div>
                      </div>

                      {/* Photo Grid */}
                      {categoryPhotos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {categoryPhotos.map((photo, photoIndex) => (
                            <motion.div
                              key={photo.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: photoIndex * 0.05 }}
                              draggable
                              onDragStart={() => handleDragStart(category.id, photo.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleDrop(category.id, photo.id);
                              }}
                              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-move"
                            >
                              <ImageWithFallback
                                src={photo.url}
                                alt={`${category.name} photo ${photoIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Photo Controls */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
                                {/* Drag Handle */}
                                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <GripVertical size={14} className="text-gray-700" />
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePhoto(category.id, photo.id);
                                  }}
                                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 shadow-sm"
                                >
                                  <X size={14} className="text-gray-700" />
                                </button>

                                {/* Set as Cover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCoverPhoto(category.id, photo.id);
                                  }}
                                  className={`absolute bottom-3 left-3 right-3 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all shadow-sm ${
                                    photo.isCover
                                      ? 'bg-black text-white'
                                      : 'bg-white text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-100'
                                  }`}
                                >
                                  <Star size={12} className={photo.isCover ? 'fill-white' : 'fill-none'} />
                                  {photo.isCover ? 'Cover' : 'Make Cover'}
                                </button>
                              </div>

                              {/* Photo Number */}
                              {!photo.isCover && (
                                <div className="absolute top-3 left-3 w-6 h-6 rounded-md bg-white/90 flex items-center justify-center text-gray-900 text-xs font-medium group-hover:opacity-0 transition-opacity shadow-sm">
                                  {photoIndex + 1}
                                </div>
                              )}
                            </motion.div>
                          ))}
                          
                          {/* Add More Button */}
                          <button
                            onClick={() => fileInputRefs.current[category.id]?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-black transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <Plus className="w-8 h-8 text-gray-400 group-hover:text-black transition-colors" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="sticky bottom-6 z-10"
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
            canContinue()
              ? 'gradient-hotel-manager hover:shadow-lg hover:scale-[1.02]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {canContinue() 
            ? `Continue with ${getTotalPhotos()} photos` 
            : `Upload ${photoCategories.filter(c => c.required).reduce((sum, c) => sum + Math.max(0, c.minPhotos - (photos[c.id]?.length || 0)), 0)} more required photos`
          }
        </button>
      </motion.div>
    </div>
  );
}
