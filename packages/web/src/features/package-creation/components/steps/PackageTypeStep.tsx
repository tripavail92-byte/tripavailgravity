
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PackageType, StepData } from '../../types';
import { PACKAGE_TYPE_CONFIG } from '../../assets/PackageTypeIcons';

interface PackageTypeStepProps {
    onComplete: (data: StepData) => void;
    existingData?: StepData;
    onUpdate: (data: StepData) => void;
    onBack: () => void;
}

export function PackageTypeStep({ onComplete, existingData, onUpdate }: PackageTypeStepProps) {
    const selectedType = existingData?.packageType;

    const handleSelect = (type: PackageType) => {
        onUpdate({ ...existingData, packageType: type });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Package Type</h2>
                <p className="text-gray-600 mt-2">Select the type of package that best represents your offering.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(PACKAGE_TYPE_CONFIG).map(([key, config]) => {
                    const type = key as PackageType;
                    const isSelected = selectedType === type;
                    const Icon = config.icon;

                    return (
                        <motion.button
                            key={type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(type)}
                            className={cn(
                                "relative p-6 rounded-xl border-2 text-left transition-all duration-200 h-full flex flex-col",
                                isSelected
                                    ? `border-${config.color.split('-')[1]}-500 ${config.bg} shadow-md`
                                    : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
                            )}
                        >
                            {isSelected && (
                                <div className={cn(
                                    "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white",
                                    config.color.replace('text-', 'bg-')
                                )}>
                                    <Check className="w-4 h-4" />
                                </div>
                            )}

                            <div className="flex justify-center mb-4 h-24 items-center">
                                {config.vector ? (
                                    <config.vector
                                        isActive={isSelected}
                                        size={96}
                                        className="w-24 h-24"
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center",
                                        isSelected ? "bg-white" : config.bg
                                    )}>
                                        <Icon className={cn("w-6 h-6", config.color)} />
                                    </div>
                                )}
                            </div>

                            <h3 className={cn("font-semibold text-lg mb-1", isSelected ? "text-gray-900" : "text-gray-700")}>
                                {config.label}
                            </h3>

                            <p className="text-sm text-gray-500 leading-relaxed">
                                {config.description}
                            </p>
                        </motion.button>
                    );
                })}
            </div>

            {selectedType && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mt-8"
                >
                    <button
                        onClick={() => onComplete({ packageType: selectedType })}
                        className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Continue with {PACKAGE_TYPE_CONFIG[selectedType].label}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
