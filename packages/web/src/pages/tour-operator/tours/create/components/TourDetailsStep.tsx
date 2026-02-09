import { Info, Users, Clock, Globe, Minus, Plus, Languages, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tour } from '@/features/tour-operator/services/tourService';

interface TourDetailsStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
    onBack: () => void;
}

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Arabic'];
const DIFFICULTY_LEVELS = ['Easy', 'Moderate', 'Challenging', 'Difficult', 'Expert'];

export function TourDetailsStep({ data, onUpdate, onNext, onBack }: TourDetailsStepProps) {
    const toggleLanguage = (lang: string) => {
        const current = data.languages || [];
        const updated = current.includes(lang)
            ? current.filter(l => l !== lang)
            : [...current, lang];
        onUpdate({ languages: updated });
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Requirements & Logistics</h2>
                        <p className="text-white/80 text-sm">Define who can participate and the physical demands.</p>
                    </div>
                </div>
            </Card>

            <div className="grid gap-6">
                <Card className="p-6 border-gray-100 shadow-sm rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Difficulty Level</Label>
                            <Select
                                value={data.difficulty}
                                onValueChange={(val) => onUpdate({ difficulty: val })}
                            >
                                <SelectTrigger className="h-12 border-gray-200">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Age Range</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    value={data.min_age?.toString()}
                                    onValueChange={(val) => onUpdate({ min_age: parseInt(val) })}
                                >
                                    <SelectTrigger className="h-12 border-gray-200">
                                        <SelectValue placeholder="Min Age" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 5, 12, 18, 21].map(age => (
                                            <SelectItem key={age} value={age.toString()}>{age}+ years</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={data.max_age?.toString()}
                                    onValueChange={(val) => onUpdate({ max_age: parseInt(val) })}
                                >
                                    <SelectTrigger className="h-12 border-gray-200">
                                        <SelectValue placeholder="Max Age" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[12, 18, 21, 50, 80, 100].map(age => (
                                            <SelectItem key={age} value={age.toString()}>Up to {age}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Participants Count</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase">Min</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => onUpdate({ min_participants: Math.max(1, (data.min_participants || 1) - 1) })}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <div className="flex-1 text-center font-bold">{data.min_participants || 1}</div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => onUpdate({ min_participants: (data.min_participants || 1) + 1 })}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-400 font-bold uppercase">Max</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => onUpdate({ max_participants: Math.max(1, (data.max_participants || 10) - 1) })}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <div className="flex-1 text-center font-bold">{data.max_participants || 10}</div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => onUpdate({ max_participants: (data.max_participants || 10) + 1 })}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Languages Provided</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleLanguage(lang)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${(data.languages || []).includes(lang)
                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:bg-primary/5'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-gray-100 shadow-sm rounded-2xl">
                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 block">Physical Requirements / Logistics</Label>
                    <Textarea
                        placeholder="e.g. Requires 2km of walking on uneven terrain. Please bring comfortable shoes..."
                        value={data.description || ''}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        rows={4}
                        className="border-gray-200 focus:border-primary/50 focus:ring-primary/20 resize-none"
                    />
                </Card>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <Button variant="outline" onClick={onBack} size="lg" className="px-8 border-gray-200 hover:bg-gray-50">Back</Button>
                <Button onClick={onNext} size="lg" className="px-8 bg-primary hover:bg-primary/90 text-white font-bold">Next Step</Button>
            </div>
        </div>
    );
}
