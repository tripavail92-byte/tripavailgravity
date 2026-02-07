import { useState } from 'react';
import { X, Plus, XCircle, Plane, Utensils, Camera, ShoppingBag, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StepData } from '../../types';
import { cn } from '@/lib/utils';

interface ExclusionsStepProps {
    onComplete: (data: StepData) => void;
    onUpdate: (data: StepData) => void;
    existingData?: StepData;
    onBack: () => void;
}

const PRESET_EXCLUSIONS = [
    {
        id: 'travel',
        name: 'Travel & Transport',
        icon: Plane,
        items: [
            'International Flights',
            'Visa Fees',
            'Airport Taxes',
            'Local Transportation',
            'Parking Fees',
            'Fuel Charges'
        ]
    },
    {
        id: 'meals',
        name: 'Additional Meals',
        icon: Utensils,
        items: [
            'Meals Not Mentioned',
            'Alcoholic Beverages',
            'Room Service',
            'Mini Bar',
            'Special Dietary Meals',
            'Snacks & Drinks'
        ]
    },
    {
        id: 'activities',
        name: 'Optional Activities',
        icon: Camera,
        items: [
            'Optional Tours',
            'Additional Excursions',
            'Adventure Activities',
            'Spa Services',
            'Water Sports',
            'Photography Services'
        ]
    },
    {
        id: 'personal',
        name: 'Personal Expenses',
        icon: ShoppingBag,
        items: [
            'Personal Expenses',
            'Shopping',
            'Laundry',
            'Telephone Calls',
            'Tips & Gratuities',
            'Travel Insurance',
            'Medical Expenses'
        ]
    }
];

export function ExclusionsStep({ onComplete, onUpdate, existingData, onBack }: ExclusionsStepProps) {
    const [selectedExclusions, setSelectedExclusions] = useState<string[]>(
        (existingData?.exclusions as string[]) || []
    );
    const [customExclusion, setCustomExclusion] = useState('');

    const toggleExclusion = (item: string) => {
        setSelectedExclusions(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const addCustomExclusion = () => {
        if (customExclusion.trim() && !selectedExclusions.includes(customExclusion.trim())) {
            setSelectedExclusions(prev => [...prev, customExclusion.trim()]);
            setCustomExclusion('');
        }
    };

    const removeExclusion = (item: string) => {
        setSelectedExclusions(prev => prev.filter(i => i !== item));
    };

    const handleContinue = () => {
        onComplete({ exclusions: selectedExclusions });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What's NOT Included?</h2>
                <p className="text-gray-600">Select items that are NOT included in your package</p>
            </div>

            {/* Info Banner */}
            <Card className="p-4 bg-info/5 border-info/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">Be transparent about exclusions</p>
                        <p>Clear communication about what's NOT included helps set proper expectations and builds trust with travelers.</p>
                    </div>
                </div>
            </Card>

            {/* Selected Exclusions Summary */}
            {selectedExclusions.length > 0 && (
                <Card className="p-6 bg-error/5 border-error/20">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-error" />
                        <h3 className="font-semibold text-gray-900">
                            {selectedExclusions.length} exclusion{selectedExclusions.length !== 1 ? 's' : ''} selected
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedExclusions.map(item => (
                            <Badge
                                key={item}
                                variant="outline"
                                className="bg-white border-error/30 text-gray-700 pr-1"
                            >
                                {item}
                                <button
                                    onClick={() => removeExclusion(item)}
                                    className="ml-2 rounded-full hover:bg-error/10 p-0.5 transition-colors"
                                >
                                    <X size={14} className="text-gray-500 hover:text-error" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </Card>
            )}

            {/* Preset Categories */}
            <div className="space-y-4">
                {PRESET_EXCLUSIONS.map(category => {
                    const IconComponent = category.icon;
                    const selectedCount = category.items.filter(item => selectedExclusions.includes(item)).length;

                    return (
                        <Card key={category.id} className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                                    <IconComponent size={20} className="text-error" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                    {selectedCount > 0 && (
                                        <p className="text-sm text-error">{selectedCount} excluded</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {category.items.map(item => {
                                    const isSelected = selectedExclusions.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            onClick={() => toggleExclusion(item)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                                                isSelected
                                                    ? "bg-error/10 text-error border-2 border-error/30"
                                                    : "bg-gray-50 text-gray-700 border-2 border-transparent hover:border-gray-200 hover:bg-gray-100"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected && <XCircle size={16} className="flex-shrink-0" />}
                                                <span className="truncate">{item}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Custom Exclusions */}
            <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Add Custom Exclusion</h3>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g., Entrance fees to monuments, Professional photography..."
                        value={customExclusion}
                        onChange={(e) => setCustomExclusion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomExclusion()}
                        className="flex-1"
                    />
                    <Button
                        onClick={addCustomExclusion}
                        disabled={!customExclusion.trim()}
                        variant="outline"
                        className="flex-shrink-0"
                    >
                        <Plus size={18} className="mr-1" />
                        Add
                    </Button>
                </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={handleContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
}
