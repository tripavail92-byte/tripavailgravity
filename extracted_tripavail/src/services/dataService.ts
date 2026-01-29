// Data Service - Mock data and API simulation for TripAvail

import type { Hotel, Tour, SliderImage, ApiResponse, PaginatedResponse } from '../lib/types';
import { sleep } from '../lib/utils';

// Mock Data
const FEATURED_HOTELS: Hotel[] = [
  {
    id: '1',
    title: "Luxury Beach Resort",
    location: "Maldives",
    image: "https://images.unsplash.com/photo-1731080647266-85cf1bc27162?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJlc29ydHxlbnwxfHx8fDE3NTY4MzA1MjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.9,
    price: "$850",
    type: "hotel",
    description: "Luxury beachfront resort with world-class amenities and stunning ocean views.",
    amenities: ["Pool", "Spa", "Restaurant", "Beach Access", "WiFi"],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    title: "Boutique City Hotel",
    location: "Paris, France",
    image: "https://images.unsplash.com/photo-1649731000184-7ced04998f44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsfGVufDF8fHx8MTc1Njg4NTA5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.7,
    price: "$320",
    type: "hotel",
    description: "Charming boutique hotel in the heart of Paris with elegant French decor.",
    amenities: ["WiFi", "Restaurant", "Concierge", "Room Service"],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-28'),
  },
  {
    id: '3',
    title: "Modern Downtown Hotel",
    location: "New York, USA",
    image: "https://images.unsplash.com/photo-1694595437436-2ccf5a95591f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjBtb2Rlcm58ZW58MXx8fHwxNzU2OTIwOTU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.6,
    price: "$280",
    type: "hotel",
    description: "Modern hotel in downtown Manhattan with business facilities.",
    amenities: ["WiFi", "Gym", "Business Center", "Restaurant", "Bar"],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-11-30'),
  },
];

const ALL_HOTELS: Hotel[] = [
  ...FEATURED_HOTELS,
  {
    id: '4',
    title: "Mountain Lodge",
    location: "Swiss Alps",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2lzcyUyMGFscHMlMjBtb3VudGFpbnN8ZW58MXx8fHwxNzU2ODMyNzAxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    price: "$450",
    type: "hotel",
    description: "Cozy mountain lodge with spectacular alpine views and ski access.",
    amenities: ["Ski Access", "Fireplace", "Restaurant", "Spa", "WiFi"],
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-12-02'),
  },
  {
    id: '5',
    title: "Island Resort",
    location: "Bali, Indonesia",
    image: "https://images.unsplash.com/photo-1604394089666-6d365c060c6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhJTIwdGVtcGxlfGVufDF8fHx8MTc1Njg4NDE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.6,
    price: "$380",
    type: "hotel",
    description: "Tropical island resort with private villas and cultural experiences.",
    amenities: ["Pool", "Spa", "Beach Access", "Cultural Tours", "WiFi"],
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-11-25'),
  },
];

const FEATURED_TOURS: Tour[] = [
  {
    id: '6',
    title: "Mountain Adventure Trek",
    location: "Nepal Himalayas",
    image: "https://images.unsplash.com/photo-1532370184535-22cec5ca8480?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZSUyMHRvdXJ8ZW58MXx8fHwxNzU2OTIwOTQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.8,
    price: "$1,200",
    type: "tour",
    description: "Epic 14-day trek through the Himalayas with experienced guides.",
    duration: "14 days",
    maxGroupSize: 12,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-11-29'),
  },
  {
    id: '7',
    title: "African Safari Experience",
    location: "Kenya",
    image: "https://images.unsplash.com/photo-1548442197-ac7a077df845?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZhcmklMjB0b3VyJTIwYWZyaWNhfGVufDF8fHx8MTc1NjkyMDk0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.9,
    price: "$2,500",
    type: "tour",
    description: "7-day safari adventure in Kenya's most famous national parks.",
    duration: "7 days",
    maxGroupSize: 8,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: '8',
    title: "Cultural Heritage Tour",
    location: "Ancient Temples",
    image: "https://images.unsplash.com/photo-1685999167965-d197820d4ef7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWx0dXJhbCUyMHRvdXIlMjB0ZW1wbGV8ZW58MXx8fHwxNzU2OTIwOTUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.7,
    price: "$899",
    type: "tour",
    description: "Explore ancient temples and cultural heritage sites with expert guides.",
    duration: "5 days",
    maxGroupSize: 15,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-27'),
  },
];

const ALL_TOURS: Tour[] = [
  ...FEATURED_TOURS,
  {
    id: '9',
    title: "Arctic Expedition",
    location: "Iceland",
    image: "https://images.unsplash.com/photo-1610123598147-f632aa18b275?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VsYW5kJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1NjkxODM0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4.7,
    price: "$1,850",
    type: "tour",
    description: "10-day Arctic adventure exploring glaciers and Northern Lights.",
    duration: "10 days",
    maxGroupSize: 10,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-11-28'),
  },
  {
    id: '10',
    title: "Desert Adventure",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHNreWxpbmV8ZW58MXx8fHwxNzU2ODMyNzAxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.5,
    price: "$650",
    type: "tour",
    description: "3-day desert adventure with camel rides and luxury camping.",
    duration: "3 days",
    maxGroupSize: 20,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-11-26'),
  },
];

const SLIDER_IMAGES: SliderImage[] = [
  {
    id: 'slide-1',
    title: 'Paradise Beach Resort',
    subtitle: 'Discover luxury by the ocean',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    cta: 'Book Now',
  },
  {
    id: 'slide-2',
    title: 'Himalayan Adventure Trek',
    subtitle: 'Conquer the highest peaks',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    cta: 'Join Trek',
  },
  {
    id: 'slide-3',
    title: 'Metropolitan Luxury Suite',
    subtitle: 'Business class comfort in the city',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    cta: 'Reserve Now',
  },
  {
    id: 'slide-4',
    title: 'African Safari Experience',
    subtitle: 'Wildlife adventure of a lifetime',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
    cta: 'Book Safari',
  },
  {
    id: 'slide-5',
    title: 'Ancient Temples Discovery',
    subtitle: 'Explore cultural heritage sites',
    image: 'https://images.unsplash.com/photo-1554855422-e8b7eb65cec2?auto=format&fit=crop&w=1200&q=80',
    cta: 'Start Journey',
  },
];

// API Service Class
export class DataService {
  // Simulate API delay
  private async simulateDelay(ms: number = 500): Promise<void> {
    await sleep(ms);
  }

  // Hotels API
  async getFeaturedHotels(): Promise<ApiResponse<Hotel[]>> {
    await this.simulateDelay();
    return {
      data: FEATURED_HOTELS,
      success: true,
      message: 'Featured hotels retrieved successfully',
    };
  }

  async getAllHotels(page = 1, limit = 12): Promise<PaginatedResponse<Hotel>> {
    await this.simulateDelay();
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = ALL_HOTELS.slice(start, end);
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: ALL_HOTELS.length,
        hasMore: end < ALL_HOTELS.length,
      },
    };
  }

  async getHotelById(id: string): Promise<ApiResponse<Hotel | null>> {
    await this.simulateDelay();
    const hotel = ALL_HOTELS.find(h => h.id === id);
    return {
      data: hotel || null,
      success: !!hotel,
      message: hotel ? 'Hotel found' : 'Hotel not found',
    };
  }

  // Tours API
  async getFeaturedTours(): Promise<ApiResponse<Tour[]>> {
    await this.simulateDelay();
    return {
      data: FEATURED_TOURS,
      success: true,
      message: 'Featured tours retrieved successfully',
    };
  }

  async getAllTours(page = 1, limit = 12): Promise<PaginatedResponse<Tour>> {
    await this.simulateDelay();
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = ALL_TOURS.slice(start, end);
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: ALL_TOURS.length,
        hasMore: end < ALL_TOURS.length,
      },
    };
  }

  async getTourById(id: string): Promise<ApiResponse<Tour | null>> {
    await this.simulateDelay();
    const tour = ALL_TOURS.find(t => t.id === id);
    return {
      data: tour || null,
      success: !!tour,
      message: tour ? 'Tour found' : 'Tour not found',
    };
  }

  // Search API
  async searchItems(query: string, category: 'all' | 'hotels' | 'tours' = 'all'): Promise<ApiResponse<(Hotel | Tour)[]>> {
    await this.simulateDelay(300);
    
    let items: (Hotel | Tour)[] = [];
    
    switch (category) {
      case 'hotels':
        items = ALL_HOTELS;
        break;
      case 'tours':
        items = ALL_TOURS;
        break;
      default:
        items = [...ALL_HOTELS, ...ALL_TOURS];
    }

    const filteredItems = items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filteredItems,
      success: true,
      message: `Found ${filteredItems.length} results`,
    };
  }

  // Slider Images API
  async getSliderImages(): Promise<ApiResponse<SliderImage[]>> {
    await this.simulateDelay(200);
    return {
      data: SLIDER_IMAGES,
      success: true,
      message: 'Slider images retrieved successfully',
    };
  }

  // Contact API
  async submitContactForm(data: { name: string; email: string; message: string; subject: string }): Promise<ApiResponse<null>> {
    await this.simulateDelay(1000);
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      data: null,
      success,
      message: success ? 'Message sent successfully!' : 'Failed to send message. Please try again.',
    };
  }
}

// Export singleton instance
export const dataService = new DataService();