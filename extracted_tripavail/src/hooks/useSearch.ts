// Search Hook - Handle search functionality
import { useState, useEffect, useCallback } from 'react';
import type { Hotel, Tour, SearchFilters } from '../lib/types';
import { dataService } from '../services/dataService';
import { debounce } from '../lib/utils';
import { SEARCH_DEBOUNCE_MS } from '../lib/constants';

export interface UseSearchReturn {
  // State
  searchQuery: string;
  searchResults: (Hotel | Tour)[];
  isSearching: boolean;
  hasSearched: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  search: (query: string, category?: 'all' | 'hotels' | 'tours') => Promise<void>;
  
  // Utils
  getFilteredResults: (filters: Partial<SearchFilters>) => (Hotel | Tour)[];
}

export function useSearch(): UseSearchReturn {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<(Hotel | Tour)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, category: 'all' | 'hotels' | 'tours' = 'all') => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        const response = await dataService.searchItems(query, category);
        
        if (response.success) {
          setSearchResults(response.data);
          setHasSearched(true);
        } else {
          setSearchResults([]);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS),
    []
  );

  // Update search query and trigger search
  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    debouncedSearch(query);
  };

  // Manual search function
  const search = async (query: string, category: 'all' | 'hotels' | 'tours' = 'all') => {
    setSearchQueryState(query);
    await debouncedSearch(query, category);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQueryState('');
    setSearchResults([]);
    setHasSearched(false);
    setIsSearching(false);
  };

  // Filter results based on additional criteria
  const getFilteredResults = (filters: Partial<SearchFilters>) => {
    let filteredResults = searchResults;

    // Filter by rating
    if (filters.rating !== undefined) {
      filteredResults = filteredResults.filter(item => item.rating >= filters.rating!);
    }

    // Filter by location
    if (filters.location) {
      filteredResults = filteredResults.filter(item =>
        item.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Filter by price range (basic implementation)
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filteredResults = filteredResults.filter(item => {
        const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        return price >= min && price <= max;
      });
    }

    return filteredResults;
  };

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    hasSearched,
    
    // Actions
    setSearchQuery,
    clearSearch,
    search,
    
    // Utils
    getFilteredResults,
  };
}