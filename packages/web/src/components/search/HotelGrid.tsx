import { Hotel } from "@tripavail/shared/services/searchService";
import { HotelCard } from "./HotelCard";
import { Skeleton } from "@/components/ui/skeleton";

interface HotelGridProps {
    hotels: Hotel[];
    isLoading: boolean;
}

export function HotelGrid({ hotels, isLoading }: HotelGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[250px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (hotels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h3 className="text-2xl font-bold mb-2">No hotels found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or map area.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {hotels.map((hotel) => (
                <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onClick={() => console.log('Navigate to hotel', hotel.id)}
                />
            ))}
        </div>
    );
}
