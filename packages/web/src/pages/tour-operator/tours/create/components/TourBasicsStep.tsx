import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Tour } from '@/features/tour-operator/services/tourService';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

interface TourBasicsStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
}

const TOUR_TYPES = [
    'City Tour', 'Cultural', 'Adventure', 'Food & Drink', 'Nature', 'Historical', 'Nightlife', 'Workshop'
];

export function TourBasicsStep({ data, onUpdate, onNext }: TourBasicsStepProps) {
    const isValid = data.title && data.tour_type && data.duration && data.location?.city;

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Info className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Tour Basics</h2>
                            <p className="text-white/80 text-sm">Start with the fundamental details of your tour package.</p>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tour Title *</Label>
                        <Input
                            placeholder="e.g. Historic City Walk"
                            value={data.title || ''}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tour Type *</Label>
                            <Select
                                value={data.tour_type}
                                onValueChange={(val) => onUpdate({ tour_type: val })}
                            >
                                <SelectTrigger className="h-12 border-gray-200">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TOUR_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Duration *</Label>
                            <Input
                                placeholder="e.g. 3 hours, 2 days"
                                value={data.duration || ''}
                                onChange={(e) => onUpdate({ duration: e.target.value })}
                                className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Location (City) *</Label>
                        <CityAutocomplete
                            value={data.location?.city || ''}
                            onCitySelect={(city) => onUpdate({
                                location: {
                                    ...data.location,
                                    city: city,
                                    country: data.location?.country || '',
                                }
                            })}
                            placeholder="Search for a city..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Short Description</Label>
                        <Textarea
                            placeholder="A brief teaser for the tour card..."
                            value={data.short_description || ''}
                            onChange={(e) => onUpdate({ short_description: e.target.value })}
                            rows={2}
                            className="border-gray-200 focus:border-primary/50 focus:ring-primary/20 resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onNext} size="lg" className="px-8 bg-primary hover:bg-primary/90 text-white font-bold" disabled={!isValid}>Next Step</Button>
                </div>
            </div>
        </APIProvider>
    );
}
