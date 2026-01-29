import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import {
  PoolIcon,
  HotTubIcon,
  BBQGrillIcon,
  FirePitIcon,
  PoolTableIcon,
  PianoIcon,
  GymIcon,
  BeachfrontIcon,
  MountainViewIcon,
  LakeAccessIcon,
  PatioIcon,
  OutdoorDiningIcon,
  IndoorBonfireIcon,
  ScenicBalconyIcon,
  ForestViewIcon,
  WiFiIcon,
  TVIcon,
  KitchenIcon,
  WashingMachineIcon,
  ParkingIcon,
  AirConditioningIcon,
  DedicatedWorkspaceIcon
} from '../../../components/icons/amenities/PremiumAmenityIcons';

// Hook to detect dark mode
const useDarkModeDetect = () => {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  return isDark;
};

interface SmartAmenitiesSelectorProps {
  selectedAmenities: string[];
  onSelectionChange: (amenities: string[]) => void;
}

interface AmenityItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category?: string; // Which detailed category it belongs to
}

const STANDOUT_AMENITIES: AmenityItem[] = [
  { id: 'pool', name: 'Pool', icon: PoolIcon },
  { id: 'hot_tub', name: 'Hot Tub', icon: HotTubIcon },
  { id: 'patio', name: 'Patio', icon: PatioIcon },
  { id: 'bbq_grill', name: 'BBQ Grill', icon: BBQGrillIcon },
  { id: 'outdoor_dining', name: 'Outdoor Dining', icon: OutdoorDiningIcon },
  { id: 'fire_pit', name: 'Fire Pit', icon: FirePitIcon },
  { id: 'pool_table', name: 'Pool Table', icon: PoolTableIcon },
  { id: 'indoor_bonfire', name: 'Indoor Bonfire', icon: IndoorBonfireIcon },
  { id: 'piano', name: 'Piano', icon: PianoIcon },
  { id: 'gym', name: 'Gym', icon: GymIcon },
  { id: 'lake_access', name: 'Lake Access', icon: LakeAccessIcon },
  { id: 'beachfront', name: 'Beachfront', icon: BeachfrontIcon },
  { id: 'mountain_view', name: 'Mountain View', icon: MountainViewIcon },
  { id: 'scenic_balcony', name: 'Scenic Balcony', icon: ScenicBalconyIcon },
  { id: 'forest_view', name: 'Forest/Jungle View', icon: ForestViewIcon },
];

const GUEST_ESSENTIALS: AmenityItem[] = [
  { id: 'wifi', name: 'WiFi', icon: WiFiIcon, category: 'internet_technology' },
  { id: 'tv', name: 'TV', icon: TVIcon, category: 'entertainment' },
  { id: 'kitchen', name: 'Kitchen', icon: KitchenIcon, category: 'kitchen_dining' },
  { id: 'washing_machine', name: 'Washing Machine', icon: WashingMachineIcon, category: 'laundry' },
  { id: 'free_parking', name: 'Free Parking', icon: ParkingIcon, category: 'parking' },
  { id: 'paid_parking', name: 'Paid Parking', icon: ParkingIcon, category: 'parking' },
  { id: 'air_conditioning', name: 'Air Conditioning', icon: AirConditioningIcon, category: 'climate' },
  { id: 'dedicated_workspace', name: 'Workspace', icon: DedicatedWorkspaceIcon, category: 'workspace' },
];

interface SmartAmenitiesSelectorPropsExtended extends SmartAmenitiesSelectorProps {
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
  categoryRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

export default function SmartAmenitiesSelector({ 
  selectedAmenities, 
  onSelectionChange,
  expandedCategories,
  onToggleCategory,
  categoryRefs
}: SmartAmenitiesSelectorPropsExtended) {
  
  // Local refs if not provided from parent
  const localRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const refs = categoryRefs || localRefs;
  
  const toggleAmenity = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    
    if (isSelected) {
      onSelectionChange(selectedAmenities.filter(id => id !== amenityId));
    } else {
      onSelectionChange([...selectedAmenities, amenityId]);
    }
  };

  const AmenityCard = ({ amenity, isSelected }: { amenity: AmenityItem; isSelected: boolean }) => {
    const Icon = amenity.icon;
    
    return (
      <motion.button
        onClick={() => toggleAmenity(amenity.id)}
        className={`relative ${
          isSelected
            ? 'border-[1.5px]'
            : 'border'
        }`}
        style={{
          width: '100%',
          maxWidth: '160px',
          height: '130px',
          padding: '20px 12px',
          borderRadius: '8px',
          borderColor: isSelected ? '#000000' : '#E0E0E0',
          background: '#FFFFFF',
          transition: 'border-color 0.2s ease, border-width 0.2s ease'
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Vertically Stacked: Icon Above Text, Both Centered */}
        <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
          {/* Icon - 40x40px with scale animation on selection */}
          <motion.div
            className="flex-shrink-0"
            animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Icon isSelected={false} isHovered={false} size={40} />
          </motion.div>

          {/* Amenity Name - Centered */}
          <div className="text-center">
            <h4 
              style={{
                fontSize: '15px',
                lineHeight: '20px',
                fontWeight: isSelected ? 500 : 400,
                color: '#1A1A1A'
              }}
            >
              {amenity.name}
            </h4>
          </div>
        </div>
      </motion.button>
    );
  };

  const isStandoutExpanded = expandedCategories.includes('🌟 Standout Amenities');
  const isEssentialsExpanded = expandedCategories.includes('⭐ Guest Essentials');

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Standout Amenities Section - Collapsible Card */}
      <motion.div
        ref={(el) => refs.current['🌟 Standout Amenities'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <div className="overflow-hidden shadow-none border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => onToggleCategory('🌟 Standout Amenities')}
            className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            style={{ borderBottom: isStandoutExpanded ? '1px solid #EAEAEA' : 'none' }}
          >
            <div className="flex items-center justify-between">
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                🌟 Standout Amenities
              </h3>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                  {selectedAmenities.filter(id => STANDOUT_AMENITIES.find(a => a.id === id)).length}/{STANDOUT_AMENITIES.length}
                </span>
                <motion.div
                  animate={{ rotate: isStandoutExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isStandoutExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2" style={{ gap: '18px 12px', padding: '20px' }}>
                  {STANDOUT_AMENITIES.map((amenity) => (
                    <AmenityCard
                      key={amenity.id}
                      amenity={amenity}
                      isSelected={selectedAmenities.includes(amenity.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Guest Essentials Section - Collapsible Card */}
      <motion.div
        ref={(el) => refs.current['⭐ Guest Essentials'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ marginBottom: '32px' }}
      >
        <div className="overflow-hidden shadow-none border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => onToggleCategory('⭐ Guest Essentials')}
            className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            style={{ borderBottom: isEssentialsExpanded ? '1px solid #EAEAEA' : 'none' }}
          >
            <div className="flex items-center justify-between">
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                ⭐ Guest Essentials
              </h3>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                  {selectedAmenities.filter(id => GUEST_ESSENTIALS.find(a => a.id === id)).length}/{GUEST_ESSENTIALS.length}
                </span>
                <motion.div
                  animate={{ rotate: isEssentialsExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isEssentialsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2" style={{ gap: '18px 12px', padding: '20px' }}>
                  {GUEST_ESSENTIALS.map((amenity) => (
                    <AmenityCard
                      key={amenity.id}
                      amenity={amenity}
                      isSelected={selectedAmenities.includes(amenity.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
