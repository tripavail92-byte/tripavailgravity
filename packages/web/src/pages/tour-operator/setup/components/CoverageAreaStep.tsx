import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Globe, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

const COVERAGE_OPTIONS = [
    { id: 'city', title: 'City Only', radius: '15 km', desc: 'Tours within city limits' },
    { id: 'region', title: 'Regional', radius: '50 km', desc: 'Nearby towns & nature' },
    { id: 'province', title: 'Provincial', radius: 'Province', desc: 'Multi-day state tours' },
    { id: 'national', title: 'National', radius: 'Country', desc: 'Global packages' },
];

export function CoverageAreaStep({ onUpdate, data }: StepProps) {
    const [formData, setFormData] = useState(data.coverage || {
        primaryLocation: '',
        radius: ''
    });

    const update = (field: string, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        onUpdate({ coverage: next });
    };

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Coverage Area</h3>
                <p className="text-gray-600">Where do you operate your tours?</p>
            </div>

            <div className="space-y-8">
                <div className="space-y-3">
                    <Label htmlFor="location" className="text-sm font-semibold uppercase tracking-wider text-gray-500">Primary Operating City *</Label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            id="location"
                            value={formData.primaryLocation}
                            onChange={e => update('primaryLocation', e.target.value)}
                            placeholder="e.g. Islamabad, Pakistan"
                            className="pl-12 rounded-2xl border-gray-200 py-7 text-lg shadow-sm focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-gray-500">Service Coverage Range *</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {COVERAGE_OPTIONS.map((opt) => {
                            const isSelected = formData.radius === opt.id;
                            return (
                                <motion.button
                                    key={opt.id}
                                    onClick={() => update('radius', opt.id)}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-5 rounded-3xl border-2 text-left transition-all relative group h-full flex flex-col justify-between ${isSelected
                                        ? 'border-primary bg-primary/5 shadow-md'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}>
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            {isSelected && (
                                                <div className="bg-primary text-white rounded-full p-0.5">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{opt.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{opt.desc}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 inline-flex px-2 px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-tighter self-start">
                                        {opt.radius}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold italic">?</div>
                    <span className="font-bold text-primary text-sm">Need a custom range?</span>
                </div>
                <p className="text-sm text-primary/80 leading-relaxed px-1">
                    Don't worry, you can always update your operating areas and specific destinations for each individual tour package later.
                </p>
            </div>
        </div>
    );
}
