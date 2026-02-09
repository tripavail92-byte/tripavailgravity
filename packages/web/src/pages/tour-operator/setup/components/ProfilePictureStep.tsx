import { useState, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function ProfilePictureStep({ onUpdate, data }: StepProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(data.profilePicture || null);

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                setSelectedImage(imageUrl);
                onUpdate({ profilePicture: imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        onUpdate({ profilePicture: null });
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Picture</h3>
                <p className="text-gray-600">Add a professional photo to build trust with travelers.</p>
            </div>

            <Card className="p-8 flex flex-col items-center space-y-6 border-gray-100 shadow-sm rounded-2xl">
                <div className="relative group">
                    <Avatar className="w-40 h-40 border-4 border-white shadow-xl ring-1 ring-gray-100">
                        <AvatarImage src={selectedImage || ''} />
                        <AvatarFallback className="bg-primary/5 text-primary text-4xl">
                            <Camera className="w-16 h-16 opacity-20" />
                        </AvatarFallback>
                    </Avatar>

                    {selectedImage && (
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-2 shadow-lg border border-red-50 transition-all hover:scale-110 active:scale-90"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    <input
                        type="file"
                        id="profile-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <label
                        htmlFor="profile-upload"
                        className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110 active:scale-95 border-2 border-white"
                    >
                        <Upload className="w-5 h-5 text-white" />
                    </label>
                </div>

                <div className="text-center space-y-2">
                    <h4 className="font-semibold text-gray-900">
                        {selectedImage ? 'Looking Great!' : 'Upload your photo'}
                    </h4>
                    <p className="text-sm text-gray-500 max-w-xs">
                        High-quality square photos (JPG or PNG) work best. Max size 5MB.
                    </p>
                </div>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                <span className="text-blue-500 text-xl font-bold italic">i</span>
                <p className="text-sm text-blue-800 leading-relaxed">
                    A clear, professional profile picture significantly increases booking requests by appearing more trustworthy to travelers.
                </p>
            </div>
        </div>
    );
}
