import { Tour } from '@/features/tour-operator/services/tourService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

interface TourBasicsStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
}

const TOUR_TYPES = [
    'City Tour', 'Cultural', 'Adventure', 'Food & Drink', 'Nature', 'Historical', 'Nightlife', 'Workshop'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED'];

export function TourBasicsStep({ data, onUpdate, onNext }: TourBasicsStepProps) {
    const isValid = data.title && data.tour_type && data.duration && data.price && data.location?.city;

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tour Basics</h2>
                    <p className="text-gray-500">Start with the fundamental details of your tour.</p>
                </div>

                <div className="grid gap-6">
                    <div className="space-y-2">
                        <Label>Tour Title *</Label>
                        <Input
                            placeholder="e.g. Historic City Walk"
                            value={data.title || ''}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tour Type *</Label>
                            <Select
                                value={data.tour_type}
                                onValueChange={(val) => onUpdate({ tour_type: val })}
                            >
                                <SelectTrigger>
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
                            <Label>Duration *</Label>
                            <Input
                                placeholder="e.g. 3 hours, 2 days"
                                value={data.duration || ''}
                                onChange={(e) => onUpdate({ duration: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Location (City) *</Label>
                        <CityAutocomplete
                            value={data.location?.city || ''}
                            onCitySelect={(city) => onUpdate({
                                location: {
                                    ...data.location,
                                    city: city,
                                    country: data.location?.country || '', // TODO: Extract country if possible or let user refine
                                }
                            })}
                            placeholder="Search for a city..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Price *</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={data.price || ''}
                                onChange={(e) => onUpdate({ price: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select
                                value={data.currency || 'USD'}
                                onValueChange={(val) => onUpdate({ currency: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Textarea
                            placeholder="A brief teaser for the tour card..."
                            value={data.short_description || ''}
                            onChange={(e) => onUpdate({ short_description: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onNext} disabled={!isValid}>Next Step</Button>
                </div>
            </div>
        </APIProvider>
    );
}
