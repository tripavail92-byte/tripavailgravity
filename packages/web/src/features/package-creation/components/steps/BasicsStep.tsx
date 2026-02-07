
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Sparkles, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepData, PackageType } from '../../types';

interface BasicsStepProps {
    onComplete: (data: StepData) => void;
    onUpdate: (data: StepData) => void;
    existingData?: StepData;
    onBack: () => void;
}

export function BasicsStep({ onComplete, onUpdate, existingData, onBack }: BasicsStepProps) {
    // Initialize state with existing data or defaults
    const [title, setTitle] = useState(existingData?.name || '');
    const [description, setDescription] = useState(existingData?.description || '');
    const [hotelName, setHotelName] = useState(existingData?.hotelName || 'Grand Vista Hotel'); // Default for now, ideally from context
    const [duration, setDuration] = useState(existingData?.durationDays?.toString() || '');

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    // Update parent state on changes
    useEffect(() => {
        onUpdate({
            ...existingData,
            name: title,
            description: description,
            hotelName: hotelName,
            durationDays: duration ? parseInt(duration) : undefined
        });
    }, [title, description, hotelName, duration, onUpdate, existingData]);

    // Auto-generate title suggestions based on package type
    const getTitleSuggestions = (packageType?: PackageType) => {
        const titleMap: { [key: string]: string[] } = {
            [PackageType.WEEKEND_GETAWAY]: [
                "Weekend Escape Package",
                "Perfect Weekend Getaway",
                "Weekend Bliss Retreat"
            ],
            [PackageType.ROMANTIC_ESCAPE]: [
                "Romance & Roses Package",
                "Intimate Couples Retreat",
                "Love Story Experience"
            ],
            [PackageType.FAMILY_ADVENTURE]: [
                "Family Fun Adventure",
                "Kids & Family Special",
                "Family Memories Package"
            ],
            [PackageType.BUSINESS_ELITE]: [
                "Executive Business Package",
                "Corporate Elite Stay",
                "Business Traveler Special"
            ],
            [PackageType.ADVENTURE_PACKAGE]: [
                "Adventure Seeker Package",
                "Outdoor Explorer Experience",
                "Thrill & Chill Combo"
            ],
            [PackageType.CULINARY_JOURNEY]: [
                "Gourmet Experience Package",
                "Culinary Journey Special",
                "Taste & Stay Experience"
            ],
            [PackageType.WELLNESS_RETREAT]: [
                "Wellness & Spa Retreat",
                "Mind Body Soul Package",
                "Rejuvenation Experience"
            ],
            [PackageType.LUXURY_EXPERIENCE]: [
                "Ultimate Luxury Experience",
                "VIP Elite Package",
                "Platinum Indulgence"
            ],
            [PackageType.CUSTOM]: [
                "Custom Package Deal",
                "Special Offer",
                "Exclusive Stay"
            ]
        };

        return packageType ? (titleMap[packageType] || titleMap[PackageType.WEEKEND_GETAWAY]) : [];
    };

    const titleSuggestions = getTitleSuggestions(existingData?.packageType);

    const handleTitleChange = (value: string) => setTitle(value);
    const handleDescriptionChange = (value: string) => setDescription(value);
    const handleHotelNameChange = (value: string) => setHotelName(value);
    const handleDurationChange = (value: string) => {
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setDuration(value);
        }
    };

    const validate = () => {
        const isTitleValid = title.trim().length >= 5;
        const isDescValid = description.trim().length >= 50;
        const isHotelValid = hotelName.trim().length >= 2;
        const isDurationValid = duration !== '' && parseInt(duration) > 0;

        return { isTitleValid, isDescValid, isHotelValid, isDurationValid };
    };

    const { isTitleValid, isDescValid, isHotelValid, isDurationValid } = validate();
    const isValid = isTitleValid && isDescValid && isHotelValid && isDurationValid;

    const handleContinue = () => {
        setShowValidation(true);
        if (isValid) {
            onComplete({
                ...existingData,
                name: title.trim(),
                description: description.trim(),
                hotelName: hotelName.trim(),
                durationDays: parseInt(duration)
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Package Basics
                </h1>
                <p className="text-gray-600 text-lg">
                    Set up the fundamental details of your package including title, description, and duration.
                </p>
            </motion.div>

            {/* Hotel/Property Name */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="space-y-3"
            >
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <label className="text-base font-medium text-gray-900">
                        Hotel/Property Name
                    </label>
                </div>

                <div className="relative">
                    <Input
                        value={hotelName}
                        onChange={(e) => handleHotelNameChange(e.target.value)}
                        onFocus={() => setFocusedField('hotelName')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Grand Vista Hotel"
                        className={cn(
                            "h-14 text-base transition-all duration-200 bg-white rounded-xl shadow-sm",
                            focusedField === 'hotelName' ? "border-black ring-1 ring-black shadow-md" : "border-gray-200 hover:border-gray-300",
                            showValidation && !isHotelValid && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                    />
                    {showValidation && !isHotelValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isHotelValid && (
                    <p className="text-sm text-red-500 pl-1">Hotel name is required (min 2 chars)</p>
                )}
            </motion.div>

            {/* Package Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-3"
            >
                <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-900">
                        Package Title
                    </label>
                    <span className={cn("text-sm transition-colors",
                        title.length > 60 ? "text-amber-600 font-medium" : "text-gray-400"
                    )}>
                        {title.length}/80
                    </span>
                </div>

                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onFocus={() => setFocusedField('title')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g., Romantic Sunset Getaway"
                        maxLength={80}
                        className={cn(
                            "h-14 text-base transition-all duration-200 bg-white rounded-xl shadow-sm",
                            focusedField === 'title' ? "border-black ring-1 ring-black shadow-md" : "border-gray-200 hover:border-gray-300",
                            showValidation && !isTitleValid && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                    />
                    {showValidation && !isTitleValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isTitleValid && (
                    <p className="text-sm text-red-500 pl-1">Package title is required (min 5 chars)</p>
                )}

                {/* Smart Suggestions */}
                <AnimatePresence>
                    {title.length === 0 && titleSuggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            <div className="flex items-center gap-1.5 text-sm text-purple-600 font-medium pl-1">
                                <Sparkles className="w-4 h-4" />
                                <span>Smart suggestions based on your selection</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {titleSuggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleTitleChange(suggestion)}
                                        className="group relative px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-full hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md text-left flex items-center gap-2"
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                        {suggestion}
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Duration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="space-y-3"
            >
                <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-900">
                        Duration (Nights)
                    </label>
                </div>

                <div className="relative w-32">
                    <Input
                        value={duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        onFocus={() => setFocusedField('duration')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g. 2"
                        className={cn(
                            "h-14 text-base transition-all duration-200 bg-white rounded-xl shadow-sm text-center",
                            focusedField === 'duration' ? "border-black ring-1 ring-black shadow-md" : "border-gray-200 hover:border-gray-300",
                            showValidation && !isDurationValid && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                    />
                </div>
                {showValidation && !isDurationValid && (
                    <p className="text-sm text-red-500 pl-1">Duration required</p>
                )}
            </motion.div>

            {/* Description */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-3"
            >
                <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-900">
                        Detailed Description
                    </label>
                    <div className="flex items-center gap-2">
                        {description.length >= 50 ? (
                            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Good length</span>
                            </div>
                        ) : (
                            <span className="text-sm text-amber-600 font-medium">
                                {50 - description.length} more characters needed
                            </span>
                        )}
                        <span className="text-sm text-gray-400">
                            {description.length}/1000
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <Textarea
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        onFocus={() => setFocusedField('description')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Describe your package in detail. What makes it special? What's included?"
                        className={cn(
                            "min-h-[180px] resize-none text-base transition-all duration-200 bg-white rounded-xl shadow-sm leading-relaxed",
                            focusedField === 'description' ? "border-black ring-1 ring-black shadow-md" : "border-gray-200 hover:border-gray-300",
                            showValidation && !isDescValid && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                        )}
                        maxLength={1000}
                    />
                    {showValidation && !isDescValid && (
                        <div className="absolute right-3 top-4 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isDescValid && (
                    <p className="text-sm text-red-500 pl-1">Description is required (min 50 chars)</p>
                )}
                <p className="text-sm text-gray-500 pl-1">
                    Use emotional language that resonates with your target audience.
                </p>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
                className="flex justify-between pt-8 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <button
                    onClick={onBack}
                    className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleContinue}
                    className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Continue
                </button>
            </motion.div>
        </div>
    );
}
