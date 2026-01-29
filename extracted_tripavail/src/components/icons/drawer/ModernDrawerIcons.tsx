import { motion } from 'motion/react';
import { 
  BarChart3, UserCircle, MapPin, Heart, Shield, 
  HeadphonesIcon, Building2, Package2, ShieldCheck,
  Calendar, BookOpen, FileText
} from 'lucide-react';

interface ModernIconProps {
  className?: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getIconSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return 'w-4 h-4';
    case 'lg': return 'w-6 h-6';
    default: return 'w-5 h-5';
  }
};

const getContainerSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return 'w-8 h-8';
    case 'lg': return 'w-12 h-12';
    default: return 'w-10 h-10';
  }
};

// Dashboard Icon
export const ModernDashboardIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <BarChart3 className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Profile Icon
export const ModernProfileIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <UserCircle className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Trips Icon
export const ModernTripsIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
        : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <MapPin className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Wishlist Icon
export const ModernWishlistIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' 
        : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Heart className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Settings Icon
export const ModernSettingsIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #00D4AA 0%, #00C298 100%)' 
        : 'linear-gradient(135deg, #00D4AA 0%, #00C298 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Shield className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Help Icon
export const ModernHelpIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' 
        : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <HeadphonesIcon className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Hotel Icon
export const ModernHotelIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' 
        : 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Building2 className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Package Icon
export const ModernPackageIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' 
        : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Package2 className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Verification Icon
export const ModernVerificationIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' 
        : 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <ShieldCheck className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Calendar Icon
export const ModernCalendarIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' 
        : 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Calendar className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Bookings Icon
export const ModernBookingsIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' 
        : 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <BookOpen className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Legal Icon
export const ModernLegalIcon = ({ className = '', isActive = false, size = 'md' }: ModernIconProps) => (
  <motion.div
    className={`${getContainerSize(size)} rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' 
        : 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      opacity: isActive ? 1 : 0.8
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <FileText className={`${getIconSize(size)} text-white`} />
  </motion.div>
);

// Export all icons for easy import
export const ModernDrawerIcons = {
  Dashboard: ModernDashboardIcon,
  Profile: ModernProfileIcon,
  Trips: ModernTripsIcon,
  Wishlist: ModernWishlistIcon,
  Settings: ModernSettingsIcon,
  Help: ModernHelpIcon,
  Hotel: ModernHotelIcon,
  Package: ModernPackageIcon,
  Verification: ModernVerificationIcon,
  Calendar: ModernCalendarIcon,
  Bookings: ModernBookingsIcon,
  Legal: ModernLegalIcon,
};