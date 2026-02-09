import { supabase } from '@/lib/supabase';

export interface Tour {
    id: string;
    operator_id: string;
    title: string;
    tour_type: string;
    location: {
        city: string;
        country: string;
        lat?: number;
        lng?: number;
        address?: string;
    };
    duration: string;
    price: number;
    currency: string;
    description: string | null;
    short_description: string | null;
    images: string[];
    highlights: string[];
    inclusions: string[];
    exclusions: string[];
    requirements: string[];
    min_participants: number;
    max_participants: number;
    min_age: number;
    max_age: number;
    difficulty_level: 'easy' | 'moderate' | 'difficult';
    languages: string[];
    // Pricing & Policies
    group_discounts: boolean;
    pricing_tiers: Array<{
        id: string;
        name: string;
        minPeople: number;
        maxPeople: number;
        pricePerPerson: number;
    }>;
    seasonal_pricing: boolean;
    peak_season_multiplier: number;
    off_season_multiplier: number;
    deposit_required: boolean;
    deposit_percentage: number;
    cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non-refundable';

    rating: number;
    review_count: number;
    is_active: boolean;
    is_verified: boolean;
    is_featured: boolean;
    itinerary?: any[]; // Structured itinerary data (JSONB in DB) - TODO: Define strict type
    schedules?: any[]; // Structured schedule data
    created_at: string;
    updated_at: string;
}

export type CreateTourDTO = Omit<Tour, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'is_active' | 'is_verified' | 'is_featured'>;

export const tourService = {
    async createTour(tourData: Partial<Tour>) {
        console.log('Creating tour with data:', tourData);
        const { data, error } = await supabase
            .from('tours')
            .insert(tourData)
            .select()
            .single();

        if (error) {
            console.error('Error creating tour:', error);
            throw error;
        }

        return data as Tour;
    },

    async updateTour(id: string, updates: Partial<Tour>) {
        console.log(`Updating tour ${id}:`, updates);
        const { data, error } = await supabase
            .from('tours')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Error updating tour ${id}:`, error);
            throw error;
        }

        return data as Tour;
    },

    async getTourById(id: string) {
        const { data, error } = await supabase
            .from('tours')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching tour ${id}:`, error);
            throw error;
        }

        return data as Tour;
    },

    async getOperatorTours(operatorId: string) {
        const { data, error } = await supabase
            .from('tours')
            .select('*')
            .eq('operator_id', operatorId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching tours for operator ${operatorId}:`, error);
            throw error;
        }

        return data as Tour[];
    },

    async fetchPublishedTours(operatorId: string) {
        return this.getOperatorTours(operatorId);
    },

    async fetchDraftTours(operatorId: string) {
        const { data, error } = await supabase
            .from('tours')
            .select('*')
            .eq('operator_id', operatorId)
            .eq('is_published', false)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error(`Error fetching drafts for operator ${operatorId}:`, error);
            throw error;
        }

        return data as Tour[];
    },

    async saveTourDraft(data: Partial<Tour>, operatorId: string, draftId?: string) {
        if (!operatorId) throw new Error('Operator ID required');

        const draftPayload = {
            operator_id: operatorId,
            title: data.title || 'Untitled Tour',
            tour_type: data.tour_type || 'Adventure',
            location: data.location || {},
            duration: data.duration || '1 day',
            price: data.price || 0,
            currency: data.currency || 'USD',
            is_published: false,
            draft_data: data,
            updated_at: new Date().toISOString()
        };

        if (draftId) {
            const { data: tour, error } = await supabase
                .from('tours')
                .update(draftPayload)
                .eq('id', draftId)
                .eq('operator_id', operatorId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, tourId: tour.id };
        } else {
            const { data: tour, error } = await supabase
                .from('tours')
                .insert(draftPayload)
                .select()
                .single();

            if (error) throw error;
            return { success: true, tourId: tour.id };
        }
    },

    async fetchFeaturedTours() {
        const { data, error } = await supabase
            .from('tours')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) {
            console.error('Error fetching featured tours:', error);
            throw error;
        }

        return data as Tour[];
    },

    async uploadTourImages(operatorId: string, files: File[]) {
        const urls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${operatorId}/${fileName}`;

            console.log(`📤 Uploading tour image: ${filePath}`);

            const { error: uploadError } = await supabase.storage
                .from('tour-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error(`❌ Error uploading file ${file.name}:`, uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('tour-images')
                .getPublicUrl(filePath);

            urls.push(data.publicUrl);
        }

        return urls;
    }
};
