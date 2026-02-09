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

export interface CreateTourDTO {
    title: string;
    tour_type: string;
    location: Tour['location'];
    duration: string;
    price: number;
    currency: string;
    operator_id: string;
}

export const tourService = {
    async createTour(tourData: CreateTourDTO) {
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
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching tours for operator ${operatorId}:`, error);
            throw error;
        }

        return data as Tour[];
    },

    async uploadTourImages(operatorId: string, files: File[]) {
        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${operatorId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tour-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error(`Error uploading file ${file.name}:`, uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('tour-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        });

        return Promise.all(uploadPromises);
    }
};
