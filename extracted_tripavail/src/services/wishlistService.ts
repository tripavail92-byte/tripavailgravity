// Wishlist Service for managing user's saved packages
export class WishlistService {
  private static instance: WishlistService;
  private wishlist: Set<string> = new Set();
  private subscribers: ((packageId: string, isWishlisted: boolean) => void)[] = [];

  private constructor() {
    // Load wishlist from localStorage on initialization
    this.loadWishlist();
    
    // Add some test data if wishlist is empty (for development/demo purposes)
    if (this.wishlist.size === 0) {
      this.addTestData();
    }
  }

  // Add test data for development/demo purposes
  private addTestData(): void {
    const testPackages = ['paradise-beach-1', 'luxury-resort-2', 'romantic-suite-5'];
    testPackages.forEach(packageId => {
      this.wishlist.add(packageId);
    });
    this.saveWishlist();
  }

  static getInstance(): WishlistService {
    if (!WishlistService.instance) {
      WishlistService.instance = new WishlistService();
    }
    return WishlistService.instance;
  }

  // Load wishlist from localStorage
  private loadWishlist(): void {
    try {
      const stored = localStorage.getItem('tripavail_wishlist');
      if (stored) {
        const wishlistArray = JSON.parse(stored);
        this.wishlist = new Set(wishlistArray);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      this.wishlist = new Set();
    }
  }

  // Save wishlist to localStorage
  private saveWishlist(): void {
    try {
      const wishlistArray = Array.from(this.wishlist);
      localStorage.setItem('tripavail_wishlist', JSON.stringify(wishlistArray));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  }

  // Add package to wishlist
  addToWishlist(packageId: string): void {
    if (!this.wishlist.has(packageId)) {
      this.wishlist.add(packageId);
      this.saveWishlist();
      this.notifySubscribers(packageId, true);
    }
  }

  // Remove package from wishlist
  removeFromWishlist(packageId: string): void {
    if (this.wishlist.has(packageId)) {
      this.wishlist.delete(packageId);
      this.saveWishlist();
      this.notifySubscribers(packageId, false);
    }
  }

  // Toggle package in wishlist
  toggleWishlist(packageId: string): boolean {
    const isCurrentlyWishlisted = this.isWishlisted(packageId);
    if (isCurrentlyWishlisted) {
      this.removeFromWishlist(packageId);
    } else {
      this.addToWishlist(packageId);
    }
    return !isCurrentlyWishlisted;
  }

  // Check if package is in wishlist
  isWishlisted(packageId: string): boolean {
    return this.wishlist.has(packageId);
  }

  // Get all wishlisted packages
  getWishlist(): string[] {
    return Array.from(this.wishlist);
  }

  // Get wishlist count
  getWishlistCount(): number {
    return this.wishlist.size;
  }

  // Clear entire wishlist
  clearWishlist(): void {
    const previousWishlist = Array.from(this.wishlist);
    this.wishlist.clear();
    this.saveWishlist();
    
    // Notify all subscribers that packages were removed
    previousWishlist.forEach(packageId => {
      this.notifySubscribers(packageId, false);
    });
  }

  // Subscribe to wishlist changes
  subscribe(callback: (packageId: string, isWishlisted: boolean) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Notify all subscribers of changes
  private notifySubscribers(packageId: string, isWishlisted: boolean): void {
    this.subscribers.forEach(callback => {
      try {
        callback(packageId, isWishlisted);
      } catch (error) {
        console.error('Error in wishlist subscriber:', error);
      }
    });
  }

  // Export wishlist data (for backup/sync purposes)
  exportWishlist(): { packages: string[]; exportDate: string } {
    return {
      packages: Array.from(this.wishlist),
      exportDate: new Date().toISOString()
    };
  }

  // Import wishlist data (for restore/sync purposes)
  importWishlist(data: { packages: string[] }): void {
    try {
      const previousWishlist = new Set(this.wishlist);
      this.wishlist = new Set(data.packages);
      this.saveWishlist();

      // Notify about changes
      const newWishlist = this.wishlist;
      
      // Notify about removed items
      previousWishlist.forEach(packageId => {
        if (!newWishlist.has(packageId)) {
          this.notifySubscribers(packageId, false);
        }
      });

      // Notify about added items
      newWishlist.forEach(packageId => {
        if (!previousWishlist.has(packageId)) {
          this.notifySubscribers(packageId, true);
        }
      });
    } catch (error) {
      console.error('Error importing wishlist:', error);
    }
  }
}

// Export singleton instance
export const wishlistService = WishlistService.getInstance();