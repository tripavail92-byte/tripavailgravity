import { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedPropertyTypeIcons } from '../../assets/modern/AnimatedPropertyTypeIcons';
import type { StepData } from '../CompleteHotelListingFlow';

interface PropertyTypeStepProps {
    onComplete: (data: StepData) => void;
    existingData?: StepData;
    onUpdate: (data: StepData) => void;
    onBack: () => void;
}

export function PropertyTypeStep({ onComplete, existingData, onUpdate, onBack }: PropertyTypeStepProps) {
    const [selectedType, setSelectedType] = useState(existingData?.propertyType || '');

    const handleTypeSelect = (type: string) => {
        setSelectedType(type);
        onUpdate({ propertyType: type });
    };

    const handleContinue = () => {
        if (selectedType) {
            onComplete({ propertyType: selectedType });
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                    Select your property type to get started
                </label>
                <AnimatedPropertyTypeIcons
                    selectedType={selectedType}
                    onTypeSelect={handleTypeSelect}
                    className="mb-6"
                />
            </motion.div>

            {/* Info Card */}
            {selectedType && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-purple-50 to-cyan-50 p-4 rounded-xl border border-purple-100"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">✓</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                                {selectedType} Selected
                            </h4>
                            <p className="text-sm text-gray-600">
                                Perfect! Next, we'll gather specific details about your {selectedType.toLowerCase()}.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

        </div>
    );
}
