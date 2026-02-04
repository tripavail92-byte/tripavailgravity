import { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Navigation, X, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LocationData {
    address: string;
    city: string;
    area: string;
    country: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
}

interface LocationPickerProps {
    onLocationSelect: (location: LocationData) => void;
    onClose?: () => void;
    initialLocation?: LocationData | null;
    placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Default center (Lahore, Pakistan)
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

function PlacesAutocomplete({
    onPlaceSelect,
    searchQuery,
    setSearchQuery
}: {
    onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}) {
    const map = useMap();
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim() || !map) {
            setPredictions([]);
            return;
        }

        setIsSearching(true);

        const service = new google.maps.places.AutocompleteService();

        try {
            const response = await service.getPlacePredictions({
                input: query,
                componentRestrictions: { country: 'pk' }, // Restrict to Pakistan, remove if worldwide
            });

            setPredictions(response.predictions || []);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setPredictions([]);
        } finally {
            setIsSearching(false);
        }
    }, [map]);

    const handlePredictionClick = useCallback(async (placeId: string) => {
        if (!map) return;

        const service = new google.maps.places.PlacesService(map);

        service.getDetails(
            {
                placeId,
                fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    onPlaceSelect(place);
                    setShowSuggestions(false);
                }
            }
        );
    }, [map, onPlaceSelect]);

    // Debounced search
    useState(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    });

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                    type="text"
                    placeholder="Search for your hotel location..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 rounded-xl"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={18} />
                )}
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
                {showSuggestions && predictions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
                    >
                        {predictions.map((prediction, index) => (
                            <motion.button
                                key={prediction.place_id}
                                onClick={() => handlePredictionClick(prediction.place_id)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</p>
                                        <p className="text-sm text-gray-600">{prediction.structured_formatting.secondary_text}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LocationPickerContent({ onLocationSelect, onClose, initialLocation }: LocationPickerProps) {
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
    const [mapCenter, setMapCenter] = useState(initialLocation?.coordinates || DEFAULT_CENTER);
    const [searchQuery, setSearchQuery] = useState('');
    const map = useMap();

    const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Extract address components
        let city = '';
        let area = '';
        let country = '';

        place.address_components?.forEach((component) => {
            if (component.types.includes('locality')) {
                city = component.long_name;
            }
            if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                area = component.long_name;
            }
            if (component.types.includes('country')) {
                country = component.long_name;
            }
        });

        const locationData: LocationData = {
            address: place.formatted_address || '',
            city: city || 'Unknown City',
            area: area || city || 'Unknown Area',
            country: country || 'Unknown Country',
            coordinates: { lat, lng },
            placeId: place.place_id || `custom_${Date.now()}`,
        };

        setSelectedLocation(locationData);
        setMapCenter({ lat, lng });
        setSearchQuery(place.formatted_address || '');

        // Pan map to location
        if (map) {
            map.panTo({ lat, lng });
            map.setZoom(15);
        }
    }, [map]);

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                handlePlaceSelect(results[0]);
            } else {
                // Fallback if geocoding fails
                const locationData: LocationData = {
                    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    city: 'Selected Location',
                    area: 'Custom Pin',
                    country: 'Unknown',
                    coordinates: { lat, lng },
                    placeId: `custom_${Date.now()}`,
                };
                setSelectedLocation(locationData);
                setMapCenter({ lat, lng });
            }
        });
    }, [handlePlaceSelect]);

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Reverse geocode
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        handlePlaceSelect(results[0]);
                    }
                });
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your current location');
            }
        );
    }, [handlePlaceSelect]);

    const handleConfirmLocation = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Where is your hotel located?</h1>
                        <p className="text-sm text-gray-600">Pin the exact location on the map</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <PlacesAutocomplete
                    onPlaceSelect={handlePlaceSelect}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <Map
                    defaultCenter={mapCenter}
                    defaultZoom={12}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    onClick={handleMapClick}
                    mapId="hotel-location-map"
                >
                    {selectedLocation && (
                        <AdvancedMarker position={selectedLocation.coordinates}>
                            <div className="relative">
                                <motion.div
                                    initial={{ scale: 0, y: -20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="w-8 h-8 bg-[#ff5a5f] rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                                >
                                    <MapPin size={16} className="text-white" />
                                </motion.div>
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>

                {/* Current Location Button */}
                <button
                    onClick={getCurrentLocation}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                    <Navigation size={20} className="text-gray-700" />
                </button>

                {/* Map Overlay Info */}
                {selectedLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 right-4"
                    >
                        <Card className="p-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
                            <div className="flex items-start gap-3 mb-3">
                                <MapPin size={20} className="text-[#ff5a5f] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{selectedLocation.address}</h3>
                                    <p className="text-sm text-gray-600">{selectedLocation.city}, {selectedLocation.country}</p>
                                </div>
                            </div>

                            {/* Confirm Button inside the card */}
                            <div className="flex gap-2">
                                {onClose && (
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    onClick={handleConfirmLocation}
                                    className="flex-1 bg-[#ff5a5f] hover:bg-[#ff5a5f]/90 text-white"
                                >
                                    <Check size={16} className="mr-2" />
                                    Confirm Location
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export function LocationPicker(props: LocationPickerProps) {
    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Google Maps API Key Missing</h2>
                    <p className="text-gray-600">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <LocationPickerContent {...props} />
        </APIProvider>
    );
}
