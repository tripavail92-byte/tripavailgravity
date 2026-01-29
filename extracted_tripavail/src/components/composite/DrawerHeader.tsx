import { motion } from 'motion/react';
import { Edit2, MapPin, Building, Plane } from 'lucide-react';
import { ProfileAvatar } from '../ProfileAvatar';
import { VerifiedPill } from './VerifiedPill';
import type { DrawerMeta } from '../../modules/types/drawer';
import type { UserRole } from '../../lib/types';

interface DrawerHeaderProps {
  meta: DrawerMeta;
  role: UserRole;
  onEditProfile?: () => void;
}

export function DrawerHeader({ meta, role, onEditProfile }: DrawerHeaderProps) {
  const getRoleIcon = () => {
    switch (role) {
      case 'hotel_manager':
        return Building;
      case 'tour_operator':
        return Plane;
      default:
        return MapPin;
    }
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'hotel_manager':
        return 'Hotel Manager';
      case 'tour_operator':
        return 'Tour Operator';
      default:
        return 'Traveler';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Profile Header */}
      <div className="flex items-start gap-3 mb-4">
        <ProfileAvatar name={meta.userName} />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">{meta.userName}</h3>
            <button 
              onClick={onEditProfile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">{meta.userEmail}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground mb-2">
            <RoleIcon className="w-4 h-4" />
            <span>{getRoleDisplayName()} • {meta.userLocation}</span>
          </div>
          <VerifiedPill isVerified={meta.isVerified} />
        </div>
      </div>

      {/* Profile Completion */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-foreground">Profile Completion</span>
          <span className="text-sm font-semibold text-[#DB2777]">{meta.profileCompletion}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div 
            className="h-2 rounded-full bg-gradient-to-r from-[#DB2777] to-[#7C3AED]"
            initial={{ width: 0 }}
            animate={{ width: `${meta.profileCompletion}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}