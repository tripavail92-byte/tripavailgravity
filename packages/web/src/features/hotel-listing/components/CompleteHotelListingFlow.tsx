import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    PropertyTypeIcon,
    // LocationIcon, 
    // AmenitiesIcon, 
    // PhotosIcon, 
    // PricingIcon 
} from '@/features/hotel-listing/assets/HotelListingIcons';
// import {
//   BasicInfoIcon,
//   ModernLocationIcon,
//   ModernAmenitiesIcon,
//   ModernRoomsIcon,
//   ModernPoliciesIcon,
//   ModernPhotosIcon,
//   ModernServicesIcon,
//   ModernReviewIcon
// } from '../assets/modern/ModernStepIcons';
import { PremiumPropertyVector } from '@/features/hotel-listing/assets/PremiumPropertyVectors';
import { AirbnbBottomNav } from './ui/AirbnbBottomNav';

// Placeholder steps for Phase 3+
const PlaceholderStep = () => <div>Step content coming soon</div>;

// Step Components
import { PropertyTypeStep } from './steps/PropertyTypeStep';
import { PropertyDetailsStep } from './steps/PropertyDetailsStep';
import { LocationStep } from './steps/LocationStep';
import { AmenitiesStep } from './steps/AmenitiesStep';
import { RoomsStep } from './steps/RoomsStep';
import { PoliciesStep } from './steps/PoliciesStep';
import { PhotosStep } from './steps/PhotosStep';
import { ServicesStep } from './steps/ServicesStep';
import { ReviewStep } from './steps/ReviewStep';
import { hotelService } from '../services/hotelService';
import { useAuth } from '@/hooks/useAuth';

interface Step {
    id: number;
    title: string;
    description: string;
    component: React.ComponentType<any>;
    completed: boolean;
    required: boolean;
}

export interface HotelData {
    // Basic Info
    propertyType: string;
    hotelName: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    starRating?: number;

    // Location
    country: string;
    city: string;
    area: string;
    address: string;
    zipCode: string;
    location?: { address: string; lat: number; lng: number };

    // Amenities
    amenities: string[];

    // Rooms
    rooms: Array<{
        id: string;
        type: string;
        name: string;
        description: string;
        count: number;
        maxGuests: number;
        beds: any; // BedConfig[] from RoomsStep
        size: number;
        amenities: string[];
        pricing: {
            basePrice: number;
            currency: string;
        };
    }>;

    // Policies
    policies?: {
        checkIn: string;
        checkOut: string;
        cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
        customCancellationText?: string;
        houseRules: {
            petsAllowed: boolean;
            smokingAllowed: boolean;
            eventsAllowed: boolean;
            childrenAllowed: boolean;
            quietHoursStart?: string;
            quietHoursEnd?: string;
            additionalRules?: string;
        };
        guestRequirements: {
            minimumAge: number;
            idRequired: boolean;
            creditCardRequired: boolean;
        };
    };

    // Photos
    photos?: {
        propertyPhotos: Array<{
            id: string;
            url: string;
            fileName: string;
            size: number;
            uploadedAt: string;
            order: number;
            isCover?: boolean;
        }>;
    };

    // Services
    services?: {
        breakfast: 'included' | 'optional' | 'none';
        parking: 'free' | 'paid' | 'none';
        wifi: 'free' | 'paid' | 'none';
        facilities: {
            pool: boolean;
            gym: boolean;
            spa: boolean;
            restaurant: boolean;
            roomService: boolean;
            airportShuttle: boolean;
            evCharging: boolean;
        };
        accessibility: {
            wheelchairAccessible: boolean;
            elevator: boolean;
        };
    };
}

// Shared type for step component props - allows partial updates
export type StepData = Partial<HotelData>;

interface CompleteHotelListingFlowProps {
    onComplete?: (data: Partial<HotelData>) => void;
    onBack: () => void;
    onSaveAndExit?: (data: Partial<HotelData>) => void;
    initialPropertyType?: string;
    initialData?: Partial<HotelData>;
    initialDraftId?: string;
}

// Calculate which step to start on based on completed data
function calculateStartingStep(data?: Partial<HotelData>): number {
    if (!data) return 1;

    // Step 1: Property Type
    if (!data.propertyType) return 1;

    // Step 2: Property Details (hotelName, description, etc.)
    if (!data.hotelName || !data.description) return 2;

    // Step 3: Location
    if (!data.location?.address) return 3;

    // Step 4: Amenities
    if (!data.amenities || data.amenities.length === 0) return 4;

    // Step 5: Rooms
    if (!data.rooms || data.rooms.length === 0) return 5;

    // Step 6: Policies
    if (!data.policies) return 6;

    // Step 7: Photos
    if (!data.photos?.propertyPhotos || data.photos.propertyPhotos.length === 0) return 7;

    // Step 8: Services (optional, skip to review if empty)
    if (!data.services) return 8;

    // Step 9: Review
    return 9;
}

// Calculate completed steps based on data
function calculateCompletedSteps(data?: Partial<HotelData>): number[] {
    if (!data) return [];

    const completed: number[] = [];

    if (data.propertyType) completed.push(1);
    if (data.hotelName && data.description) completed.push(2);
    if (data.location?.address) completed.push(3);
    if (data.amenities && data.amenities.length > 0) completed.push(4);
    if (data.rooms && data.rooms.length > 0) completed.push(5);
    if (data.policies) completed.push(6);
    if (data.photos?.propertyPhotos && data.photos.propertyPhotos.length > 0) completed.push(7);
    if (data.services) completed.push(8);

    return completed;
}

export default function CompleteHotelListingFlow({ onComplete, onBack, onSaveAndExit, initialPropertyType, initialData, initialDraftId }: CompleteHotelListingFlowProps) {
    const [currentStep, setCurrentStep] = useState(calculateStartingStep(initialData));
    const [completedSteps, setCompletedSteps] = useState<number[]>(calculateCompletedSteps(initialData));
    const [hotelData, setHotelData] = useState<Partial<HotelData>>(initialData || {
        propertyType: initialPropertyType || '',
        amenities: [],
        rooms: [],
        policies: undefined,
        photos: { propertyPhotos: [] },
        services: undefined
    });
    const [isPublishing, setIsPublishing] = useState(false);
    const { user } = useAuth();

    const steps: Step[] = [
        {
            id: 1,
            title: 'Property Type',
            description: 'What type of property are you listing?',
            component: PropertyTypeStep,
            completed: completedSteps.includes(1),
            required: true
        },
        {
            id: 2,
            title: hotelData.propertyType
                ? `${hotelData.propertyType} Details`
                : 'Property Details',
            description: 'Tell us about your property',
            component: PropertyDetailsStep,
            completed: completedSteps.includes(2),
            required: true
        },
        {
            id: 3,
            title: 'Location Details',
            description: 'Where is your property located?',
            component: LocationStep,
            completed: completedSteps.includes(3),
            required: true
        },
        {
            id: 4,
            title: 'Amenities & Features',
            description: 'What facilities do you offer?',
            component: AmenitiesStep,
            completed: completedSteps.includes(4),
            required: true
        },
        {
            id: 5,
            title: 'Room Types & Pricing',
            description: 'Configure your room types',
            component: RoomsStep,
            completed: completedSteps.includes(5),
            required: true
        },
        {
            id: 6,
            title: 'Policies & Rules',
            description: 'Set your property policies',
            component: PoliciesStep,
            completed: completedSteps.includes(6),
            required: true
        },
        {
            id: 7,
            title: 'Photos & Media',
            description: 'Showcase your property',
            component: PhotosStep,
            completed: completedSteps.includes(7),
            required: true
        },
        {
            id: 8,
            title: 'Additional Services',
            description: 'Extra services and accessibility',
            component: ServicesStep,
            completed: completedSteps.includes(8),
            required: false
        },
        {
            id: 9,
            title: 'Review & Publish',
            description: 'Review your listing before going live',
            component: ReviewStep,
            completed: completedSteps.includes(9),
            required: true
        }
    ];

    const getCurrentStepIcon = (stepId: number, size: number = 56) => {
        const isActive = currentStep === stepId;

        // For step 1, show the property type selection icon
        if (stepId === 1) {
            return <PropertyTypeIcon isSelected={isActive} size={size} />;
        }

        // For all other steps (2-9), show the premium 3D property vector
        const propertyType = hotelData.propertyType || 'hotel';
        return (
            <motion.div
                key={`${propertyType}-${stepId}`}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
            >
                <PremiumPropertyVector
                    propertyType={propertyType as any}
                    size={size * 1.8}
                />
            </motion.div>
        );
    };

    const handleStepComplete = (stepId: number, data: any) => {
        // Update hotel data
        setHotelData(prev => ({ ...prev, ...data }));

        // Mark step as completed
        if (!completedSteps.includes(stepId)) {
            setCompletedSteps([...completedSteps, stepId]);
        }

        // Special handling for Room Summary step (step 9)
        // If "addAnother" is true, go back to step 5 (Room Basic Info) to add another room
        if (stepId === 9 && data.addAnother) {
            setCurrentStep(5);
            return;
        }

        // Move to next step or complete
        if (stepId < steps.length) {
            setCurrentStep(stepId + 1);
        } else {
            // All steps completed
            onComplete?.({ ...hotelData, ...data } as HotelData);
        }
    };

    const handleSaveAndExit = () => {
        // Save current progress
        if (onComplete) {
            onComplete(hotelData);
        }
        // Exit to dashboard if handler provided, otherwise go back
        if (onSaveAndExit) {
            onSaveAndExit();
        } else {
            onBack();
        }
    };

    const handlePublish = async () => {
        console.log('🚀 handlePublish called');
        console.log('👤 User:', user);
        console.log('📦 Hotel Data:', hotelData);

        if (!user?.id) {
            console.error('❌ No user ID found - cannot publish');
            alert('Error: You must be logged in to publish. Please log in and try again.');
            return;
        }

        console.log('✅ User ID found:', user.id);
        setIsPublishing(true);

        try {
            console.log('📡 Calling hotelService.publishListing...');
            const result = await hotelService.publishListing(hotelData, user.id);
            console.log('📡 hotelService response:', result);

            if (result.success) {
                console.log('✅ Published successfully!', result.hotelId);
                alert(`Success! Hotel published with ID: ${result.hotelId}`);
                if (onComplete) onComplete(hotelData);
            } else {
                console.error('❌ Failed to publish:', result.error);
                alert(`Failed to publish: ${JSON.stringify(result.error)}`);
            }
        } catch (error) {
            console.error('❌ Publish error:', error);
            alert(`Error publishing hotel: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            console.log('🏁 Publishing complete, resetting state');
            setIsPublishing(false);
        }
    };

    const currentStepData = steps.find(step => step.id === currentStep);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Save and Exit Button - Top Left */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-4 py-3"
            >
                <Button
                    variant="ghost"
                    onClick={handleSaveAndExit}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group"
                >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-medium">Save & Exit</span>
                </Button>
            </motion.div>

            {/* Scrollable Step Content */}
            <div className="flex-1 overflow-y-auto pb-64 px-4 py-6">
                <AnimatePresence mode="wait">
                    {currentStepData && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="max-w-2xl mx-auto">
                                {/* Step Header */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: 0.1,
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15
                                        }}
                                        className="mb-4 flex justify-center"
                                    >
                                        {getCurrentStepIcon(currentStep, 72)}
                                    </motion.div>
                                    <motion.h1
                                        className="text-2xl font-semibold text-gray-900 mb-2"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {currentStepData.title}
                                    </motion.h1>
                                    <motion.p
                                        className="text-gray-600"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {currentStepData.description}
                                    </motion.p>
                                </div>

                                {/* Step Component */}
                                <currentStepData.component
                                    onComplete={(data: any) => handleStepComplete(currentStep, data)}
                                    isCompleted={completedSteps.includes(currentStep)}
                                    existingData={hotelData}
                                    onUpdate={(data: any) => {
                                        console.log('🏨 CompleteHotelListingFlow: onUpdate called with', data);
                                        const updatedData = { ...hotelData, ...data };
                                        console.log('🏨 CompleteHotelListingFlow: Updated hotelData', updatedData);
                                        console.log('🏨 CompleteHotelListingFlow: Coordinates:', updatedData.coordinates);
                                        setHotelData(updatedData);
                                    }}
                                    onBack={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
                                    // Props for ReviewStep
                                    data={hotelData}
                                    onEditStep={(stepId: number) => setCurrentStep(stepId)}
                                    onPublish={handlePublish}
                                    isPublishing={isPublishing}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fixed Bottom Navigation - Airbnb Style */}
            <AirbnbBottomNav
                currentStep={currentStep}
                totalSteps={steps.length}
                completedSteps={completedSteps.length}
                onBack={() => {
                    if (currentStep === 1) {
                        onBack(); // Exit to dashboard on first step
                    } else {
                        setCurrentStep(currentStep - 1); // Go to previous step
                    }
                }}
                onNext={() => {
                    const currentStepData = steps.find(s => s.id === currentStep);
                    // Manually trigger component validation/submission if needed
                    // For now, we assume step components update state and we check basic validity
                    // In a real app, we might need a ref to trigger submit on the child

                    // Temporary automatic progress for demo if data exists
                    if (currentStepData?.id === 1 && hotelData.propertyType) {
                        handleStepComplete(1, { propertyType: hotelData.propertyType });
                    } else if (currentStepData?.id === 2 && hotelData.hotelName) {
                        handleStepComplete(2, { hotelName: hotelData.hotelName });
                    } else if (currentStepData?.id === 3 && hotelData.coordinates) {
                        handleStepComplete(3, { coordinates: hotelData.coordinates });
                    } else if (currentStepData?.id === 4 && hotelData.amenities && hotelData.amenities.length > 0) {
                        handleStepComplete(4, { amenities: hotelData.amenities });
                    } else if (currentStep < steps.length) {
                        // For placeholder steps
                        setCurrentStep(currentStep + 1);
                    }
                }}
                showBack={true}
                showNext={currentStep < steps.length}
                backLabel="Back"
                nextLabel={currentStep === steps.length ? 'Publish' : 'Next'}
                nextDisabled={
                    (currentStep === 1 && !hotelData.propertyType) ||
                    (currentStep === 2 && (!hotelData.hotelName || !hotelData.description || !hotelData.contactEmail)) ||
                    (currentStep === 3 && !hotelData.coordinates) ||
                    (currentStep === 4 && (!hotelData.amenities || hotelData.amenities.length === 0)) ||
                    (currentStep === 5 && (!hotelData.rooms || hotelData.rooms.length === 0)) ||
                    (currentStep === 6 && !hotelData.policies) ||
                    (currentStep === 7 && (!hotelData.photos?.propertyPhotos || hotelData.photos.propertyPhotos.length < 5))
                }
            />
        </div>
    );
}
