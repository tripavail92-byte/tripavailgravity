import React from 'react';
import {
  Wifi, Waves, Dumbbell, Flower2, Utensils, Wine, Car, Clock, Plane, Bell,
  Shirt, Briefcase, Presentation, AirVent, Tv, Refrigerator, Lock, Coffee,
  Wind, Laptop, Palmtree, Sparkles, Home, MoveHorizontal, Baby, Gamepad2,
  Heart, Accessibility, MoveVertical, Map, Music, Trophy, Mountain,
  MountainSnow, ChefHat, Leaf, Flame, Thermometer, User, Hand,
  Scissors, Star, Users, Bed, Activity, Target
} from 'lucide-react';

interface AmenityIconProps {
  name: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  // Property Amenities
  wifi: Wifi,
  waves: Waves,
  dumbbell: Dumbbell,
  'flower-2': Flower2,
  utensils: Utensils,
  wine: Wine,
  car: Car,
  clock: Clock,
  plane: Plane,
  bell: Bell,
  shirt: Shirt,
  briefcase: Briefcase,
  presentation: Presentation,
  
  // Room Amenities
  'air-vent': AirVent,
  tv: Tv,
  refrigerator: Refrigerator,
  lock: Lock,
  coffee: Coffee,
  wind: Wind,
  laptop: Laptop,
  palmtree: Palmtree,
  sparkles: Sparkles,
  
  // Family & Accessibility
  home: Home,
  'move-horizontal': MoveHorizontal,
  baby: Baby,
  'gamepad-2': Gamepad2,
  heart: Heart,
  accessibility: Accessibility,
  'move-vertical': MoveVertical,
  
  // Activities
  map: Map,
  music: Music,
  trophy: Trophy,
  mountain: Mountain,
  'mountain-snow': MountainSnow,
  golf: Target,
  
  // Food & Beverage
  'chef-hat': ChefHat,
  leaf: Leaf,
  flame: Flame,
  
  // Wellness
  thermometer: Thermometer,
  user: User,
  hand: Hand,
  scissors: Scissors,
  
  // General
  star: Star,
  users: Users,
  bed: Bed,
  activity: Activity,
  hotel: Home, // Using Home as hotel icon
};

export function AmenityIcon({ name, className = "w-5 h-5" }: AmenityIconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    // Fallback to Star if icon not found
    return <Star className={className} />;
  }
  
  return <IconComponent className={className} />;
}