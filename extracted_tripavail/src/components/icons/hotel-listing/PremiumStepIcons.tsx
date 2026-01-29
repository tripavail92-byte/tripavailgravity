import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface IconProps {
  size?: number;
  isActive?: boolean;
}

// Hook to detect dark mode
const useDarkMode = () => {
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

// Color helper function - returns lighter colors for dark mode
const getStrokeColor = (isDark: boolean, type: 'primary' | 'secondary' = 'primary') => {
  if (type === 'primary') {
    return isDark ? '#E5E5E5' : '#666666'; // Much lighter in dark mode
  }
  return isDark ? '#B8B8B8' : '#888888'; // Lighter secondary color in dark mode
};

const getFillColor = (isDark: boolean) => {
  return isDark ? '#D1D1D1' : '#666666';
};

// Property types that will cycle
const PROPERTY_TYPES = [
  { name: 'Hotel', floors: 5 },
  { name: 'Inn', floors: 3 },
  { name: 'Resort', floors: 4 },
  { name: 'Motel', floors: 2 },
  { name: 'Lodge', floors: 3 },
  { name: 'Boutique', floors: 4 },
  { name: 'Hostel', floors: 3 },
  { name: 'Guesthouse', floors: 2 }
];

export const PremiumPropertyTypeIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROPERTY_TYPES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentType = PROPERTY_TYPES[currentIndex];
  const floors = currentType.floors;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="35" ry="8" fill={isDark ? "#FFFFFF" : "#000000"} opacity="0.08" />
      
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Building - Outline only */}
          <rect 
            x="25" 
            y={100 - floors * 12} 
            width="70" 
            height={floors * 12} 
            rx="4" 
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')} 
            strokeWidth="2"
          />
          
          {/* Windows - Grid Pattern */}
          {Array.from({ length: floors }).map((_, floor) =>
            [0, 1, 2, 3].map((col) => (
              <motion.rect
                key={`${floor}-${col}`}
                x={32 + col * 14}
                y={95 - floor * 12}
                width="8"
                height="6"
                rx="1"
                fill="none"
                stroke={getStrokeColor(isDark, 'secondary')}
                strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 1] }}
                transition={{ 
                  duration: 2,
                  delay: floor * 0.2 + col * 0.1,
                }}
              />
            ))
          )}
          
          {/* Entrance Door - Outline */}
          <rect 
            x="52" 
            y="88" 
            width="16" 
            height="12" 
            rx="2" 
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')} 
            strokeWidth="2"
          />
          
          {/* Property Type Label */}
          <motion.text
            x="60"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentType.name}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + i * 20}
          cy={35}
          r="1.5"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{ 
            y: [0, -12, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity
          }}
        />
      ))}
    </motion.svg>
  );
};

export const PremiumLocationIcon = ({ size = 80, isActive = false }: IconProps) => {
  const isDark = useDarkMode();
  
  // Pin positions on the globe (angle, delay)
  const pinPositions = [
    { x: 45, y: 48, delay: 0 },
    { x: 35, y: 56, delay: 0.8 },
    { x: 52, y: 60, delay: 1.6 },
    { x: 42, y: 64, delay: 2.4 },
  ];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="30" ry="7" fill={isDark ? "#FFFFFF" : "#000000"} opacity="0.08" />
      
      {/* Main Globe Circle - Outline */}
      <motion.circle 
        cx="45" 
        cy="56" 
        r="20" 
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Rotating Globe with Longitude and Latitude Lines */}
      <motion.g
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ originX: "45px", originY: "56px" }}
      >
        {/* LONGITUDE LINES (Vertical lines) */}
        
        {/* Center Meridian - Straight vertical line */}
        <line 
          x1="45" 
          y1="36" 
          x2="45" 
          y2="76" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="1.5"
        />
        
        {/* Left Longitude Lines - Curved */}
        <path
          d="M 35 36 Q 32 56 35 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />
        
        <path
          d="M 28 40 Q 25 56 28 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* Right Longitude Lines - Curved */}
        <path
          d="M 55 36 Q 58 56 55 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />
        
        <path
          d="M 62 40 Q 65 56 62 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* LATITUDE LINES (Horizontal lines) */}
        
        {/* Equator - Bold center line */}
        <line 
          x1="25" 
          y1="56" 
          x2="65" 
          y2="56" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="1.5"
        />
        
        {/* Northern Latitude - Curved horizontal */}
        <path
          d="M 28 46 Q 45 45 62 46"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />
        
        <path
          d="M 32 40 Q 45 39 58 40"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />
        
        {/* Southern Latitude - Curved horizontal */}
        <path
          d="M 28 66 Q 45 67 62 66"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />
        
        <path
          d="M 32 72 Q 45 73 58 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>
      
      {/* Map Pins Dropping onto Globe */}
      {pinPositions.map((pin, i) => (
        <motion.g
          key={i}
          animate={{
            y: [0, 0, 0],
            opacity: [0, 1, 1]
          }}
          transition={{
            duration: 3.2,
            delay: pin.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        >
          {/* Pin Drop Animation */}
          <motion.g
            animate={{
              y: [-30, 0],
              scale: [0.3, 1]
            }}
            transition={{
              duration: 0.6,
              delay: pin.delay,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: "easeOut"
            }}
          >
            {/* Pin Shape - Outline */}
            <path
              d={`M${pin.x} ${pin.y - 8} C${pin.x - 3} ${pin.y - 8} ${pin.x - 4} ${pin.y - 5} ${pin.x - 4} ${pin.y - 3} C${pin.x - 4} ${pin.y} ${pin.x} ${pin.y + 4} ${pin.x} ${pin.y + 4} C${pin.x} ${pin.y + 4} ${pin.x + 4} ${pin.y} ${pin.x + 4} ${pin.y - 3} C${pin.x + 4} ${pin.y - 5} ${pin.x + 3} ${pin.y - 8} ${pin.x} ${pin.y - 8}Z`}
              fill="none"
              stroke={getStrokeColor(isDark, 'primary')}
              strokeWidth="1.5"
            />
            
            {/* Pin Center Dot */}
            <circle 
              cx={pin.x} 
              cy={pin.y - 3} 
              r="1.5" 
              fill={getFillColor(isDark)}
            />
          </motion.g>
          
          {/* Impact Ripple when pin lands */}
          <motion.circle
            cx={pin.x}
            cy={pin.y + 4}
            r="3"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="1"
            fill="none"
            animate={{
              scale: [0, 2.5, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 0.8,
              delay: pin.delay + 0.6,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: "easeOut"
            }}
          />
        </motion.g>
      ))}
      
      {/* Pulsing Global Signal Rings */}
      {[...Array(2)].map((_, i) => (
        <motion.circle
          key={i}
          cx="45"
          cy="56"
          r="20"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1.5"
          fill="none"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{ 
            duration: 3,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Orbiting Satellite/Marker */}
      <motion.circle
        cx="65"
        cy="56"
        r="2"
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ originX: "45px", originY: "56px" }}
      />
      
      {/* Compass - Bottom Right */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {/* Compass Circle */}
        <circle 
          cx="72" 
          cy="70" 
          r="10" 
          fill="none" 
          stroke={getStrokeColor(isDark, 'primary')} 
          strokeWidth="1.5"
        />
        
        {/* Inner compass ring */}
        <circle 
          cx="72" 
          cy="70" 
          r="7" 
          fill="none" 
          stroke={getStrokeColor(isDark, 'secondary')} 
          strokeWidth="0.8"
          strokeDasharray="1 2"
        />
        
        {/* Compass Needle - Rotating */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ originX: "72px", originY: "70px" }}
        >
          {/* North Pointer - Red/Dark tip */}
          <path
            d="M 72 63 L 74 70 L 72 68 L 70 70 Z"
            fill={getFillColor(isDark)}
            stroke={getFillColor(isDark)}
            strokeWidth="0.5"
          />
          
          {/* South Pointer - Lighter */}
          <path
            d="M 72 77 L 74 70 L 72 72 L 70 70 Z"
            fill="none"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="0.8"
          />
        </motion.g>
        
        {/* Cardinal Direction Marks */}
        <text x="72" y="61" fontSize="5" fontWeight="600" fill={getFillColor(isDark)} textAnchor="middle">N</text>
      </motion.g>
    </motion.svg>
  );
};

// Amenities that will cycle
const AMENITIES = [
  { icon: 'wifi', label: 'WiFi' },
  { icon: 'pool', label: 'Pool' },
  { icon: 'gym', label: 'Gym' },
  { icon: 'spa', label: 'Spa' },
  { icon: 'restaurant', label: 'Restaurant' },
  { icon: 'parking', label: 'Parking' },
  { icon: 'ac', label: 'AC' },
  { icon: 'laundry', label: 'Laundry' }
];

export const PremiumAmenitiesIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AMENITIES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderAmenityIcon = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    const fill = getFillColor(isDark);
    
    switch (type) {
      case 'wifi':
        return (
          <motion.g>
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M${35 - i * 3} ${50 + i * 4} Q40 ${45 + i * 2} ${45 + i * 3} ${50 + i * 4}`}
                stroke={primary}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              />
            ))}
            <circle cx="40" cy="56" r="2" fill={fill} />
          </motion.g>
        );
      case 'pool':
        return (
          <motion.g>
            <rect x="25" y="48" width="30" height="16" rx="3" fill="none" stroke={primary} strokeWidth="2" />
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${28 + i * 8} ${56} Q${30 + i * 8} ${54} ${32 + i * 8} ${56}`}
                stroke={secondary}
                strokeWidth="1.5"
                fill="none"
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
      case 'gym':
        return (
          <motion.g>
            <rect x="30" y="52" width="20" height="3" rx="1.5" fill="none" stroke={primary} strokeWidth="2" />
            <circle cx="30" cy="53.5" r="4" fill="none" stroke={primary} strokeWidth="2" />
            <circle cx="50" cy="53.5" r="4" fill="none" stroke={primary} strokeWidth="2" />
          </motion.g>
        );
      case 'spa':
        return (
          <motion.g>
            <circle cx="40" cy="52" r="6" fill="none" stroke={primary} strokeWidth="2" />
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${36 + i * 3} ${45} Q${36 + i * 3} ${42} ${36 + i * 3} ${40}`}
                stroke={secondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{ opacity: [0, 0.8, 0], y: [0, -4, -8] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
      case 'restaurant':
        return (
          <motion.g>
            <path d="M35 45 L35 62" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <path d="M32 45 L32 50" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M38 45 L38 50" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M42 45 Q42 50 42 55 L42 62" stroke={primary} strokeWidth="2" fill="none" />
            <circle cx="42" cy="52" r="3" fill="none" stroke={primary} strokeWidth="1.5" />
          </motion.g>
        );
      case 'parking':
        return (
          <motion.g>
            <rect x="28" y="45" width="24" height="18" rx="2" fill="none" stroke={primary} strokeWidth="2" />
            <text x="40" y="58" fontSize="12" fontWeight="bold" fill={fill} textAnchor="middle">P</text>
          </motion.g>
        );
      case 'ac':
        return (
          <motion.g>
            <rect x="30" y="48" width="20" height="12" rx="2" fill="none" stroke={primary} strokeWidth="2" />
            {[...Array(3)].map((_, i) => (
              <motion.line
                key={i}
                x1={34 + i * 5}
                y1={62}
                x2={34 + i * 5}
                y2={68}
                stroke={secondary}
                strokeWidth="1.5"
                animate={{ y2: [68, 72, 68] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
      case 'laundry':
        return (
          <motion.g>
            <rect x="30" y="46" width="20" height="18" rx="2" fill="none" stroke={primary} strokeWidth="2" />
            <circle cx="40" cy="55" r="5" fill="none" stroke={secondary} strokeWidth="1.5" />
            <motion.circle
              cx="40"
              cy="55"
              r="3"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.g>
        );
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="30" ry="7" fill={isDark ? "#FFFFFF" : "#000000"} opacity="0.08" />
      
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Container circle */}
          <circle cx="40" cy="56" r="22" fill="none" stroke={getStrokeColor(isDark, 'secondary')} strokeWidth="1.5" strokeDasharray="4 4" />
          
          {/* Amenity icon */}
          {renderAmenityIcon(AMENITIES[currentIndex].icon)}
          
          {/* Label */}
          <motion.text
            x="40"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {AMENITIES[currentIndex].label}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Orbiting dots */}
      {[...Array(3)].map((_, i) => (
        <motion.circle
          key={i}
          cx="40"
          cy="34"
          r="2"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, delay: i * 0.3, repeat: Infinity }
          }}
          style={{ originX: "40px", originY: "56px" }}
        />
      ))}
    </motion.svg>
  );
};

// Photo sections that will cycle
const PHOTO_SECTIONS = [
  { name: 'Lobby', icon: 'lobby' },
  { name: 'Room', icon: 'room' },
  { name: 'Reception', icon: 'reception' },
  { name: 'Restaurant', icon: 'restaurant' },
  { name: 'Pool', icon: 'pool' },
  { name: 'Exterior', icon: 'exterior' }
];

export const PremiumPhotosIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHOTO_SECTIONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderPhotoSection = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    
    switch (type) {
      case 'lobby':
        return (
          <motion.g>
            {/* Chandelier */}
            <circle cx="45" cy="50" r="4" fill="none" stroke={primary} strokeWidth="1.5" />
            <line x1="45" y1="46" x2="45" y2="42" stroke={primary} strokeWidth="1.5" />
            {/* Furniture */}
            <rect x="38" y="58" width="6" height="8" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
            <rect x="48" y="58" width="6" height="8" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
      case 'room':
        return (
          <motion.g>
            {/* Bed */}
            <rect x="38" y="54" width="16" height="10" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            <rect x="38" y="50" width="16" height="4" rx="1" fill="none" stroke={secondary} strokeWidth="1.5" />
            {/* Pillow */}
            <rect x="40" y="52" width="5" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
          </motion.g>
        );
      case 'reception':
        return (
          <motion.g>
            {/* Desk */}
            <rect x="36" y="56" width="18" height="8" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            <line x1="38" y1="56" x2="38" y2="64" stroke={secondary} strokeWidth="1.5" />
            <line x1="52" y1="56" x2="52" y2="64" stroke={secondary} strokeWidth="1.5" />
            {/* Person */}
            <circle cx="46" cy="48" r="3" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
      case 'restaurant':
        return (
          <motion.g>
            {/* Table */}
            <circle cx="45" cy="58" r="8" fill="none" stroke={primary} strokeWidth="2" />
            {/* Plates */}
            <circle cx="42" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
            <circle cx="48" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        );
      case 'pool':
        return (
          <motion.g>
            {/* Pool */}
            <rect x="36" y="52" width="18" height="12" rx="2" fill="none" stroke={primary} strokeWidth="2" />
            {/* Water waves */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${38 + i * 5} ${58} Q${40 + i * 5} ${56} ${42 + i * 5} ${58}`}
                stroke={secondary}
                strokeWidth="1"
                fill="none"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        );
      case 'exterior':
        return (
          <motion.g>
            {/* Building outline */}
            <rect x="38" y="48" width="14" height="16" rx="1" fill="none" stroke={primary} strokeWidth="2" />
            <rect x="40" y="52" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="45" y="52" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="40" y="57" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
            <rect x="45" y="57" width="3" height="3" rx="0.5" fill="none" stroke={secondary} strokeWidth="1" />
          </motion.g>
        );
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="35" ry="8" fill={isDark ? "#FFFFFF" : "#000000"} opacity="0.08" />
      
      {/* Camera frame - Outline */}
      <rect x="28" y="42" width="34" height="26" rx="3" fill="none" stroke={getStrokeColor(isDark, 'primary')} strokeWidth="2" />
      
      {/* Lens */}
      <circle cx="45" cy="55" r="8" fill="none" stroke={getStrokeColor(isDark, 'secondary')} strokeWidth="2" />
      
      {/* Flash */}
      <motion.rect 
        x="54" 
        y="46" 
        width="5" 
        height="3" 
        rx="1" 
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Photo content cycling inside lens */}
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          {renderPhotoSection(PHOTO_SECTIONS[currentIndex].icon)}
        </motion.g>
      </AnimatePresence>
      
      {/* Section Label */}
      <motion.text
        key={`label-${currentIndex}`}
        x="45"
        y="25"
        fontSize="11"
        fontWeight="600"
        fill={getFillColor(isDark)}
        textAnchor="middle"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {PHOTO_SECTIONS[currentIndex].name}
      </motion.text>
      
      {/* Flash effect */}
      <motion.circle
        cx="45"
        cy="35"
        r="15"
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 2
        }}
      />
    </motion.svg>
  );
};

// Money saving concepts that will cycle
const PRICING_CONCEPTS = [
  { type: 'bills', label: 'Best Price' },
  { type: 'save', label: 'You Save' },
  { type: 'discount', label: 'Discount' },
  { type: 'coins', label: 'Value' }
];

export const PremiumPricingIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isDark = useDarkMode();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PRICING_CONCEPTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const renderPricingConcept = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary');
    const secondary = getStrokeColor(isDark, 'secondary');
    const fill = getFillColor(isDark);
    
    switch (type) {
      case 'bills':
        return (
          <motion.g>
            {[...Array(3)].map((_, i) => (
              <motion.g
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: [20, 0, -5],
                  opacity: [0, 1, 1],
                  rotate: [-5 + i * 3, 0 + i * 2, 2 + i * 2]
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.2
                }}
              >
                <rect 
                  x={34 + i * 4} 
                  y={50 + i * 3} 
                  width="18" 
                  height="12" 
                  rx="1" 
                  fill="none" 
                  stroke={primary} 
                  strokeWidth="2"
                />
                <text 
                  x={43 + i * 4} 
                  y={58 + i * 3} 
                  fontSize="8" 
                  fontWeight="bold" 
                  fill={secondary} 
                  textAnchor="middle"
                >
                  $
                </text>
              </motion.g>
            ))}
          </motion.g>
        );
      case 'save':
        return (
          <motion.g>
            {/* Piggy bank outline */}
            <ellipse cx="45" cy="56" rx="10" ry="8" fill="none" stroke={primary} strokeWidth="2" />
            <circle cx="52" cy="54" r="1.5" fill={fill} />
            <path d="M55 56 Q58 56 58 58" stroke={primary} strokeWidth="1.5" fill="none" />
            {/* Coin dropping */}
            <motion.g
              animate={{
                y: [0, 15, 15],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeIn"
              }}
            >
              <circle cx="45" cy="45" r="3" fill="none" stroke={secondary} strokeWidth="2" />
              <text x="45" y="47" fontSize="5" fontWeight="bold" fill={secondary} textAnchor="middle">$</text>
            </motion.g>
          </motion.g>
        );
      case 'discount':
        return (
          <motion.g>
            {/* Tag shape outline */}
            <path
              d="M38 48 L52 48 L56 56 L52 64 L38 64 C36 64 35 63 35 61 L35 51 C35 49 36 48 38 48Z"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <circle cx="40" cy="54" r="2" fill="none" stroke={secondary} strokeWidth="1.5" />
            {/* Percentage */}
            <motion.text
              x="47"
              y="58"
              fontSize="10"
              fontWeight="bold"
              fill={secondary}
              textAnchor="middle"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              %
            </motion.text>
          </motion.g>
        );
      case 'coins':
        return (
          <motion.g>
            {[...Array(4)].map((_, i) => (
              <motion.g
                key={i}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <circle 
                  cx={38 + i * 6} 
                  cy={56} 
                  r="4" 
                  fill="none" 
                  stroke={primary} 
                  strokeWidth="2"
                />
                <circle 
                  cx={38 + i * 6} 
                  cy={56} 
                  r="2" 
                  fill="none" 
                  stroke={secondary} 
                  strokeWidth="1"
                />
              </motion.g>
            ))}
          </motion.g>
        );
      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="60" cy="105" rx="30" ry="7" fill={isDark ? "#FFFFFF" : "#000000"} opacity="0.08" />
      
      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 15 }}
          transition={{ duration: 0.5 }}
        >
          {renderPricingConcept(PRICING_CONCEPTS[currentIndex].type)}
          
          {/* Label */}
          <motion.text
            x="45"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {PRICING_CONCEPTS[currentIndex].label}
          </motion.text>
        </motion.g>
      </AnimatePresence>
      
      {/* Dollar sign particles */}
      {[...Array(4)].map((_, i) => (
        <motion.text
          key={i}
          x={35 + (i % 2) * 20}
          y={35 + Math.floor(i / 2) * 15}
          fontSize="8"
          fontWeight="bold"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -10, -20],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity
          }}
        >
          $
        </motion.text>
      ))}
    </motion.svg>
  );
};
