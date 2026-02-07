
import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Star, Video, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { StepData } from '../../types';
import { cn } from '@/lib/utils';

export interface MediaItem {
    id: string;
    url: string; // base64 data URL or blob URL
    fileName: string;
    size: number;
    type: 'image' | 'video';
    uploadedAt: string;
    order: number;
    isCover?: boolean;
}

export interface MediaData {
    items: MediaItem[];
}

interface MediaStepProps {
    onComplete: (data: StepData) => void;
    onUpdate: (data: StepData) => void;
    existingData?: StepData;
    onBack: () => void;
}

export function MediaStep({ onComplete, onUpdate, existingData, onBack }: MediaStepProps) {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>(existingData?.media?.photos || []);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    // Update parent state on changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateParent = (items: MediaItem[]) => {
        onUpdate({
            ...existingData,
            media: {
                photos: items, // Using 'photos' field for all media for now based on types, or we can expand types
                video: items.find(i => i.type === 'video')?.url
            }
        });
    };

    const compressImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Max dimensions
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to 0.8 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;

        setUploadError(null);
        const fileArray = Array.from(files);

        // Validate files
        const validFiles = fileArray.filter(file => {
            const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
            const isVideo = ['video/mp4', 'video/webm'].includes(file.type);
            const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image

            if (!isImage && !isVideo) {
                setUploadError('Only JPG, PNG, WebP images and MP4, WebM videos are allowed');
                return false;
            }
            if (file.size > maxSize) {
                setUploadError(`File size must be less than ${isVideo ? '50MB' : '10MB'}`);
                return false;
            }
            return true;
        });

        const newItems: MediaItem[] = [];
        for (const file of validFiles) {
            try {
                let url: string;
                const isVideo = file.type.startsWith('video/');

                if (isVideo) {
                    url = URL.createObjectURL(file);
                } else {
                    url = await compressImage(file);
                }

                newItems.push({
                    id: `media_${Date.now()}_${Math.random()}`,
                    url,
                    fileName: file.name,
                    size: file.size,
                    type: isVideo ? 'video' : 'image',
                    uploadedAt: new Date().toISOString(),
                    order: mediaItems.length + newItems.length,
                    isCover: !isVideo && mediaItems.filter(i => i.type === 'image').length === 0 && newItems.filter(i => !i.type.startsWith('video')).length === 0
                });
            } catch (error) {
                console.error('Error processing file:', error);
                setUploadError('Error processing file');
            }
        }

        const updatedItems = [...mediaItems, ...newItems];
        setMediaItems(updatedItems);
        updateParent(updatedItems);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaItems]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const deleteMedia = (id: string) => {
        const updatedItems = mediaItems.filter(p => p.id !== id);
        setMediaItems(updatedItems);
        updateParent(updatedItems);
    };

    const setCoverMedia = (id: string) => {
        const item = mediaItems.find(i => i.id === id);
        if (item?.type === 'video') return; // Videos cannot be covers

        const updatedItems = mediaItems.map(p => ({
            ...p,
            isCover: p.id === id
        }));
        setMediaItems(updatedItems);
        updateParent(updatedItems);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleContinue = () => {
        setShowValidation(true);
        if (mediaItems.length >= 3) {
            onComplete({
                ...existingData,
                media: {
                    photos: mediaItems,
                    video: mediaItems.find(i => i.type === 'video')?.url
                }
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Photos & Media
                </h1>
                <p className="text-gray-600 text-lg">
                    Showcase your package with high-quality photos and videos.
                </p>
            </motion.div>

            {/* Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
            >
                <Card
                    className={cn(
                        "p-10 border-2 border-dashed transition-all cursor-pointer group",
                        isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/40 hover:bg-gray-50',
                        showValidation && mediaItems.length < 3 && "border-error bg-error-foreground"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('media-upload')?.click()}
                >
                    <div className="text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
                            isDragging ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500 group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Drag & drop photos or videos here
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                            Support for JPG, PNG, WebP images (max 10MB) and MP4, WebM videos (max 50MB)
                        </p>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                            onChange={handleFileInput}
                            className="hidden"
                            id="media-upload"
                        />
                        <Button
                            type="button"
                            className="bg-black hover:bg-gray-800 text-white rounded-full px-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById('media-upload')?.click();
                            }}
                        >
                            Browse Files
                        </Button>
                        {uploadError && (
                            <p className="text-error text-sm mt-4 bg-error-foreground py-2 px-3 rounded inline-block">
                                <span className="font-semibold">Error:</span> {uploadError}
                            </p>
                        )}
                    </div>
                </Card>
                {showValidation && mediaItems.length < 3 && (
                    <p className="text-sm text-error mt-2 pl-1">
                        At least 3 photos are required to continue.
                    </p>
                )}
            </motion.div>

            {/* Media Count */}
            {mediaItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between px-1"
                >
                    <div className="text-sm text-gray-600 font-medium">
                        {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''} uploaded
                        {mediaItems.length < 3 && (
                            <span className="text-warning ml-2">
                                • {3 - mediaItems.length} more required
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        Top ranking packages have 8+ photos
                    </p>
                </motion.div>
            )}

            {/* Media Grid */}
            <AnimatePresence mode="popLayout">
                {mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="relative group overflow-hidden aspect-square rounded-xl border-0 shadow-sm hover:shadow-md transition-all">
                                    {/* Media Content */}
                                    {item.type === 'video' ? (
                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover opacity-80"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PlayCircle className="w-12 h-12 text-white opacity-80" />
                                            </div>
                                            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                                <Video size={10} />
                                                Video
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={item.fileName}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    )}

                                    {/* Cover Badge */}
                                    {item.isCover && (
                                        <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm z-10">
                                            <Star size={10} fill="currentColor" />
                                            COVER
                                        </div>
                                    )}

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                        {item.type !== 'video' && !item.isCover && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setCoverMedia(item.id)}
                                                className="h-8 text-xs bg-white hover:bg-gray-100 text-gray-900 border-0"
                                            >
                                                <Star size={12} className="mr-1.5" />
                                                Set Cover
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteMedia(item.id)}
                                            className="h-8 text-xs bg-error hover:bg-error/90 border-0"
                                        >
                                            <X size={12} className="mr-1.5" />
                                            Remove
                                        </Button>
                                    </div>

                                    {/* File Info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 pointer-events-none">
                                        <p className="text-white text-xs font-medium truncate mb-0.5">{item.fileName}</p>
                                        <p className="text-white/60 text-[10px] uppercase tracking-wider">{formatFileSize(item.size)}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    mediaItems.length === 0 && !isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                                <ImageIcon size={20} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">No media uploaded yet</p>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div
                className="flex justify-between pt-8 border-t border-gray-100 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <button
                    onClick={onBack}
                    className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleContinue}
                    className={cn(
                        "px-8 py-3 bg-black text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0",
                        mediaItems.length < 3 ? "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-lg" : "hover:bg-gray-800"
                    )}
                // disabled={mediaItems.length < 3} // Optional: disable checking here too if desired, but we show validation on click
                >
                    Continue
                </button>
            </motion.div>
        </div>
    );
}
