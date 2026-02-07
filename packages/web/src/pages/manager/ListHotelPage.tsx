import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PremiumPropertyVector } from '@/features/hotel-listing/assets/PremiumPropertyVectors';
import {
    PropertyTypeIcon,
    LocationIcon,
    AmenitiesIcon,
    PhotosIcon,
    PricingIcon
} from '@/features/hotel-listing/assets/HotelListingIcons';
import CompleteHotelListingFlow from '@/features/hotel-listing/components/CompleteHotelListingFlow';
import { hotelService } from '@/features/hotel-listing/services/hotelService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ListHotelPage() {
    const [isStarted, setIsStarted] = useState(false);
    const [selectedPropertyType, setSelectedPropertyType] = useState<string>('hotel');
    const [draftId, setDraftId] = useState<string>();
    const [draftData, setDraftData] = useState<any>();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // Load draft if draftId in URL
    useEffect(() => {
        const urlDraftId = searchParams.get('draftId');
        if (urlDraftId && user?.id) {
            loadDraft(urlDraftId);
        }
    }, [searchParams, user?.id]);

    const loadDraft = async (id: string) => {
        setLoading(true);
        const result = await hotelService.getDraft(id, user!.id);

        if (result.success && result.draftData) {
            setDraftId(id);
            setDraftData(result.draftData);
            setIsStarted(true);
            toast.success('Draft loaded! Continue where you left off');
        } else {
            toast.error('Could not load draft');
            navigate('/manager/dashboard');
        }
        setLoading(false);
    };

    const handleStart = () => {
        setIsStarted(true);
    };

    const handleSaveAndExit = async (data: any) => {
        if (!user?.id) {
            toast.error('Please log in to save your draft');
            return;
        }

        const result = await hotelService.saveDraft(data, user.id, draftId);

        if (result.success) {
            toast.success('Draft saved successfully!');
            navigate('/manager/dashboard');
        } else {
            toast.error('Failed to save draft');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isStarted) {
        return (
            <CompleteHotelListingFlow
                initialPropertyType={selectedPropertyType}
                initialData={draftData}
                initialDraftId={draftId}
                onBack={() => setIsStarted(false)}
                onSaveAndExit={handleSaveAndExit}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <span className="font-bold text-xl">TripAvail</span>
                </div>
                <Button variant="ghost" onClick={() => navigate(-1)}>Exit</Button>
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                                List your <br />
                                <span className="text-primary">property</span> on <br />
                                TripAvail
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Join our global network of hosts and reach millions of travelers.
                                Simple setup, powerful tools, and 24/7 support.
                            </p>

                            <Button
                                size="lg"
                                onClick={handleStart}
                                className="text-lg px-8 py-6 h-auto shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-1"
                            >
                                Get Started
                            </Button>
                        </motion.div>

                        {/* Steps Preview */}
                        <div className="grid grid-cols-5 gap-4 pt-8">
                            {[
                                { icon: PropertyTypeIcon, label: "Type" },
                                { icon: LocationIcon, label: "Location" },
                                { icon: AmenitiesIcon, label: "Amenities" },
                                { icon: PhotosIcon, label: "Photos" },
                                { icon: PricingIcon, label: "Pricing" }
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    className="flex flex-col items-center gap-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border flex items-center justify-center">
                                        <step.icon size={24} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">{step.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: 3D Animation */}
                    <div className="relative h-[500px] flex items-center justify-center bg-primary/5 rounded-3xl border border-primary/10 overflow-hidden">
                        {/* Background blobs */}
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />

                        <div className="scale-150 transform transition-transform duration-500 hover:scale-[1.6]">
                            <PremiumPropertyVector propertyType={selectedPropertyType as any} size={280} />
                        </div>

                        {/* Type Selector Pills */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 flex-wrap px-8">
                            {['hotel', 'resort', 'boutique', 'inn'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedPropertyType(type)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedPropertyType === type
                                        ? 'bg-blue-600 text-white shadow-md scale-105'
                                        : 'bg-white text-gray-600 border hover:bg-gray-50'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
