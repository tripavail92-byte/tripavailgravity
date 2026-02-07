
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Sparkles, ChevronRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
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

    // Auto-suggestions based on package type for description
    const getDescriptionSuggestions = (packageType?: PackageType) => {
        const suggestionMap: { [key: string]: string[] } = {
            [PackageType.WEEKEND_GETAWAY]: [
                "Escape the ordinary with a perfect weekend retreat featuring luxury amenities and relaxation. Unwind in style with our curated weekend experience designed for maximum comfort and enjoyment. Your ideal weekend getaway awaits with premium accommodations and memorable experiences.",
                "Experience the ultimate weekend escape with luxurious accommodations, world-class dining, and rejuvenating spa treatments. Perfect for couples or friends looking to recharge and create lasting memories in a serene setting."
            ],
            [PackageType.ROMANTIC_ESCAPE]: [
                "Rekindle romance with an intimate escape featuring candlelit dinners and couples' spa treatments. Create unforgettable memories with your loved one in our romantic sanctuary of luxury and intimacy. Celebrate love with enchanting experiences designed for couples seeking romance and connection.",
                "Ignite passion and romance with our exclusive couples' retreat. Enjoy private dining experiences, sunset views, couples massages, and luxurious suite accommodations designed to celebrate your love story."
            ],
            [PackageType.FAMILY_ADVENTURE]: [
                "Adventure awaits the whole family with exciting activities, comfortable accommodations, and endless fun. Create lasting family memories with our specially curated experiences for guests of all ages. Perfect family getaway featuring kid-friendly amenities and entertainment for everyone to enjoy.",
                "Bring the whole family for an unforgettable experience with activities for all ages. From kids' clubs to family suites, we've thought of everything to make your family vacation stress-free and fun."
            ],
            [PackageType.BUSINESS_ELITE]: [
                "Elevate your business travel with premium accommodations and professional amenities for success. Experience seamless business hospitality with executive services and comfortable meeting spaces. Where business meets luxury - premium corporate packages designed for the discerning professional.",
                "Maximize productivity and comfort with our business traveler package. Features include high-speed WiFi, executive lounge access, meeting room credits, and a dedicated workspace in your suite."
            ],
            [PackageType.ADVENTURE_PACKAGE]: [
                "Unleash your adventurous spirit with thrilling outdoor experiences and comfortable base camp accommodations. Epic adventures await with guided excursions, equipment rentals, and cozy mountain lodge comfort. For thrill-seekers and nature lovers - your gateway to unforgettable outdoor adventures.",
                "Feed your adventurous soul with hiking, rock climbing, kayaking, and more. All equipment and experienced guides included, with comfortable accommodations to rest after your exciting day."
            ],
            [PackageType.CULINARY_JOURNEY]: [
                "Embark on a gastronomic journey with world-class cuisine, wine tastings, and culinary masterclasses. Savor exceptional flavors with our chef-curated dining experiences and gourmet adventures. A feast for all senses featuring artisanal cuisine, premium ingredients, and culinary excellence.",
                "Indulge in a culinary adventure featuring multi-course tasting menus, sommelier-led wine pairings, cooking classes with our executive chef, and exclusive access to local food markets."
            ],
            [PackageType.WELLNESS_RETREAT]: [
                "Rejuvenate your mind, body, and soul with holistic wellness treatments and serene accommodations. Find your inner peace with transformative wellness experiences in a tranquil sanctuary setting. Restore balance and vitality with our comprehensive wellness retreat featuring spa treatments and mindfulness.",
                "Discover true relaxation with daily yoga sessions, meditation classes, therapeutic massages, organic wellness cuisine, and access to our state-of-the-art spa facilities."
            ],
            [PackageType.LUXURY_EXPERIENCE]: [
                "Indulge in unparalleled luxury with exclusive VIP services, premium amenities, and world-class hospitality. Experience the pinnacle of hospitality with bespoke services and ultra-luxury accommodations. Where opulence meets excellence - an exclusive experience crafted for the most discerning guests.",
                "Experience absolute luxury with butler service, private transfers, Michelin-star dining, premium suite accommodations, and personalized concierge attention to every detail."
            ],
            [PackageType.CUSTOM]: [
                "Create your own unique experience tailored exactly to your preferences. Select from our premium amenities and services to design the perfect stay that meets directly to your specific needs and desires.",
                "A fully customizable package allowing you to mix and match accommodations, dining, and activities for a truly personalized stay."
            ]
        };
        return packageType ? (suggestionMap[packageType] || []) : [];
    };

    const titleSuggestions = getTitleSuggestions(existingData?.packageType);
    const descriptionSuggestions = getDescriptionSuggestions(existingData?.packageType);

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateSuggestion = () => {
        setIsGenerating(true);
        // Simulate AI generation delay
        setTimeout(() => {
            if (descriptionSuggestions.length > 0) {
                const randomSuggestion = descriptionSuggestions[Math.floor(Math.random() * descriptionSuggestions.length)];
                setDescription(randomSuggestion);
            }
            setIsGenerating(false);
        }, 800);
    };

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
                            showValidation && !isHotelValid && "border-error bg-error-foreground focus:border-error focus:ring-error"
                        )}
                    />
                    {showValidation && !isHotelValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isHotelValid && (
                    <p className="text-sm text-error pl-1">Hotel name is required (min 2 chars)</p>
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
                            showValidation && !isTitleValid && "border-error bg-error-foreground focus:border-error focus:ring-error"
                        )}
                    />
                    {showValidation && !isTitleValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isTitleValid && (
                    <p className="text-sm text-error pl-1">Package title is required (min 5 chars)</p>
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
                                        className="group relative px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-full hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md text-left flex items-center gap-2"
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                        {suggestion}
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
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
                            showValidation && !isDurationValid && "border-error bg-error-foreground focus:border-error focus:ring-error"
                        )}
                    />
                </div>
                {showValidation && !isDurationValid && (
                    <p className="text-sm text-error pl-1">Duration required</p>
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
                    <button
                        onClick={handleGenerateSuggestion}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                        {isGenerating ? 'Generating...' : 'AI Suggest'}
                    </button>
                    <div className="flex items-center gap-2">
                        {description.length >= 50 ? (
                            <div className="flex items-center gap-1 text-sm text-success font-medium">
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
                            showValidation && !isDescValid && "border-error bg-error-foreground focus:border-error focus:ring-error"
                        )}
                        maxLength={1000}
                    />
                    {showValidation && !isDescValid && (
                        <div className="absolute right-3 top-4 text-error">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    )}
                </div>
                {showValidation && !isDescValid && (
                    <p className="text-sm text-error pl-1">Description is required (min 50 chars)</p>
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
