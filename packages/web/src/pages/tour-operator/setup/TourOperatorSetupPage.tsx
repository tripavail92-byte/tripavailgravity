import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { WelcomeStep } from './components/WelcomeStep';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { ProfilePictureStep } from './components/ProfilePictureStep';
import { BusinessInfoStep } from './components/BusinessInfoStep';
import { ServicesStep } from './components/ServicesStep';
import { CoverageAreaStep } from './components/CoverageAreaStep';
import { PoliciesStep } from './components/PoliciesStep';
import { VerificationStep } from './components/VerificationStep';
import { CompletionStep } from './components/CompletionStep';
import { AirbnbBottomNav } from '@/features/hotel-listing/components/ui/AirbnbBottomNav';
import { tourOperatorService, TourOperatorOnboardingData } from '@/features/tour-operator/services/tourOperatorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
    { id: 'welcome', title: 'Welcome', component: WelcomeStep },
    { id: 'personal', title: 'Personal Info', component: PersonalInfoStep },
    { id: 'profile-pic', title: 'Profile Picture', component: ProfilePictureStep },
    { id: 'business', title: 'Business Info', component: BusinessInfoStep },
    { id: 'services', title: 'Tour Services', component: ServicesStep },
    { id: 'coverage', title: 'Coverage Area', component: CoverageAreaStep },
    { id: 'policies', title: 'Policies', component: PoliciesStep },
    { id: 'verification', title: 'Verification', component: VerificationStep },
    { id: 'completion', title: 'Complete', component: CompletionStep },
];

export default function TourOperatorSetupPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [setupData, setSetupData] = useState<Partial<TourOperatorOnboardingData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Load existing data on mount
    useEffect(() => {
        const loadExistingData = async () => {
            if (!user?.id) return;
            try {
                const data = await tourOperatorService.getOnboardingData(user.id);
                if (data) {
                    setSetupData(data);
                    // If setup is already completed, we might want to skip to the end or dashboard
                    // But for now, let the user review
                }
            } catch (error) {
                console.error('Error loading onboarding data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadExistingData();
    }, [user?.id]);

    const saveProgress = useCallback(async (dataToSave: any, isFinal: boolean = false) => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await tourOperatorService.saveOnboardingData(user.id, dataToSave, isFinal);
            if (isFinal) {
                toast.success('Onboarding completed!');
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            toast.error('Failed to save progress');
        } finally {
            setIsSaving(false);
        }
    }, [user?.id]);

    const handleNext = async () => {
        const isFinal = currentStep === STEPS.length - 2;
        await saveProgress(setupData, isFinal);

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            navigate('/operator/dashboard');
        }
    };

    const handleSaveAndExit = async () => {
        await saveProgress(setupData, false);
        toast.success('Progress saved');
        navigate('/operator/dashboard');
    };

    const updateData = (data: any) => {
        setSetupData((prev: any) => ({ ...prev, ...data }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-gray-500 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const CurrentStepComponent = STEPS[currentStep].component;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Bar for Save & Exit */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                            T
                        </div>
                        <h1 className="font-bold text-gray-900 tracking-tight">Operator Setup</h1>
                    </div>

                    {currentStep < STEPS.length - 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-gray-200 hover:border-primary hover:text-primary font-bold shadow-sm h-9"
                            onClick={handleSaveAndExit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save & Exit
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 px-4 py-8 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CurrentStepComponent
                            onNext={handleNext}
                            onUpdate={updateData}
                            data={setupData}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <AirbnbBottomNav
                currentStep={currentStep + 1}
                totalSteps={STEPS.length}
                completedSteps={currentStep}
                onBack={handleBack}
                onNext={handleNext}
                showBack={true}
                showNext={currentStep < STEPS.length - 1}
                nextDisabled={isSaving}
                nextLabel={currentStep === STEPS.length - 2 ? 'Finish Setup' : 'Next'}
            />
        </div>
    );
}
