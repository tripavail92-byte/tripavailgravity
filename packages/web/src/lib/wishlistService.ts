// Simple localStorage-based wishlist service
export const wishlistService = {
  toggleWishlist: (id: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const index = wishlist.indexOf(id)
    if (index > -1) {
      wishlist.splice(index, 1)
    } else {
      wishlist.push(id)
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  },

  getWishlist: (): string[] => {
    return JSON.parse(localStorage.getItem('wishlist') || '[]')
  },

  isWishlisted: (id: string): boolean => {
    const wishlist = wishlistService.getWishlist()
    return wishlist.includes(id)
  },
}
