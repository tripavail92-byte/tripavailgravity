import { supabase } from './supabase';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'tour' | 'package';
  created_at: string;
}

// Simple localStorage-based fallback for guests
const LOCAL_STORAGE_KEY = 'tripavail_wishlist';

export const wishlistService = {
  /**
   * Toggle an item in the wishlist
   * If authenticated, uses Supabase. If guest, uses localStorage.
   */
  async toggleWishlist(itemId: string, itemType: 'tour' | 'package', userId?: string) {
    if (userId) {
      // Authenticated flow
      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return false; // Removed
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType
          });
        if (error) throw error;
        return true; // Added
      }
    } else {
      // Guest flow (localStorage)
      const wishlist = this.getLocalWishlist();
      const existingIndex = wishlist.findIndex(item => item.item_id === itemId);
      
      if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishlist));
        return false;
      } else {
        wishlist.push({ item_id: itemId, item_type: itemType });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishlist));
        return true;
      }
    }
  },

  /**
   * Get all wishlisted items
   */
  async getWishlist(userId?: string): Promise<{ item_id: string; item_type: 'tour' | 'package' }[]> {
    if (userId) {
      const { data, error } = await supabase
        .from('wishlist')
        .select('item_id, item_type')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as { item_id: string; item_type: 'tour' | 'package' }[];
    } else {
      return this.getLocalWishlist();
    }
  },

  /**
   * Check if an item is wishlisted
   */
  async isWishlisted(itemId: string, userId?: string): Promise<boolean> {
    const list = await this.getWishlist(userId);
    return list.some(item => item.item_id === itemId);
  },

  /**
   * Internal: Get wishlist from localStorage
   */
  getLocalWishlist(): { item_id: string; item_type: 'tour' | 'package' }[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Sync local wishlist to Supabase on login
   */
  async syncWishlist(userId: string) {
    const localItems = this.getLocalWishlist();
    if (localItems.length === 0) return;

    try {
      const { data: remoteItems } = await supabase
        .from('wishlist')
        .select('item_id')
        .eq('user_id', userId);

      const remoteIds = new Set((remoteItems || []).map(i => i.item_id));
      const newItems = localItems
        .filter(item => !remoteIds.has(item.item_id))
        .map(item => ({
          user_id: userId,
          item_id: item.item_id,
          item_type: item.item_type
        }));

      if (newItems.length > 0) {
        await supabase.from('wishlist').insert(newItems);
      }

      // Clear local storage after sync
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error syncing wishlist:', error);
    }
  }
};
