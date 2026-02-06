import { supabase } from '../../../../../shared/src/core/client';
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
    },

    async saveDraft(data: Partial<HotelData>, userId: string, draftId?: string) {
        if (!userId) throw new Error('User ID required');

        // Handle undefined or empty data
        const safeData = data || {};

        const draftPayload = {
            owner_id: userId,
            name: safeData.hotelName || 'Untitled Hotel',
            description: safeData.description || null,
            property_type: safeData.propertyType || null,
            contact_email: safeData.contactEmail || null,
            location: safeData.location?.address || null,
            latitude: safeData.location?.lat || null,
            longitude: safeData.location?.lng || null,
            base_price_per_night: 0,

            // JSONB Columns
            policies: safeData.policies || null,
            services: safeData.services || null,
            images: safeData.photos?.propertyPhotos || null,
            amenities: safeData.amenities || null,

            // Draft-specific
            is_published: false,
            draft_data: safeData, // Store entire form data for resuming
            updated_at: new Date().toISOString()
        };

        try {
            if (draftId) {
                // Update existing draft
                const { data: hotel, error } = await supabase
                    .from('hotels')
                    .update(draftPayload)
                    .eq('id', draftId)
                    .eq('owner_id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, draftId: hotel.id };
            } else {
                // Create new draft
                const { data: hotel, error } = await supabase
                    .from('hotels')
                    .insert(draftPayload)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, draftId: hotel.id };
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            return { success: false, error };
        }
    },

    async fetchDrafts(userId: string) {
        if (!userId) throw new Error('User ID required');

        try {
            const { data, error } = await supabase
                .from('hotels')
                .select('*')
                .eq('owner_id', userId)
                .eq('is_published', false)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return { success: true, drafts: data };
        } catch (error) {
            console.error('Error fetching drafts:', error);
            return { success: false, error, drafts: [] };
        }
    },

    async fetchPublishedListings(userId: string) {
        if (!userId) throw new Error('User ID required');

        try {
            const { data, error } = await supabase
                .from('hotels')
                .select('*, rooms(count)')
                .eq('owner_id', userId)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, listings: data };
        } catch (error) {
            console.error('Error fetching listings:', error);
            return { success: false, error, listings: [] };
        }
    }
};
