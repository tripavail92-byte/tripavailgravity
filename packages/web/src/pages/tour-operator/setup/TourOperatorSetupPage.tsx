import { useState } from 'react';
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
    const [setupData, setSetupData] = useState<any>({});
    const navigate = useNavigate();

    const handleNext = () => {
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

    const updateData = (data: any) => {
        setSetupData((prev: any) => ({ ...prev, ...data }));
    };

    const CurrentStepComponent = STEPS[currentStep].component;

    return (
        <div className="min-h-screen bg-white flex flex-col">
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
                nextLabel={currentStep === STEPS.length - 2 ? 'Finish Setup' : 'Next'}
            />
        </div>
    );
}
