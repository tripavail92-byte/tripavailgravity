import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AirbnbBottomNav } from '@/features/hotel-listing/components/ui/AirbnbBottomNav';
import { hotelManagerService, HotelManagerOnboardingData } from '@/features/hotel-manager/services/hotelManagerService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassProgress } from '@/components/ui/glass/GlassProgress';

import { WelcomeStep } from './components/WelcomeStep';
import { IdentityStep } from './components/IdentityStep';
import { BusinessLicenseStep } from './components/BusinessLicenseStep';
import { PropertyOwnershipStep } from './components/PropertyOwnershipStep';
import { BankDetailsStep } from './components/BankDetailsStep';
import { CompletionStep } from './components/CompletionStep';

const STEPS = [
    { id: 'welcome', title: 'Welcome', component: WelcomeStep },
    { id: 'identity', title: 'Identity', component: IdentityStep },
    { id: 'business', title: 'Business', component: BusinessLicenseStep },
    { id: 'property', title: 'Property', component: PropertyOwnershipStep },
    { id: 'bank', title: 'Payments', component: BankDetailsStep },
    { id: 'completion', title: 'Finish', component: CompletionStep },
];

export default function HotelManagerSetupPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [setupData, setSetupData] = useState<Partial<HotelManagerOnboardingData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.setAttribute('data-role', 'hotel_manager');
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                const data = await hotelManagerService.getOnboardingData(user.id);
                if (data) setSetupData(data);
            } catch (error) {
                console.error('Error loading onboarding data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    const saveProgress = useCallback(async (dataToSave: any, isFinal: boolean = false) => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await hotelManagerService.saveOnboardingData(user.id, dataToSave, isFinal);
            if (isFinal) toast.success('Signup complete!');
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
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else navigate('/manager/dashboard');
    };

    const handleSaveAndExit = async () => {
        await saveProgress(setupData, false);
        toast.success('Progress saved');
        navigate('/manager/dashboard');
    };

    const updateData = (data: any) => {
        setSetupData((prev: any) => ({ ...prev, ...data }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const CurrentStepComponent = STEPS[currentStep].component as any;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-5">
                <div className="max-w-content mx-auto flex items-center justify-between">
                    <div className="flex flex-col gap-1 flex-1 max-w-xs">
                        <div className="flex items-center gap-2">
                             <h1 className="font-black text-gray-900 tracking-tighter text-xl uppercase italic">Hotel Setup</h1>
                             <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">STEP {currentStep + 1}</span>
                        </div>
                        <GlassProgress currentStep={currentStep + 1} totalSteps={STEPS.length} className="h-1.5" />
                    </div>

                    {currentStep < STEPS.length - 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-gray-200 hover:border-primary hover:text-primary font-bold shadow-sm h-10 px-5"
                            onClick={handleSaveAndExit}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save & Exit
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 px-6 py-12 max-w-2xl mx-auto w-full">
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
