
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Users, Percent, Info, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tour } from '@/features/tour-operator/services/tourService';

interface TourPricingStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
    onBack: () => void;
}

const COMMON_INCLUDES = [
    'Professional Tour Guide',
    'Transportation',
    'Entrance Fees',
    'Meals (as specified)',
    'Accommodation',
    'Travel Insurance',
    'Photography',
    'Local Taxes'
];

const COMMON_EXCLUDES = [
    'Personal Expenses',
    'Tips and Gratuities',
    'International Flights',
    'Visa Fees',
    'Optional Activities',
    'Alcoholic Beverages',
    'Shopping',
    'Emergency Expenses'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED'];

export function TourPricingStep({ data, onUpdate, onNext, onBack }: TourPricingStepProps) {
    const [pricingTiers, setPricingTiers] = useState(data.pricing_tiers || []);

    const handleInputChange = (field: keyof Tour, value: any) => {
        onUpdate({ [field]: value });
    };

    const addPricingTier = () => {
        const newTier = {
            id: Date.now().toString(),
            name: `Group ${pricingTiers.length + 1}`,
            minPeople: pricingTiers.length === 0 ? 1 : 5,
            maxPeople: pricingTiers.length === 0 ? 4 : 10,
            pricePerPerson: data.price || 0
        };
        const updated = [...pricingTiers, newTier];
        setPricingTiers(updated);
        onUpdate({ pricing_tiers: updated });
    };

    const updatePricingTier = (id: string, field: string, value: any) => {
        const updated = pricingTiers.map(t => t.id === id ? { ...t, [field]: value } : t);
        setPricingTiers(updated);
        onUpdate({ pricing_tiers: updated });
    };

    const removePricingTier = (id: string) => {
        const updated = pricingTiers.filter(t => t.id !== id);
        setPricingTiers(updated);
        onUpdate({ pricing_tiers: updated });
    };

    const toggleInclude = (item: string) => {
        const current = data.inclusions || [];
        const next = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        onUpdate({ inclusions: next });
    };

    const toggleExclude = (item: string) => {
        const current = data.exclusions || [];
        const next = current.includes(item)
            ? current.filter(e => e !== item)
            : [...current, item];
        onUpdate({ exclusions: next });
    };

    return (
        <div className="space-y-6">
            {/* Legend Header */}
            <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Tour Pricing</h2>
                        <p className="text-white/80 text-sm">Set competitive pricing and booking policies for your tour.</p>
                    </div>
                </div>
            </Card>

            {/* Base Pricing */}
            <Card className="p-6 border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" /> Base Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Base Price Per Person *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{data.currency || '$'}</span>
                            <Input
                                type="number"
                                className="pl-12"
                                placeholder="0.00"
                                value={data.price || ''}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Currency</label>
                        <Select value={data.currency || 'USD'} onValueChange={(v) => handleInputChange('currency', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Group Discounts */}
            <Card className="p-6 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" /> Group Discounts
                        </h3>
                        <p className="text-sm text-gray-500">Offer lower rates for larger groups</p>
                    </div>
                    <Switch
                        checked={data.group_discounts}
                        onCheckedChange={(v) => handleInputChange('group_discounts', v)}
                    />
                </div>

                <AnimatePresence>
                    {data.group_discounts && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-4"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Pricing Tiers</span>
                                <Button size="sm" variant="outline" onClick={addPricingTier} className="text-xs h-8">
                                    <Plus className="w-3 h-3 mr-1" /> Add Tier
                                </Button>
                            </div>

                            {pricingTiers.map((tier) => (
                                <div key={tier.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 items-end">
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Tier Name</label>
                                        <Input
                                            value={tier.name}
                                            onChange={(e) => updatePricingTier(tier.id, 'name', e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Min/Max Pax</label>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                value={tier.minPeople}
                                                onChange={(e) => updatePricingTier(tier.id, 'minPeople', parseInt(e.target.value))}
                                                className="h-9 text-sm px-2"
                                            />
                                            <span className="text-gray-300">-</span>
                                            <Input
                                                type="number"
                                                value={tier.maxPeople}
                                                onChange={(e) => updatePricingTier(tier.id, 'maxPeople', parseInt(e.target.value))}
                                                className="h-9 text-sm px-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400">Price</label>
                                        <Input
                                            type="number"
                                            value={tier.pricePerPerson}
                                            onChange={(e) => updatePricingTier(tier.id, 'pricePerPerson', parseFloat(e.target.value))}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => removePricingTier(tier.id)} className="text-gray-400 hover:text-destructive h-9 w-9">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Seasonal Pricing */}
            <Card className="p-6 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Percent className="w-5 h-5 text-primary" /> Seasonal Pricing
                        </h3>
                        <p className="text-sm text-gray-500">Adjust multipliers for peak/off seasons</p>
                    </div>
                    <Switch
                        checked={data.seasonal_pricing}
                        onCheckedChange={(v) => handleInputChange('seasonal_pricing', v)}
                    />
                </div>

                <AnimatePresence>
                    {data.seasonal_pricing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden grid grid-cols-2 gap-4 mt-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Peak Multiplier</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={data.peak_season_multiplier || 1.2}
                                    onChange={(e) => handleInputChange('peak_season_multiplier', parseFloat(e.target.value))}
                                />
                                <p className="text-[10px] text-gray-400">e.g. 1.2 = 20% increase</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Off-Season Multiplier</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={data.off_season_multiplier || 0.8}
                                    onChange={(e) => handleInputChange('off_season_multiplier', parseFloat(e.target.value))}
                                />
                                <p className="text-[10px] text-gray-400">e.g. 0.8 = 20% decrease</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Booking Terms */}
            <Card className="p-6 border-gray-200">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" /> Booking Terms
                </h3>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-700">Require Deposit</label>
                            <p className="text-xs text-gray-500">Require partial payment upfront</p>
                        </div>
                        <Switch
                            checked={data.deposit_required}
                            onCheckedChange={(v) => handleInputChange('deposit_required', v)}
                        />
                    </div>

                    <AnimatePresence>
                        {data.deposit_required && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2"
                            >
                                <label className="text-sm font-medium text-gray-700">Deposit Percentage</label>
                                <Select
                                    value={String(data.deposit_percentage || 25)}
                                    onValueChange={(v) => handleInputChange('deposit_percentage', parseInt(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10% Deposit</SelectItem>
                                        <SelectItem value="25">25% Deposit</SelectItem>
                                        <SelectItem value="50">50% Deposit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Separator />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Cancellation Policy</label>
                        <Select
                            value={data.cancellation_policy || 'flexible'}
                            onValueChange={(v: any) => handleInputChange('cancellation_policy', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flexible">Flexible (Free cancellation 24h before)</SelectItem>
                                <SelectItem value="moderate">Moderate (Free cancellation 5 days before)</SelectItem>
                                <SelectItem value="strict">Strict (50% refund if cancelled 14 days before)</SelectItem>
                                <SelectItem value="non-refundable">Non-refundable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-gray-200">
                    <h3 className="text-sm font-bold text-success-dark mb-4 uppercase tracking-wider">What's Included</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {COMMON_INCLUDES.map((item) => (
                            <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${(data.inclusions || []).includes(item) ? 'bg-success border-success' : 'border-gray-300 bg-white group-hover:border-success/50'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={(data.inclusions || []).includes(item)}
                                        onChange={() => toggleInclude(item)}
                                    />
                                    {(data.inclusions || []).includes(item) && <Plus className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-gray-700">{item}</span>
                            </label>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 border-gray-200">
                    <h3 className="text-sm font-bold text-error-dark mb-4 uppercase tracking-wider">What's Excluded</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {COMMON_EXCLUDES.map((item) => (
                            <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${(data.exclusions || []).includes(item) ? 'bg-error border-error' : 'border-gray-300 bg-white group-hover:border-error/50'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={(data.exclusions || []).includes(item)}
                                        onChange={() => toggleExclude(item)}
                                    />
                                    {(data.exclusions || []).includes(item) && <Trash2 className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-sm text-gray-700">{item}</span>
                            </label>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <Button variant="outline" onClick={onBack} className="px-8">Back</Button>
                <Button onClick={onNext} className="bg-primary hover:bg-primary/90 text-white px-8">Next Step</Button>
            </div>
        </div>
    );
}
