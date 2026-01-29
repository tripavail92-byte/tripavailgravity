import { motion } from 'motion/react';
import { useState } from 'react';

interface Modern3DHotelIconProps {
  className?: string;
  size?: number;
  isSelected?: boolean;
}

export function Modern3DHotelIcon({ className = "", size = 48, isSelected = false }: Modern3DHotelIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLit = isHovered || isSelected;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lighting Effects */}
        {isLit && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Ambient glow */}
            <circle 
              cx="24" 
              cy="24" 
              r="22" 
              fill="url(#ambientGlow)" 
              opacity="0.4"
            />
            {/* Building highlight */}
            <rect
              x="13"
              y="11"
              width="22"
              height="28"
              fill="url(#buildingGlow)"
              rx="2"
              opacity="0.2"
            />
          </motion.g>
        )}

        {/* Building Shadow/Base */}
        <motion.ellipse
          cx="24"
          cy="38"
          rx="16"
          ry="2"
          fill="rgba(0, 0, 0, 0.1)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        {/* Main Hotel Structure - 3D Perspective */}
        <motion.g
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {/* Foundation */}
          <path
            d="M10 36 L12 34 L36 34 L38 36 L38 40 L10 40 Z"
            fill="url(#foundation)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Main Building - Front Face */}
          <path
            d="M12 34 L14 32 L30 32 L32 34 L32 20 L30 18 L14 18 L12 20 Z"
            fill="url(#mainBuilding)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Main Building - Side Face */}
          <path
            d="M32 34 L34 32 L34 18 L32 20 Z"
            fill="url(#buildingSide)"
          />
          
          {/* Top Section - Front Face */}
          <path
            d="M16 20 L18 18 L26 18 L28 20 L28 12 L26 10 L18 10 L16 12 Z"
            fill="url(#topSection)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Top Section - Side Face */}
          <path
            d="M28 20 L30 18 L30 10 L28 12 Z"
            fill="url(#topSectionSide)"
          />
          
          {/* Rooftop */}
          <path
            d="M18 10 L26 10 L28 8 L16 8 Z"
            fill="url(#rooftop)"
          />
        </motion.g>

        {/* Windows with Dynamic Lighting */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Main building windows - Row 1 */}
          {[15, 19, 23, 27].map((x, i) => (
            <motion.g key={`row1-${i}`}>
              <rect 
                x={x} 
                y="23" 
                width="2.5" 
                height="3" 
                fill={isLit ? "url(#windowLit)" : "url(#windowNormal)"}
                rx="0.3"
              />
              {isLit && (
                <motion.rect
                  x={x - 0.5}
                  y="22.5"
                  width="3.5"
                  height="4"
                  fill="url(#windowGlow)"
                  rx="0.5"
                  opacity="0.6"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              )}
            </motion.g>
          ))}
          
          {/* Main building windows - Row 2 */}
          {[15, 19, 23, 27].map((x, i) => (
            <motion.g key={`row2-${i}`}>
              <rect 
                x={x} 
                y="28" 
                width="2.5" 
                height="3" 
                fill={isLit ? "url(#windowLit)" : "url(#windowNormal)"}
                rx="0.3"
              />
              {isLit && (
                <motion.rect
                  x={x - 0.5}
                  y="27.5"
                  width="3.5"
                  height="4"
                  fill="url(#windowGlow)"
                  rx="0.5"
                  opacity="0.6"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 + 0.5 }}
                />
              )}
            </motion.g>
          ))}

          {/* Top section windows */}
          {[18, 22].map((x, i) => (
            <motion.g key={`top-${i}`}>
              <rect 
                x={x} 
                y="15" 
                width="2.5" 
                height="2.5" 
                fill={isLit ? "url(#windowLit)" : "url(#windowNormal)"}
                rx="0.3"
              />
              {isLit && (
                <motion.rect
                  x={x - 0.5}
                  y="14.5"
                  width="3.5"
                  height="3.5"
                  fill="url(#windowGlow)"
                  rx="0.5"
                  opacity="0.7"
                  animate={{ opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                />
              )}
            </motion.g>
          ))}
        </motion.g>

        {/* Entrance with Lighting */}
        <motion.g
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {/* Door */}
          <rect
            x="21"
            y="34"
            width="4"
            height="5"
            fill="url(#entrance)"
            rx="2"
          />
          {isLit && (
            <motion.rect
              x="20"
              y="33"
              width="6"
              height="7"
              fill="url(#entranceGlow)"
              rx="3"
              opacity="0.4"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          
          {/* Door handle */}
          <circle cx="23" cy="36.5" r="0.3" fill="#FFD700" />
        </motion.g>

        {/* Hotel Sign with Neon Effect */}
        <motion.g
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <rect
            x="19"
            y="8"
            width="8"
            height="1.5"
            fill={isLit ? "#00D4AA" : "#4B5563"}
            rx="0.75"
          />
          {isLit && (
            <motion.rect
              x="18"
              y="7"
              width="10"
              height="3.5"
              fill="url(#neonGlow)"
              rx="1.75"
              opacity="0.5"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {/* Hotel text */}
          <text
            x="23"
            y="8.8"
            textAnchor="middle"
            fontSize="1.5"
            fill="white"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            HOTEL
          </text>
        </motion.g>

        {/* Architectural Details */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {/* Balconies */}
          <rect x="13" y="25" width="1" height="0.5" fill="#00D4AA" />
          <rect x="13" y="30" width="1" height="0.5" fill="#00D4AA" />
          <rect x="30" y="25" width="1" height="0.5" fill="#00D4AA" />
          <rect x="30" y="30" width="1" height="0.5" fill="#00D4AA" />
          
          {/* Corner highlights */}
          <line x1="14" y1="18" x2="14" y2="32" stroke="#00D4AA" strokeWidth="0.5" opacity="0.7" />
          <line x1="30" y1="18" x2="30" y2="32" stroke="#00D4AA" strokeWidth="0.5" opacity="0.7" />
        </motion.g>

        {/* Gradients and Effects */}
        <defs>
          <linearGradient id="foundation" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="mainBuilding" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          <linearGradient id="buildingSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          
          <linearGradient id="topSection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          
          <linearGradient id="topSectionSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          
          <linearGradient id="rooftop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
          
          <linearGradient id="entrance" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          
          <linearGradient id="windowNormal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          
          <linearGradient id="windowLit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="buildingGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="entranceGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}