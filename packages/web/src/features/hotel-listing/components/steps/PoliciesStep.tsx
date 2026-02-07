import { useState } from 'react';
import { Clock, Shield, Home, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { StepData } from '../CompleteHotelListingFlow';

export interface PoliciesData {
    checkIn: string;
    checkOut: string;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
    customCancellationText?: string;
    houseRules: {
        petsAllowed: boolean;
        smokingAllowed: boolean;
        eventsAllowed: boolean;
        childrenAllowed: boolean;
        quietHoursStart?: string;
        quietHoursEnd?: string;
        additionalRules?: string;
    };
    guestRequirements: {
        minimumAge: number;
        idRequired: boolean;
        creditCardRequired: boolean;
    };
}

interface PoliciesStepProps {
    existingData?: { policies?: PoliciesData };
    onUpdate?: (data: StepData) => void;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}` };
});

const CANCELLATION_POLICIES = [
    { value: 'flexible', label: 'Flexible', description: 'Free cancellation up to 24 hours before check-in' },
    { value: 'moderate', label: 'Moderate', description: 'Free cancellation up to 5 days before check-in' },
    { value: 'strict', label: 'Strict', description: 'Free cancellation up to 14 days before check-in' },
    { value: 'non-refundable', label: 'Non-refundable', description: 'No refunds for cancellations' },
] as const;

export function PoliciesStep({ existingData, onUpdate }: PoliciesStepProps) {
    const [policies, setPolicies] = useState<PoliciesData>(existingData?.policies || {
        checkIn: '14:00',
        checkOut: '11:00',
        cancellationPolicy: 'flexible',
        houseRules: {
            petsAllowed: false,
            smokingAllowed: false,
            eventsAllowed: false,
            childrenAllowed: true,
        },
        guestRequirements: {
            minimumAge: 18,
            idRequired: true,
            creditCardRequired: true,
        }
    });

    const handleUpdate = (updates: Partial<PoliciesData>) => {
        const updated = { ...policies, ...updates };
        setPolicies(updated);
        if (onUpdate) {
            onUpdate({ policies: updated });
        }
    };

    const handleHouseRulesUpdate = (updates: Partial<PoliciesData['houseRules']>) => {
        handleUpdate({
            houseRules: { ...policies.houseRules, ...updates }
        });
    };

    const handleGuestRequirementsUpdate = (updates: Partial<PoliciesData['guestRequirements']>) => {
        handleUpdate({
            guestRequirements: { ...policies.guestRequirements, ...updates }
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Policies & Rules</h2>
                <p className="text-gray-600 mt-1">Set your booking policies and house rules</p>
            </div>

            {/* Check-in/Check-out Times */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                        <Clock size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Check-in & Check-out Times</h3>
                        <p className="text-sm text-gray-600">Set your standard arrival and departure times</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-in Time
                        </label>
                        <select
                            value={policies.checkIn}
                            onChange={(e) => handleUpdate({ checkIn: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {TIME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-out Time
                        </label>
                        <select
                            value={policies.checkOut}
                            onChange={(e) => handleUpdate({ checkOut: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {TIME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Cancellation Policy */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Cancellation Policy</h3>
                        <p className="text-sm text-gray-600">Choose how flexible you want to be with cancellations</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {CANCELLATION_POLICIES.map((policy) => (
                        <Button
                            key={policy.value}
                            variant="outline"
                            onClick={() => handleUpdate({ cancellationPolicy: policy.value })}
                            className={`p-4 text-left h-auto ${policies.cancellationPolicy === policy.value
                                ? 'border-success bg-success/5'
                                : 'border-gray-200'
                                }`}
                        >
                            <div className="font-semibold text-gray-900 mb-1">{policy.label}</div>
                            <div className="text-sm text-gray-600">{policy.description}</div>
                        </Button>
                    ))}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Details (optional)
                    </label>
                    <Textarea
                        value={policies.customCancellationText || ''}
                        onChange={(e) => handleUpdate({ customCancellationText: e.target.value })}
                        placeholder="Add any additional cancellation terms or conditions..."
                        rows={3}
                    />
                </div>
            </Card>

            {/* House Rules */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Home size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">House Rules</h3>
                        <p className="text-sm text-gray-600">Set rules for guests staying at your property</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'petsAllowed', label: 'Pets Allowed' },
                            { key: 'smokingAllowed', label: 'Smoking Allowed' },
                            { key: 'eventsAllowed', label: 'Events/Parties Allowed' },
                            { key: 'childrenAllowed', label: 'Children Allowed' },
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                <input
                                    type="checkbox"
                                    checked={policies.houseRules[key as keyof typeof policies.houseRules] as boolean}
                                    onChange={(e) => handleHouseRulesUpdate({ [key]: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                        ))}
                    </div>

                    {/* Quiet Hours */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiet Hours (optional)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={policies.houseRules.quietHoursStart || ''}
                                onChange={(e) => handleHouseRulesUpdate({ quietHoursStart: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">No quiet hours</option>
                                {TIME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>From {opt.label}</option>
                                ))}
                            </select>
                            <select
                                value={policies.houseRules.quietHoursEnd || ''}
                                onChange={(e) => handleHouseRulesUpdate({ quietHoursEnd: e.target.value })}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                                disabled={!policies.houseRules.quietHoursStart}
                            >
                                <option value="">Select end time</option>
                                {TIME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>Until {opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Additional Rules */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Rules (optional)
                        </label>
                        <Textarea
                            value={policies.houseRules.additionalRules || ''}
                            onChange={(e) => handleHouseRulesUpdate({ additionalRules: e.target.value })}
                            placeholder="Any other rules guests should know about..."
                            rows={3}
                        />
                    </div>
                </div>
            </Card>

            {/* Guest Requirements */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <UserCheck size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Guest Requirements</h3>
                        <p className="text-sm text-gray-600">Set requirements for booking guests</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Age
                        </label>
                        <Input
                            type="number"
                            min="0"
                            max="99"
                            value={policies.guestRequirements.minimumAge}
                            onChange={(e) => handleGuestRequirementsUpdate({ minimumAge: parseInt(e.target.value) || 0 })}
                            className="max-w-xs"
                        />
                    </div>

                    <div className="space-y-3">
                        {[
                            { key: 'idRequired', label: 'ID Verification Required', description: 'Guests must verify their identity' },
                            { key: 'creditCardRequired', label: 'Credit Card Required', description: 'Valid credit card needed for booking' },
                        ].map(({ key, label, description }) => (
                            <label key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={policies.guestRequirements[key as keyof typeof policies.guestRequirements] as boolean}
                                    onChange={(e) => handleGuestRequirementsUpdate({ [key]: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-700">{label}</div>
                                    <div className="text-xs text-gray-600">{description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
