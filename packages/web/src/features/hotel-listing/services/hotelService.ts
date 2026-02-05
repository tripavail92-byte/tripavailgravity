import { supabase } from '@tripfinal/shared';
import { HotelData } from '../components/CompleteHotelListingFlow';

/*
  Maps the frontend HotelData structure to the Database Schema:
  
  HOTEL DATA -> DB COLUMNS
  ------------------------
  propertyType -> property_type
  hotelName -> name
  description -> description
  images -> main_image_url (1st), images (JSONB for rest)
  rooms -> rooms table
  policies -> policies (JSONB)
  services -> services (JSONB)
  contactEmail -> contact_email
*/

export const hotelService = {
    async publishListing(data: Partial<HotelData>, userId: string) {
        if (!userId) throw new Error('User ID required');

        // 1. Prepare Hotel Payload
        const hotelPayload = {
            owner_id: userId,
            name: data.hotelName,
            description: data.description,
            property_type: data.propertyType,
            star_rating: data.starRating, // To be added to frontend state if missing
            contact_email: data.contactEmail,
            location: data.location?.address || '',
            latitude: data.location?.lat,
            longitude: data.location?.lng,
            base_price_per_night: 0, // Calculated from lowest room price?

            // JSONB Columns
            policies: data.policies,
            services: data.services,
            images: data.photos?.propertyPhotos,

            // Arrays
            amenities: data.amenities,

            is_published: true,
            updated_at: new Date().toISOString()
        };

        // Calculate base price from rooms if available
        if (data.rooms && data.rooms.length > 0) {
            hotelPayload.base_price_per_night = Math.min(...data.rooms.map(r => r.pricing.basePrice));
        }

        try {
            // 2. Insert Hotel
            const { data: hotel, error: hotelError } = await supabase
                .from('hotels')
                .insert(hotelPayload)
                .select()
                .single();

            if (hotelError) throw hotelError;

            // 3. Insert Rooms
            if (data.rooms && data.rooms.length > 0) {
                const roomsPayload = data.rooms.map(room => ({
                    hotel_id: hotel.id,
                    name: room.name,
                    description: room.description,
                    capacity_adults: room.maxGuests, // Simplified
                    capacity_children: 0,
                    price_override: room.pricing.basePrice,
                    initial_stock: room.count,

                    // New Columns
                    size_sqm: room.size,
                    bed_config: room.beds, // Need to ensure format matches JSONB or adapt
                    amenities: room.amenities,
                    images: [] // Room images to be handled
                }));

                const { error: roomsError } = await supabase
                    .from('rooms')
                    .insert(roomsPayload);

                if (roomsError) throw roomsError;
            }

            return { success: true, hotelId: hotel.id };
        } catch (error) {
            console.error('Error publishing listing:', error);
            return { success: false, error };
        }
    },

    async uploadImage(file: File, bucketProp: 'hotel-images' = 'hotel-images') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketProp)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(bucketProp)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
