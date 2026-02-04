import { motion } from 'motion/react';
import { useState } from 'react';
import { PremiumPropertyVector } from '@/features/hotel-listing/assets/PremiumPropertyVectors';

interface PropertyTypeIconProps {
    type: 'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel';
    isSelected?: boolean;
    isHovered?: boolean;
    size?: number;
    className?: string;
}

export function PropertyTypeIcon({ type, isSelected = false, isHovered = false, size = 48, className = "" }: PropertyTypeIconProps) {
    // Use the premium 3D vector for all property types
    return (
        <motion.div
            className={className}
            animate={isSelected || isHovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <PremiumPropertyVector propertyType={type} size={size} />
        </motion.div>
    );
}

export interface AnimatedPropertyTypeIconsProps {
    selectedType?: string;
    onTypeSelect?: (type: string) => void;
    className?: string;
}

export function AnimatedPropertyTypeIcons({ selectedType, onTypeSelect, className = "" }: AnimatedPropertyTypeIconsProps) {
    const [hoveredType, setHoveredType] = useState<string | null>(null);

    const propertyTypes = [
        { id: 'hotel', name: 'Hotel', description: 'Traditional hotel with multiple rooms' },
        { id: 'boutique', name: 'Boutique Hotel', description: 'Unique, stylish accommodation' },
        { id: 'resort', name: 'Resort', description: 'Full-service vacation destination' },
        { id: 'motel', name: 'Motel', description: 'Motor hotel for travelers' },
        { id: 'lodge', name: 'Lodge', description: 'Rustic or countryside accommodation' },
        { id: 'inn', name: 'Inn', description: 'Small, cozy accommodation' },
        { id: 'guesthouse', name: 'Guest House', description: 'Home-like accommodation' },
        { id: 'hostel', name: 'Hostel', description: 'Budget-friendly shared accommodation' }
    ];

    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            {propertyTypes.map((type) => (
                <motion.button
                    key={type.id}
                    onClick={() => onTypeSelect?.(type.id)}
                    onHoverStart={() => setHoveredType(type.id)}
                    onHoverEnd={() => setHoveredType(null)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 ${selectedType === type.id
                            ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/30 dark:to-cyan-950/30 shadow-xl'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg'
                        }`}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex flex-col items-center space-y-3">
                        {/* 3D Premium Vector Icon */}
                        <motion.div
                            animate={selectedType === type.id ? {
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            } : {}}
                            transition={{ duration: 0.6 }}
                        >
                            <PropertyTypeIcon
                                type={type.id as any}
                                isSelected={selectedType === type.id}
                                isHovered={hoveredType === type.id}
                                size={64}
                            />
                        </motion.div>

                        <div className="text-center w-full">
                            <h3 className={`font-semibold text-sm transition-colors ${selectedType === type.id
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                {type.name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {type.description}
                            </p>
                        </div>

                        {/* Selection Indicator */}
                        {selectedType === type.id && (
                            <motion.div
                                className="w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
