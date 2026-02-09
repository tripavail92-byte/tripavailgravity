import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tour, tourService } from '@/features/tour-operator/services/tourService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils'; // Assuming cn utility is available based on previous files

interface TourMediaStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function TourMediaStep({ data, onUpdate, onNext, onBack }: TourMediaStepProps) {
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState<string[]>(data.images || []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user?.id) return;

        setIsUploading(true);
        try {
            const urls = await tourService.uploadTourImages(user.id, acceptedFiles);
            const newImages = [...images, ...urls];
            setImages(newImages);
            onUpdate({ images: newImages });
            toast.success(`Uploaded ${urls.length} images`);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload images');
        } finally {
            setIsUploading(false);
        }
    }, [user?.id, images, onUpdate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const removeImage = (indexToRemove: number) => {
        const newImages = images.filter((_, index) => index !== indexToRemove);
        setImages(newImages);
        onUpdate({ images: newImages });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tour Media</h2>
                <p className="text-gray-500">Showcase your tour with high-quality photos.</p>
            </div>

            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-900">
                            {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            SVG, PNG, JPG or GIF (max. 10MB)
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={url}
                                alt={`Tour image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && !isUploading && (
                <div className="text-center py-8">
                    <ImageIcon size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">No images uploaded yet</p>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={isUploading || images.length === 0}>Next Step</Button>
            </div>
        </div>
    );
}
