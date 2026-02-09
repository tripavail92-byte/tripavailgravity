import { Info, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Tour } from '@/features/tour-operator/services/tourService';
import {
    AdventureIcon, CulturalIcon, NatureIcon, CityIcon,
    FoodIcon, BeachIcon, HistoricalIcon, ReligiousIcon
} from './CategoryIcons';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

interface TourBasicsStepProps {
    data: Partial<Tour>;
    onUpdate: (data: Partial<Tour>) => void;
    onNext: () => void;
}



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

                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tour Category *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { id: 'Adventure', icon: AdventureIcon, label: 'Adventure' },
                                { id: 'Cultural', icon: CulturalIcon, label: 'Cultural' },
                                { id: 'Nature', icon: NatureIcon, label: 'Nature' },
                                { id: 'City Tour', icon: CityIcon, label: 'City' },
                                { id: 'Food & Drink', icon: FoodIcon, label: 'Food & Culinary' },
                                { id: 'Beach', icon: BeachIcon, label: 'Beach & Coastal' },
                                { id: 'Historical', icon: HistoricalIcon, label: 'Historical' },
                                { id: 'Religious', icon: ReligiousIcon, label: 'Religious' },
                            ].map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onUpdate({ tour_type: cat.id })}
                                    className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 group ${data.tour_type === cat.id
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-md'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors duration-300">
                                        <cat.icon />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest text-center ${data.tour_type === cat.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                                        }`}>
                                        {cat.label}
                                    </span>
                                    {data.tour_type === cat.id && (
                                        <motion.div
                                            layoutId="selected-category"
                                            className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-300"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
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
