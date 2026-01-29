import { motion } from 'motion/react';
import { 
  Home, 
  Building2, 
  Plane, 
  MessageCircle, 
  User, 
  Calendar, 
  BookOpen, 
  Settings,
  BarChart3,
  Star,
  ShieldCheck,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ICON_COLORS } from '../../lib/constants';

type IconType = 'home' | 'hotels' | 'tours' | 'messages' | 'profile' | 'settings' | 
               'calendar' | 'bookings' | 'dashboard' | 'reviews' | 'verification' | 
               'plan-trip' | 'help' | 'legal';

interface HotelManagerSmartIconProps {
  type: IconType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  isHovered?: boolean;
  className?: string;
}

const IconComponent = {
  home: Home,
  hotels: Building2,
  tours: Plane,
  messages: MessageCircle,
  profile: User,
  settings: Settings,
  calendar: Calendar,
  bookings: BookOpen,
  dashboard: BarChart3,
  reviews: Star,
  verification: ShieldCheck,
  'plan-trip': Home,
  help: HelpCircle,
  legal: FileText,
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function HotelManagerSmartIcon({
  type,
  size = 'md',
  isSelected = false,
  isHovered = false,
  className = ''
}: HotelManagerSmartIconProps) {
  const Icon = IconComponent[type];
  
  const getIconColor = () => {
    if (isSelected || isHovered) {
      switch (type) {
        case 'home':
        case 'dashboard':
          return ICON_COLORS.LIME;
        case 'hotels':
        case 'calendar':
        case 'reviews':
          return ICON_COLORS.CORAL;
        case 'tours':
        case 'bookings':
        case 'help':
          return ICON_COLORS.MAUVE;
        case 'messages':
        case 'settings':
        case 'verification':
        case 'legal':
          return ICON_COLORS.BURGUNDY;
        case 'profile':
        case 'plan-trip':
          return ICON_COLORS.LIME;
        default:
          return ICON_COLORS.CORAL;
      }
    }
    return isHovered ? ICON_COLORS.HOVER : ICON_COLORS.DEFAULT;
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{
        scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: 0.2 
      }}
    >
      <Icon
        className={`${sizeClasses[size]} transition-colors duration-200`}
        style={{ color: getIconColor() }}
        strokeWidth={isSelected ? 2.5 : 2}
      />
    </motion.div>
  );
}