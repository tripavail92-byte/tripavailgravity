import { motion } from 'motion/react';
import { useState } from 'react';
import { PremiumPropertyVector } from './PremiumPropertyVectors';

interface PropertyTypeIconProps {
  type: 'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel';
  isSelected?: boolean;
  isHovered?: boolean;
  size?: number;
  className?: string;
}

export function PropertyTypeIcon({ type, isSelected = false, isHovered = false, size = 48, className = "" }: PropertyTypeIconProps) {
  // Use the premium 3D vector for all property types
  return (
    <motion.div
      className={className}
      animate={isSelected || isHovered ? { scale: 1.05 } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PremiumPropertyVector propertyType={type} size={size} />
    </motion.div>
  );
}

// Old simple icon code (kept for reference but not used)
function OldPropertyTypeIcon({ type, isSelected = false, isHovered = false, size = 48, className = "" }: PropertyTypeIconProps) {
  const isActive = isSelected || isHovered;
  
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    className: `transition-all duration-300 ${className}`
  };

  const pathProps = {
    fill: isActive ? "#ff5a5f" : "#1a1a1a",
    stroke: isActive ? "#ff5a5f" : "#1a1a1a",
    strokeWidth: 0.5
  };

  switch (type) {
    case 'hotel':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hotel Building */}
          <motion.rect
            x="10"
            y="35"
            width="28"
            height="8"
            {...pathProps}
            rx="1"
            animate={isActive ? { y: [35, 33, 35] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect
            x="12"
            y="15"
            width="24"
            height="20"
            {...pathProps}
            rx="1"
            animate={isActive ? { scaleY: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          
          {/* Windows */}
          {[...Array(6)].map((_, i) => (
            <motion.rect
              key={i}
              x={16 + (i % 3) * 5}
              y={19 + Math.floor(i / 3) * 6}
              width="3"
              height="3"
              fill={isActive ? "white" : "#f0f0f0"}
              rx="0.5"
              animate={isActive ? {
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
          
          {/* Hotel Sign */}
          <motion.rect
            x="18"
            y="8"
            width="12"
            height="4"
            {...pathProps}
            rx="2"
            animate={isActive ? { rotateZ: [-1, 1, -1] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.text
            x="24"
            y="11"
            textAnchor="middle"
            fontSize="2.5"
            fill={isActive ? "white" : "#1a1a1a"}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            H
          </motion.text>
        </motion.svg>
      );

    case 'boutique':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Boutique Building */}
          <motion.path
            d="M14 38 L14 20 Q14 16 18 16 L30 16 Q34 16 34 20 L34 38 Z"
            {...pathProps}
            animate={isActive ? { scaleY: [1, 1.03, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Decorative Balcony */}
          <motion.rect
            x="16"
            y="24"
            width="16"
            height="2"
            {...pathProps}
            animate={isActive ? { scaleX: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Ornate Windows */}
          <motion.circle
            cx="20"
            cy="20"
            r="2"
            fill={isActive ? "white" : "#f0f0f0"}
            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="28"
            cy="20"
            r="2"
            fill={isActive ? "white" : "#f0f0f0"}
            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Stylish Entrance */}
          <motion.path
            d="M20 34 Q24 30 28 34 L28 38 L20 38 Z"
            fill={isActive ? "white" : "#f0f0f0"}
            animate={isActive ? { scaleY: [1, 1.1, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Boutique Crown */}
          <motion.path
            d="M16 16 L18 12 L24 14 L30 12 L32 16"
            stroke={pathProps.fill}
            strokeWidth="2"
            fill="none"
            animate={isActive ? { y: [-0.5, 0.5, -0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.svg>
      );

    case 'resort':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Building */}
          <motion.rect
            x="8"
            y="25"
            width="32"
            height="15"
            {...pathProps}
            rx="2"
            animate={isActive ? { scaleY: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Pool */}
          <motion.ellipse
            cx="24"
            cy="18"
            rx="8"
            ry="3"
            fill={isActive ? "#4FC3F7" : "#87CEEB"}
            animate={isActive ? { ry: [3, 3.5, 3] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Palm Trees */}
          <motion.g
            animate={isActive ? { 
              rotate: [0, 3, -3, 0]
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <rect x="12" y="30" width="2" height="8" fill="#8B4513" />
            <motion.path
              d="M13 30 Q8 25 10 22 Q13 25 13 30 Q18 25 16 22 Q13 25 13 30"
              fill={isActive ? "#4CAF50" : "#228B22"}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
          
          <motion.g
            animate={isActive ? { 
              rotate: [0, -2, 2, 0]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          >
            <rect x="34" y="32" width="2" height="6" fill="#8B4513" />
            <motion.path
              d="M35 32 Q30 28 32 26 Q35 28 35 32 Q40 28 38 26 Q35 28 35 32"
              fill={isActive ? "#4CAF50" : "#228B22"}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </motion.g>
          
          {/* Resort Umbrellas */}
          <motion.circle
            cx="16"
            cy="16"
            r="3"
            fill={isActive ? "#FF6B6B" : "#FF4444"}
            animate={isActive ? { rotate: [0, 360] } : {}}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <rect x="15" y="19" width="2" height="4" fill="#8B4513" />
        </motion.svg>
      );

    case 'motel':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Motel Building */}
          <motion.rect
            x="6"
            y="28"
            width="36"
            height="12"
            {...pathProps}
            rx="1"
            animate={isActive ? { scaleX: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Room Doors */}
          {[...Array(4)].map((_, i) => (
            <motion.rect
              key={i}
              x={8 + i * 8}
              y={32}
              width="6"
              height="8"
              fill={isActive ? "white" : "#f0f0f0"}
              animate={isActive ? {
                scaleY: [1, 1.05, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
          
          {/* Parking Spaces */}
          <motion.rect
            x="8"
            y="42"
            width="32"
            height="2"
            fill={isActive ? "#FFC107" : "#FFE082"}
            animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Motel Sign */}
          <motion.rect
            x="18"
            y="18"
            width="12"
            height="8"
            {...pathProps}
            rx="1"
            animate={isActive ? { rotateZ: [-0.5, 0.5, -0.5] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.text
            x="24"
            y="24"
            textAnchor="middle"
            fontSize="3"
            fill={isActive ? "white" : "#1a1a1a"}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            M
          </motion.text>
          <rect x="20" y="26" width="8" height="2" fill="#8B4513" />
        </motion.svg>
      );

    case 'lodge':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Lodge Roof */}
          <motion.path
            d="M12 20 L24 8 L36 20 L32 20 L24 12 L16 20 Z"
            fill={isActive ? "#8B4513" : "#654321"}
            animate={isActive ? { y: [-0.5, 0.5, -0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Lodge Body */}
          <motion.rect
            x="16"
            y="20"
            width="16"
            height="18"
            {...pathProps}
            animate={isActive ? { scaleY: [1, 1.02, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Wooden Logs */}
          {[...Array(3)].map((_, i) => (
            <motion.rect
              key={i}
              x="14"
              y={22 + i * 5}
              width="20"
              height="1"
              fill={isActive ? "#A0522D" : "#8B4513"}
              animate={isActive ? { scaleX: [1, 1.03, 1] } : {}}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
          
          {/* Lodge Door */}
          <motion.rect
            x="22"
            y="30"
            width="4"
            height="8"
            fill={isActive ? "#654321" : "#8B4513"}
            animate={isActive ? { scaleY: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Mountain Background */}
          <motion.path
            d="M4 24 L8 16 L12 20 L16 14 L20 18 L24 12 L28 16 L32 14 L36 18 L40 16 L44 24"
            stroke={isActive ? "#B0BEC5" : "#90A4AE"}
            strokeWidth="2"
            fill="none"
            animate={isActive ? { strokeDasharray: [0, 50], strokeDashoffset: [0, -50] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          {/* Chimney */}
          <motion.rect
            x="28"
            y="12"
            width="3"
            height="8"
            fill={isActive ? "#8B4513" : "#654321"}
            animate={isActive ? { scaleY: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Smoke */}
          <motion.circle
            cx="29.5"
            cy="10"
            r="1"
            fill={isActive ? "#E0E0E0" : "#BDBDBD"}
            animate={isActive ? { 
              y: [0, -4, -8],
              opacity: [1, 0.5, 0],
              scale: [0.5, 1, 1.5]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
      );

    case 'inn':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Inn Building */}
          <motion.rect
            x="14"
            y="25"
            width="20"
            height="15"
            {...pathProps}
            rx="2"
            animate={isActive ? { scaleY: [1, 1.03, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Cozy Roof */}
          <motion.path
            d="M12 25 L24 15 L36 25 L34 25 L24 17 L14 25 Z"
            fill={isActive ? "#D32F2F" : "#B71C1C"}
            animate={isActive ? { y: [-0.3, 0.3, -0.3] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Cozy Windows */}
          <motion.circle
            cx="20"
            cy="30"
            r="2.5"
            fill={isActive ? "#FFEB3B" : "#FDD835"}
            animate={isActive ? { 
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="28"
            cy="30"
            r="2.5"
            fill={isActive ? "#FFEB3B" : "#FDD835"}
            animate={isActive ? { 
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Inn Door */}
          <motion.rect
            x="22"
            y="34"
            width="4"
            height="6"
            fill={isActive ? "#654321" : "#8B4513"}
            rx="2"
            animate={isActive ? { scaleY: [1, 1.05, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Welcome Flowers */}
          <motion.circle
            cx="18"
            cy="38"
            r="1.5"
            fill={isActive ? "#E91E63" : "#C2185B"}
            animate={isActive ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="30"
            cy="38"
            r="1.5"
            fill={isActive ? "#9C27B0" : "#7B1FA2"}
            animate={isActive ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          
          {/* Cozy Sign */}
          <motion.ellipse
            cx="24"
            cy="20"
            rx="6"
            ry="2"
            {...pathProps}
            animate={isActive ? { rotateZ: [-1, 1, -1] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.text
            x="24"
            y="21"
            textAnchor="middle"
            fontSize="2"
            fill={isActive ? "white" : "#1a1a1a"}
          >
            INN
          </motion.text>
        </motion.svg>
      );

    case 'guesthouse':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* House Shape */}
          <motion.path
            d="M10 35 L10 22 L24 10 L38 22 L38 35 Z"
            {...pathProps}
            animate={isActive ? { scaleY: [1, 1.02, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Home Windows */}
          <motion.rect
            x="16"
            y="20"
            width="4"
            height="4"
            fill={isActive ? "#FFEB3B" : "#FDD835"}
            animate={isActive ? { 
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect
            x="28"
            y="20"
            width="4"
            height="4"
            fill={isActive ? "#FFEB3B" : "#FDD835"}
            animate={isActive ? { 
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Front Door */}
          <motion.rect
            x="22"
            y="28"
            width="4"
            height="7"
            fill={isActive ? "#654321" : "#8B4513"}
            animate={isActive ? { scaleY: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Garden */}
          <motion.circle
            cx="15"
            cy="38"
            r="2"
            fill={isActive ? "#4CAF50" : "#388E3C"}
            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="33"
            cy="38"
            r="2"
            fill={isActive ? "#4CAF50" : "#388E3C"}
            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          
          {/* Mailbox */}
          <motion.rect
            x="40"
            y="32"
            width="3"
            height="2"
            {...pathProps}
            animate={isActive ? { rotateZ: [-2, 2, -2] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <rect x="41" y="34" width="1" height="4" fill="#8B4513" />
          
          {/* Welcome Mat */}
          <motion.rect
            x="20"
            y="35"
            width="8"
            height="1"
            fill={isActive ? "#795548" : "#6D4C41"}
            animate={isActive ? { scaleX: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
      );

    case 'hostel':
      return (
        <motion.svg
          {...iconProps}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hostel Building */}
          <motion.rect
            x="12"
            y="18"
            width="24"
            height="22"
            {...pathProps}
            rx="1"
            animate={isActive ? { scaleY: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Multiple Floors */}
          <motion.rect
            x="12"
            y="28"
            width="24"
            height="1"
            fill={isActive ? "#607D8B" : "#546E7A"}
            animate={isActive ? { scaleX: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Bunk Bed Windows */}
          {[...Array(6)].map((_, i) => (
            <motion.rect
              key={i}
              x={15 + (i % 3) * 6}
              y={20 + Math.floor(i / 3) * 10}
              width="3"
              height="6"
              fill={isActive ? "#FFEB3B" : "#FDD835"}
              animate={isActive ? {
                opacity: [0.6, 1, 0.6]
              } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
          
          {/* Backpack Icon */}
          <motion.path
            d="M20 8 Q18 6 18 10 Q18 12 20 14 L22 12 L22 8 Z"
            fill={isActive ? "#FF9800" : "#F57C00"}
            animate={isActive ? { 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Budget Price Tag */}
          <motion.circle
            cx="32"
            cy="12"
            r="4"
            fill={isActive ? "#4CAF50" : "#388E3C"}
            animate={isActive ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.text
            x="32"
            y="13"
            textAnchor="middle"
            fontSize="2"
            fill="white"
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            $
          </motion.text>
          
          {/* Hostel Entrance */}
          <motion.rect
            x="22"
            y="34"
            width="4"
            height="6"
            fill={isActive ? "white" : "#f0f0f0"}
            animate={isActive ? { scaleY: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Young Travelers */}
          <motion.circle
            cx="16"
            cy="42"
            r="1"
            fill={isActive ? "#E91E63" : "#C2185B"}
            animate={isActive ? { y: [-0.5, 0.5, -0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="32"
            cy="42"
            r="1"
            fill={isActive ? "#2196F3" : "#1976D2"}
            animate={isActive ? { y: [-0.5, 0.5, -0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </motion.svg>
      );

    default:
      return null;
  }
}

export interface AnimatedPropertyTypeIconsProps {
  selectedType?: string;
  onTypeSelect?: (type: string) => void;
  className?: string;
}

export function AnimatedPropertyTypeIcons({ selectedType, onTypeSelect, className = "" }: AnimatedPropertyTypeIconsProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const propertyTypes = [
    { id: 'hotel', name: 'Hotel', description: 'Traditional hotel with multiple rooms' },
    { id: 'boutique', name: 'Boutique Hotel', description: 'Unique, stylish accommodation' },
    { id: 'resort', name: 'Resort', description: 'Full-service vacation destination' },
    { id: 'motel', name: 'Motel', description: 'Motor hotel for travelers' },
    { id: 'lodge', name: 'Lodge', description: 'Rustic or countryside accommodation' },
    { id: 'inn', name: 'Inn', description: 'Small, cozy accommodation' },
    { id: 'guesthouse', name: 'Guest House', description: 'Home-like accommodation' },
    { id: 'hostel', name: 'Hostel', description: 'Budget-friendly shared accommodation' }
  ];

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {propertyTypes.map((type) => (
        <motion.button
          key={type.id}
          onClick={() => onTypeSelect?.(type.id)}
          onHoverStart={() => setHoveredType(type.id)}
          onHoverEnd={() => setHoveredType(null)}
          className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
            selectedType === type.id
              ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/30 dark:to-cyan-950/30 shadow-xl'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg'
          }`}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center space-y-3">
            {/* 3D Premium Vector Icon */}
            <motion.div
              animate={selectedType === type.id ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <PropertyTypeIcon
                type={type.id as any}
                isSelected={selectedType === type.id}
                isHovered={hoveredType === type.id}
                size={64}
              />
            </motion.div>
            
            <div className="text-center w-full">
              <h3 className={`font-semibold text-sm transition-colors ${
                selectedType === type.id 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {type.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {type.description}
              </p>
            </div>
            
            {/* Selection Indicator */}
            {selectedType === type.id && (
              <motion.div
                className="w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}