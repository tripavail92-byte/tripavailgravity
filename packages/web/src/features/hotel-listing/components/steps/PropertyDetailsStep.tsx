import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PropertyDescriptionAI } from '../ui/PropertyDescriptionAI';
import type { StepData } from '../CompleteHotelListingFlow';

interface PropertyDetailsStepProps {
    onComplete: (data: StepData) => void;
    existingData?: StepData;
    onUpdate: (data: StepData) => void;
    onBack: () => void;
}

export function PropertyDetailsStep({ onComplete, existingData, onUpdate, onBack }: PropertyDetailsStepProps) {
    const [formData, setFormData] = useState({
        hotelName: existingData?.hotelName || '',
        description: existingData?.description || '',
        contactEmail: existingData?.contactEmail || '',
        contactPhone: existingData?.contactPhone || ''
    });

    const [showAISuggestions, setShowAISuggestions] = useState(false);

    const propertyType = existingData?.propertyType || 'Property';

    const handleInputChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onUpdate(newData);
    };

    const handleAISuggestionSelect = (suggestion: string) => {
        handleInputChange('description', suggestion);
        setShowAISuggestions(false);
    };

    const handleContinue = () => {
        if (formData.hotelName && formData.description && formData.contactEmail) {
            onComplete(formData);
        }
    };

    const isValid = formData.hotelName && formData.description && formData.contactEmail;

    return (
        <div className="space-y-6">
            {/* Property Type Indicator - Black Airbnb Style */}
            <div className="bg-black p-4 rounded-lg -mx-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-black text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                        Listing a <span className="font-bold">{propertyType}</span>
                    </span>
                </div>
            </div>

            {/* Property Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {propertyType} Name *
                </label>
                <Input
                    type="text"
                    placeholder={`Enter your ${propertyType.toLowerCase()} name`}
                    value={formData.hotelName}
                    onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Example: Sunset View {propertyType}, Paradise {propertyType}
                </p>
            </div>

            {/* Description with AI Assistant */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        {propertyType} Description *
                    </label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAISuggestions(!showAISuggestions)}
                        className="text-xs text-purple-600 hover:text-purple-700 h-auto p-0"
                    >
                        <motion.div
                            animate={{ rotate: showAISuggestions ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            ✨
                        </motion.div>
                        AI Assistant
                    </Button>
                </div>

                <Textarea
                    placeholder={`Describe your ${propertyType.toLowerCase()}, its unique features, and what makes it special...`}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full min-h-[120px] mb-2"
                />
                <p className="text-xs text-gray-500 mb-3">
                    {formData.description.length}/500 characters
                </p>

                {/* AI Suggestions */}
                <AnimatePresence>
                    {showAISuggestions && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PropertyDescriptionAI
                                propertyType={propertyType}
                                hotelName={formData.hotelName}
                                onSuggestionSelect={handleAISuggestionSelect}
                                className="mb-4"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email *
                    </label>
                    <Input
                        type="email"
                        placeholder="contact@yourhotel.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                    </label>
                    <Input
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                </div>
            </div>

        </div>
    );
}
