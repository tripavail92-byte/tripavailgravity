import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchForm } from "@/components/search/SearchForm";
import { HotelGrid } from "@/components/search/HotelGrid";
import { searchService, type Hotel } from "@tripavail/shared/services/searchService";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [priceRange, setPriceRange] = useState<{ min?: number, max?: number }>({});

    // Parse URL params
    const location = searchParams.get("q") || undefined;
    const guests = parseInt(searchParams.get("guests") || "1");

    const performSearch = async () => {
        setIsLoading(true);
        try {
            const results = await searchService.searchHotels({
                location,
                guests,
                minPrice: priceRange.min,
                maxPrice: priceRange.max
            });
            setHotels(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load & when params change
    useEffect(() => {
        performSearch();
    }, [location, guests, priceRange.min, priceRange.max]);

    // Real-time updates: Refetch if any hotel is updated (e.g. price change)
    useRealtimeSubscription({
        table: "hotels",
        onData: (payload) => {
            console.log("Realtime update:", payload);
            // Optimistic update or refetch. Refetching is safer for MVP.
            performSearch();
        }
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar with Compact Search */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    {/* Mobile: Logo only? Desktop: Mini Search Form? */}
                    <div className="hidden md:block flex-1">
                        <SearchForm className="p-0 shadow-none border-0 bg-transparent flex-row items-center" />
                    </div>
                    <div className="md:hidden font-bold text-primary">TripAvail</div>

                    {/* Filters Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>Refine your search results</SheetDescription>
                            </SheetHeader>
                            <Separator className="my-4" />

                            <div className="space-y-4">
                                <div>
                                    <Label>Price Range (per night)</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                                        />
                                        <span>-</span>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                                        />
                                    </div>
                                </div>
                                {/* More filters (Amenities) could go here */}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">
                    {location ? `Stays in ${location}` : "All Stays"}
                </h1>

                <HotelGrid hotels={hotels} isLoading={isLoading} />
            </main>
        </div>
    );
}
