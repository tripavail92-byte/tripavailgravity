
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { PackageTypeStep } from './steps/PackageTypeStep';
import { BasicsStep } from './steps/BasicsStep';
import { PackageData, StepData } from '../types';

// Placeholder for future steps
const PlaceholderStep = () => <div className="text-center py-12 text-gray-500">Step content coming soon...</div>;

const STEPS = [
    { id: 1, title: 'Package Type', component: PackageTypeStep },
    { id: 2, title: 'Basics', component: BasicsStep },
    { id: 3, title: 'Media', component: PlaceholderStep },
    { id: 4, title: 'Highlights', component: PlaceholderStep },
    { id: 5, title: 'Inclusions', component: PlaceholderStep },
    { id: 6, title: 'Exclusions', component: PlaceholderStep },
    { id: 7, title: 'Pricing', component: PlaceholderStep },
    { id: 8, title: 'Calendar', component: PlaceholderStep },
    { id: 9, title: 'Policies', component: PlaceholderStep },
    { id: 10, title: 'Review', component: PlaceholderStep },
];

export function CompletePackageCreationFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const [packageData, setPackageData] = useState<PackageData>({});

    const handleStepComplete = (stepData: StepData) => {
        setPackageData(prev => ({ ...prev, ...stepData }));
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            console.log('Package Creation Completed', packageData);
            // Handle completion (submit to backend)
        }
    };

    const handleStepUpdate = (stepData: StepData) => {
        setPackageData(prev => ({ ...prev, ...stepData }));
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const CurrentStepComponent = STEPS[currentStep - 1].component;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header / Progress */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Create New Package
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
                        </span>
                    </h1>
                    <div className="text-sm text-gray-500">
                        Saved 2 mins ago
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CurrentStepComponent
                            onComplete={handleStepComplete}
                            onUpdate={handleStepUpdate}
                            existingData={packageData}
                            onBack={handleBack}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation (if needed outside steps) */}
            <div className="mt-8 flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    Back
                </Button>
                {/* Next button logic is usually inside the step for validation purposes */}
            </div>
        </div>
    );
}
