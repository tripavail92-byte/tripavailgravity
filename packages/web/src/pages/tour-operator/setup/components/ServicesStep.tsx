import { useState } from 'react';
import { motion } from 'motion/react';
import { Plane, Map, Mountain, Camera, PartyPopper, Heart, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

const SERVICES = [
    { id: 'day-trip', name: 'Day Trips', icon: Plane, desc: 'Single-day excursions' },
    { id: 'weekend', name: 'Weekend Getaways', icon: Map, desc: '2-3 day short trips' },
    { id: 'hiking', name: 'Hiking & Trekking', icon: Mountain, desc: 'Mountain & nature trails' },
    { id: 'sightseeing', name: 'Sightseeing', icon: Camera, desc: 'Cultural & city tours' },
    { id: 'festivals', name: 'Festivals', icon: PartyPopper, desc: 'Events & celebrations' },
    { id: 'leisure', name: 'Leisure', icon: Heart, desc: 'Wellness & relaxation' },
];

export function ServicesStep({ onUpdate, data }: StepProps) {
    const [selected, setSelected] = useState<string[]>(data.services?.selected || []);
    const [custom, setCustom] = useState<string[]>(data.services?.custom || []);
    const [customInput, setCustomInput] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const toggle = (id: string) => {
        const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
        setSelected(next);
        onUpdate({ services: { selected: next, custom } });
    };

    const addCustom = () => {
        if (customInput && !custom.includes(customInput)) {
            const next = [...custom, customInput];
            setCustom(next);
            setCustomInput('');
            setIsAdding(false);
            onUpdate({ services: { selected, custom: next } });
        }
    };

    const removeCustom = (item: string) => {
        const next = custom.filter(c => c !== item);
        setCustom(next);
        onUpdate({ services: { selected, custom: next } });
    };

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Tour Services</h3>
                <p className="text-gray-600">What types of tours do you specialize in? Select all that apply.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {SERVICES.map((s) => {
                    const isSelected = selected.includes(s.id);
                    return (
                        <motion.button
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`p-6 rounded-3xl border-2 text-left transition-all relative group ${isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{s.name}</p>
                                    <p className="text-xs text-gray-500">{s.desc}</p>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1 shadow-sm">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Custom Categories</h4>
                    {!isAdding && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/5 rounded-xl font-medium"
                            onClick={() => setIsAdding(true)}
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> Add Category
                        </Button>
                    )}
                </div>

                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                    >
                        <Input
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            placeholder="e.g. Desert Safari, Food Tour..."
                            className="rounded-xl border-gray-200 h-10"
                            autoFocus
                        />
                        <Button onClick={addCustom} size="sm" className="rounded-xl px-4 h-10">Add</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl h-10">Cancel</Button>
                    </motion.div>
                )}

                <div className="flex flex-wrap gap-2">
                    {custom.map(c => (
                        <span key={c} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {c}
                            <button onClick={() => removeCustom(c)} className="hover:text-primary-800 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
