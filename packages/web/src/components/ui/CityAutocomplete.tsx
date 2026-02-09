import { useState, useCallback, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface CityAutocompleteProps {
    value: string;
    onCitySelect: (city: string) => void;
    className?: string;
    placeholder?: string;
}

export function CityAutocomplete({
    value,
    onCitySelect,
    className,
    placeholder = "Search for a city..."
}: CityAutocompleteProps) {
    // const map = useMap();
    const [searchQuery, setSearchQuery] = useState(value);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sync with external value
    useEffect(() => {
        setSearchQuery(value);
    }, [value]);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery === value) {
            setPredictions([]);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            if (!window.google) return;
            const service = new google.maps.places.AutocompleteService();

            try {
                const response = await service.getPlacePredictions({
                    input: searchQuery,
                    types: ['(cities)'],
                });

                setPredictions(response.predictions || []);
            } catch (error) {
                console.error('Error fetching predictions:', error);
                setPredictions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, value]);

    const handlePredictionClick = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
        const cityName = prediction.description;
        setSearchQuery(cityName);
        onCitySelect(cityName);
        setShowSuggestions(false);
        setPredictions([]);
    }, [onCitySelect]);

    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsSearching(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results?.[0]) {
                        // Find the city in address components
                        const cityComponent = results[0].address_components.find(
                            c => c.types.includes('locality') || c.types.includes('administrative_area_level_1')
                        );
                        const countryComponent = results[0].address_components.find(
                            c => c.types.includes('country')
                        );

                        if (cityComponent) {
                            const locationName = countryComponent
                                ? `${cityComponent.long_name}, ${countryComponent.long_name}`
                                : cityComponent.long_name;
                            setSearchQuery(locationName);
                            onCitySelect(locationName);
                        }
                    } else {
                        toast.error('Could not detect city name');
                    }
                    setIsSearching(false);
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                setIsSearching(false);
                alert('Unable to get your current location');
            }
        );
    }, [onCitySelect]);

    return (
        <div className={cn("relative w-full", className)}>
            <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" aria-hidden="true" />
                <Input
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="pl-14 pr-14 rounded-2xl border-gray-100 py-8 text-lg shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all placeholder:text-gray-300 font-medium w-full"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                        <button
                            type="button"
                            onClick={detectLocation}
                            className="p-2 hover:bg-primary/10 rounded-xl text-gray-400 hover:text-primary transition-all active:scale-95"
                            title="Detect current location"
                        >
                            <LocateFixed className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && predictions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-3 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-50 overflow-hidden ring-1 ring-black/[0.05]"
                    >
                        {predictions.map((prediction) => (
                            <button
                                key={prediction.place_id}
                                onClick={() => handlePredictionClick(prediction)}
                                className="w-full px-6 py-5 text-left hover:bg-primary/[0.03] flex items-center gap-4 transition-colors group border-b border-gray-50 last:border-b-0"
                            >
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-gray-900 truncate tracking-tight">
                                        {prediction.structured_formatting.main_text}
                                    </p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest truncate">
                                        {prediction.structured_formatting.secondary_text}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
