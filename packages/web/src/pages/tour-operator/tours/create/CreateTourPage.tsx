import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Tour, tourService } from '@/features/tour-operator/services/tourService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { TourBasicsStep } from './components/TourBasicsStep';
import { TourMediaStep } from './components/TourMediaStep';
import { TourItineraryStep } from './components/TourItineraryStep';
import { TourDetailsStep } from './components/TourDetailsStep';
import { TourPricingStep } from './components/TourPricingStep';
import { TourSchedulingStep } from './components/TourSchedulingStep';
import { TourReviewStep } from './components/TourReviewStep';
import { Loader2 } from 'lucide-react';

const STEPS = [
    { id: 'basics', title: 'Basics', component: TourBasicsStep },
    { id: 'media', title: 'Media', component: TourMediaStep },
    { id: 'itinerary', title: 'Itinerary', component: TourItineraryStep },
    { id: 'details', title: 'Requirements', component: TourDetailsStep },
    { id: 'pricing', title: 'Pricing & Policies', component: TourPricingStep },
    { id: 'scheduling', title: 'Dates & Availability', component: TourSchedulingStep },
    { id: 'review', title: 'Review', component: TourReviewStep },
];

export default function CreateTourPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [tourData, setTourData] = useState<Partial<Tour>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = (data: Partial<Tour>) => {
        setTourData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigate('/operator/tours');
        }
    };

    const handlePublish = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Clean up and ensure required fields
            const dataToSave = {
                ...tourData,
                operator_id: user.id,
                is_active: true,
                is_verified: false, // Default for new tours
                is_featured: false,  // Default for new tours
            };

            // Remove any legacy fields that might cause schema mismatch
            if ((dataToSave as any).difficulty) {
                delete (dataToSave as any).difficulty;
            }

            await tourService.createTour(dataToSave as any);
            toast.success('Tour published successfully!');
            navigate('/operator/tours');
        } catch (error) {
            console.error('Error publishing tour:', error);
            toast.error('Failed to publish tour. Please check all fields.');
        } finally {
            setIsSaving(false);
        }
    };

    const CurrentStepComponent = STEPS[currentStep].component;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Create New Tour</h1>
                    <div className="text-sm text-gray-500">
                        Step {currentStep + 1} of {STEPS.length}: <span className="font-medium text-gray-900">{STEPS[currentStep].title}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-3xl mx-auto w-full p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
                    >
                        <CurrentStepComponent
                            data={tourData}
                            onUpdate={handleUpdate}
                            onNext={handleNext}
                            onBack={handleBack}
                            onPublish={handlePublish}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Simple Overlay Loader */}
            {isSaving && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <span className="mt-2 font-medium text-gray-700">Publishing...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
