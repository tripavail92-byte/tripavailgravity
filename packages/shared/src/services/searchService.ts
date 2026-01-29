import { supabase } from '../core/client';
import type { Database } from '../types/database';

export type Hotel = Database['public']['Tables']['hotels']['Row'];

export interface SearchParams {
    location?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
}

export class SearchService {
    /**
     * Search hotels based on parameters
     */
    async searchHotels(params: SearchParams): Promise<Hotel[]> {
        let query = supabase
            .from('hotels')
            .select('*')
            .eq('is_published', true);

        // Location Filter (Basic text match for now)
        // In production, we would use PostGIS or full-text search
        if (params.location) {
            query = query.ilike('location', `%${params.location}%`);
        }

        // Price Range
        if (params.minPrice) {
            query = query.gte('base_price_per_night', params.minPrice);
        }
        if (params.maxPrice) {
            query = query.lte('base_price_per_night', params.maxPrice);
        }

        // Guest Capacity logic would require joining 'rooms' table
        // For MVP phase 1, we just return hotels and filter rooms later or ignore

        const { data, error } = await query;

        if (error) {
            console.error('Search error:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get hotel by ID
     */
    async getHotelById(id: string): Promise<Hotel | null> {
        const { data, error } = await supabase
            .from('hotels')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
}

export const searchService = new SearchService();
