import { Tour } from '@/features/tour-operator/services/tourService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface TourDetailsStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
    onBack: () => void;
}

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Arabic', 'Urdu', 'Hindi'];
const DIFFICULTY_LEVELS = ['easy', 'moderate', 'difficult'];

export function TourDetailsStep({ data, onUpdate, onNext, onBack }: TourDetailsStepProps) {

    const updateArrayField = (field: keyof Tour, value: string) => {
        // Simple comma separated parser for now
        const array = value.split(',').map(s => s.trim()).filter(Boolean);
        onUpdate({ [field]: array });
    };

    const handleLanguageChange = (lang: string) => {
        const current = data.languages || [];
        const next = current.includes(lang)
            ? current.filter(l => l !== lang)
            : [...current, lang];
        onUpdate({ languages: next });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tour Details & Requirements</h2>
                <p className="text-gray-500">Define what is included and who can participate.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label>Inclusions (Comma separated)</Label>
                    <Textarea
                        placeholder="e.g. Hotel pickup, Lunch, Guide, Entrance fees"
                        defaultValue={(data.inclusions || []).join(', ')}
                        onBlur={(e) => updateArrayField('inclusions', e.target.value)}
                        rows={3}
                    />
                    <p className="text-xs text-gray-400">Separate items with commas</p>
                </div>

                <div className="space-y-2">
                    <Label>Exclusions (Comma separated)</Label>
                    <Textarea
                        placeholder="e.g. Dinner, Tips, Personal expenses"
                        defaultValue={(data.exclusions || []).join(', ')}
                        onBlur={(e) => updateArrayField('exclusions', e.target.value)}
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select
                            value={data.difficulty_level || 'easy'}
                            onValueChange={(val: any) => onUpdate({ difficulty_level: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DIFFICULTY_LEVELS.map(l => (
                                    <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Min Age</Label>
                        <Input
                            type="number"
                            min="0"
                            value={data.min_age || ''}
                            onChange={(e) => onUpdate({ min_age: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Age</Label>
                        <Input
                            type="number"
                            min="0"
                            value={data.max_age || ''}
                            onChange={(e) => onUpdate({ max_age: parseInt(e.target.value) || 100 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Min Participants</Label>
                        <Input
                            type="number"
                            min="1"
                            value={data.min_participants || 1}
                            onChange={(e) => onUpdate({ min_participants: parseInt(e.target.value) || 1 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max Participants</Label>
                        <Input
                            type="number"
                            min="1"
                            value={data.max_participants || 20}
                            onChange={(e) => onUpdate({ max_participants: parseInt(e.target.value) || 20 })}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Languages Supported</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {LANGUAGES.map(lang => (
                            <div key={lang} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`lang-${lang}`}
                                    checked={(data.languages || []).includes(lang)}
                                    onCheckedChange={() => handleLanguageChange(lang)}
                                />
                                <label
                                    htmlFor={`lang-${lang}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {lang}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Additional Requirements (Comma separated)</Label>
                    <Textarea
                        placeholder="e.g. Hiking boots, Sunscreen, Passport"
                        defaultValue={(data.requirements || []).join(', ')}
                        onBlur={(e) => updateArrayField('requirements', e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext}>Next Step</Button>
            </div>
        </div>
    );
}
