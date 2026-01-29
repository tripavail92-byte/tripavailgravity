import { motion } from 'motion/react';
import { useState } from 'react';

interface Modern3DTourIconProps {
  className?: string;
  size?: number;
  isSelected?: boolean;
}

export function Modern3DTourIcon({ className = "", size = 48, isSelected = false }: Modern3DTourIconProps) {
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
            <ellipse 
              cx="24" 
              cy="24" 
              rx="20" 
              ry="15"
              fill="url(#ambientGlow)" 
              opacity="0.4"
            />
            {/* Engine thrust glow */}
            <ellipse
              cx="6"
              cy="24"
              rx="8"
              ry="4"
              fill="url(#thrustGlow)"
              opacity="0.6"
            />
          </motion.g>
        )}

        {/* Airplane Shadow */}
        <motion.ellipse
          cx="24"
          cy="38"
          rx="18"
          ry="2"
          fill="rgba(0, 0, 0, 0.15)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        {/* Clouds */}
        <motion.g
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <circle cx="38" cy="12" r="2" fill="#f0f9ff" opacity="0.7" />
          <circle cx="40" cy="11" r="1.5" fill="#f0f9ff" opacity="0.5" />
          <circle cx="6" cy="35" r="2.5" fill="#f0f9ff" opacity="0.6" />
          <circle cx="8" cy="34" r="1.8" fill="#f0f9ff" opacity="0.4" />
        </motion.g>

        {/* Main Aircraft Structure - 3D Perspective */}
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {/* Main Fuselage - Bottom */}
          <path
            d="M10 26 L36 26 L40 25 L42 24 L40 23 L36 22 L10 22 L8 24 Z"
            fill="url(#fuselageBottom)"
          />
          
          {/* Main Fuselage - Top */}
          <path
            d="M10 22 L36 22 L40 21 L42 20 L40 19 L36 18 L10 18 L8 20 Z"
            fill="url(#fuselageTop)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Nose Cone */}
          <path
            d="M36 18 L40 19 L42 20 L44 22 L42 24 L40 25 L36 26 L36 22 Z"
            fill="url(#noseCone)"
          />
        </motion.g>

        {/* Wings - 3D Structure */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          {/* Main Wing - Top */}
          <path
            d="M20 18 L30 10 L34 9 L36 10 L32 12 L26 18 Z"
            fill="url(#wingTop)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Main Wing - Bottom */}
          <path
            d="M20 26 L30 34 L34 35 L36 34 L32 32 L26 26 Z"
            fill="url(#wingTop)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Wing Side Panels */}
          <path
            d="M30 10 L34 9 L34 12 L30 13 Z"
            fill="url(#wingSide)"
          />
          <path
            d="M30 34 L34 35 L34 32 L30 31 Z"
            fill="url(#wingSide)"
          />
          
          {/* Wing Tip Lights */}
          <motion.circle
            cx="33"
            cy="11"
            r="1.2"
            fill={isLit ? "#FF0000" : "#DC2626"}
            animate={isLit ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="33"
            cy="33"
            r="1.2"
            fill={isLit ? "#00FF00" : "#059669"}
            animate={isLit ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
          
          {/* Wing Tip Light Glow */}
          {isLit && (
            <>
              <motion.circle
                cx="33"
                cy="11"
                r="3"
                fill="url(#redGlow)"
                opacity="0.6"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.circle
                cx="33"
                cy="33"
                r="3"
                fill="url(#greenGlow)"
                opacity="0.6"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </motion.g>

        {/* Tail Section */}
        <motion.g
          initial={{ x: 8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Vertical Stabilizer */}
          <path
            d="M8 20 L4 14 L6 13 L7 14 L10 18 Z"
            fill="url(#tailVertical)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Horizontal Stabilizer - Top */}
          <path
            d="M8 20 L2 18 L1 19 L2 20 L8 22 Z"
            fill="url(#tailHorizontal)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Horizontal Stabilizer - Bottom */}
          <path
            d="M8 24 L2 26 L1 25 L2 24 L8 22 Z"
            fill="url(#tailHorizontal)"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="0.5"
          />
          
          {/* Tail Logo */}
          <rect 
            x="4.5" 
            y="15" 
            width="3" 
            height="1" 
            fill="#00D4AA" 
            rx="0.5"
          />
        </motion.g>

        {/* Windows with Cabin Lighting */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[14, 18, 22, 26, 30].map((x, i) => (
            <motion.g key={`window-${i}`}>
              <ellipse 
                cx={x} 
                cy="20" 
                rx="1.2" 
                ry="1" 
                fill={isLit ? "url(#windowLit)" : "url(#windowNormal)"}
              />
              {isLit && (
                <motion.ellipse
                  cx={x}
                  cy="20"
                  rx="2"
                  ry="1.5"
                  fill="url(#windowGlow)"
                  opacity="0.5"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
            </motion.g>
          ))}
        </motion.g>

        {/* Engine Thrust Effects */}
        {isLit && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Thrust flame */}
            <motion.path
              d="M8 22 L2 21 L1 22 L1 24 L2 25 L8 24 Z"
              fill="url(#thrustFlame)"
              animate={{ scaleX: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            
            {/* Heat distortion lines */}
            {[19, 21, 23].map((y, i) => (
              <motion.line
                key={`heat-${i}`}
                x1="1"
                y1={y}
                x2="6"
                y2={y}
                stroke="url(#heatDistortion)"
                strokeWidth="0.5"
                opacity="0.6"
                animate={{ x1: [1, 3, 1] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </motion.g>
        )}

        {/* Speed Lines */}
        <motion.g
          animate={{ opacity: isLit ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {[18, 20, 22, 24, 26].map((y, i) => (
            <motion.line
              key={`speed-${i}`}
              x1="2"
              y1={y}
              x2="8"
              y2={y}
              stroke="#00D4AA"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity={isLit ? "0.8" : "0.4"}
              animate={{ x1: [2, 6, 2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.g>

        {/* Gradients and Effects */}
        <defs>
          <linearGradient id="fuselageTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          <linearGradient id="fuselageBottom" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          
          <linearGradient id="noseCone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
          
          <linearGradient id="wingTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          
          <linearGradient id="wingSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          
          <linearGradient id="tailVertical" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          <linearGradient id="tailHorizontal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          <linearGradient id="windowNormal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          
          <linearGradient id="windowLit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          
          <linearGradient id="thrustFlame" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          
          <linearGradient id="heatDistortion" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
          </linearGradient>
          
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="thrustGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FF00" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}