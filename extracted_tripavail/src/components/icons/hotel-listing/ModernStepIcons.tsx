import { motion } from 'motion/react';

interface IconProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

// Modern Step 1: Basic Information Icon (Info Circle with checkmark)
export function BasicInfoIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Outer rotating ring */}
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
        initial={{ rotate: 0 }}
        animate={{ rotate: isActive ? 360 : 0 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Main circle */}
      <motion.circle
        cx="32"
        cy="32"
        r="22"
        stroke={color}
        strokeWidth="3"
        fill={isActive ? `${color}15` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Info 'i' symbol */}
      <motion.circle
        cx="32"
        cy="24"
        r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      
      <motion.rect
        x="30"
        y="29"
        width="4"
        height="14"
        rx="2"
        fill={color}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Pulse effect when active */}
      {isActive && (
        <motion.circle
          cx="32"
          cy="32"
          r="22"
          stroke={color}
          strokeWidth="2"
          fill="none"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Modern Step 2: Location Icon (Pin with radar)
export function ModernLocationIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Radar circles */}
      {isActive && [1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx="32"
          cy="26"
          r={8 + i * 6}
          stroke={color}
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ 
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 0.5
          }}
        />
      ))}
      
      {/* Map pin */}
      <motion.path
        d="M32 10C24.268 10 18 16.268 18 24C18 34 32 54 32 54C32 54 46 34 46 24C46 16.268 39.732 10 32 10Z"
        stroke={color}
        strokeWidth="3"
        fill={isActive ? `${color}20` : 'transparent'}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, scale: 0 }}
        animate={{ pathLength: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Inner dot */}
      <motion.circle
        cx="32"
        cy="24"
        r="6"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Glowing center when active */}
      {isActive && (
        <motion.circle
          cx="32"
          cy="24"
          r="4"
          fill="#ffffff"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Modern Step 3: Amenities Icon (Grid with sparkles)
export function ModernAmenitiesIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Grid squares */}
      {[
        [14, 14], [30, 14], [46, 14],
        [14, 30], [30, 30], [46, 30],
        [14, 46], [30, 46], [46, 46]
      ].map(([x, y], i) => (
        <motion.rect
          key={i}
          x={x}
          y={y}
          width="10"
          height="10"
          rx="2"
          fill={isActive && i === 4 ? color : 'transparent'}
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        />
      ))}
      
      {/* Sparkles when active */}
      {isActive && [
        [10, 10], [54, 10], [10, 54], [54, 54]
      ].map(([x, y], i) => (
        <motion.g key={i}>
          <motion.path
            d={`M${x},${y-4} L${x},${y+4} M${x-4},${y} L${x+4},${y}`}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.7],
              rotate: [0, 180]
            }}
            transition={{ 
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        </motion.g>
      ))}
    </motion.svg>
  );
}

// Modern Step 4: Rooms Icon (Bed with animated pillows)
export function ModernRoomsIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Bed frame */}
      <motion.rect
        x="10"
        y="28"
        width="44"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill={isActive ? `${color}15` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Headboard */}
      <motion.rect
        x="10"
        y="18"
        width="44"
        height="12"
        rx="3"
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      
      {/* Pillow 1 */}
      <motion.ellipse
        cx="22"
        cy="22"
        rx="7"
        ry="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: isActive ? [0, -2, 0] : 0
        }}
        transition={{ 
          scale: { duration: 0.4, delay: 0.6 },
          y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      
      {/* Pillow 2 */}
      <motion.ellipse
        cx="42"
        cy="22"
        rx="7"
        ry="4"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: isActive ? [0, -2, 0] : 0
        }}
        transition={{ 
          scale: { duration: 0.4, delay: 0.7 },
          y: { duration: 1.5, delay: 0.3, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      
      {/* Bed legs */}
      {[14, 50].map((x, i) => (
        <motion.rect
          key={i}
          x={x}
          y="44"
          width="3"
          height="8"
          rx="1.5"
          fill={color}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
        />
      ))}
    </motion.svg>
  );
}

// Modern Step 5: Policies Icon (Document with checkmarks)
export function ModernPoliciesIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Document */}
      <motion.path
        d="M18 10H42L50 18V54C50 55.1 49.1 56 48 56H18C16.9 56 16 55.1 16 54V12C16 10.9 16.9 10 18 10Z"
        stroke={color}
        strokeWidth="2.5"
        fill={isActive ? `${color}10` : 'transparent'}
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Folded corner */}
      <motion.path
        d="M42 10V18H50"
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Checkmarks */}
      {[28, 36, 44].map((y, i) => (
        <motion.path
          key={i}
          d={`M24 ${y} L28 ${y + 4} L38 ${y - 4}`}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.8 + i * 0.2 }}
        />
      ))}
      
      {/* Animated shine when active */}
      {isActive && (
        <motion.path
          d="M20 10 L44 56"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
    </motion.svg>
  );
}

// Modern Step 6: Photos Icon (Camera with flash)
export function ModernPhotosIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Camera body */}
      <motion.rect
        x="12"
        y="22"
        width="40"
        height="28"
        rx="4"
        stroke={color}
        strokeWidth="2.5"
        fill={isActive ? `${color}12` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Top viewfinder */}
      <motion.rect
        x="22"
        y="16"
        width="20"
        height="8"
        rx="2"
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      
      {/* Lens outer */}
      <motion.circle
        cx="32"
        cy="36"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      
      {/* Lens inner */}
      <motion.circle
        cx="32"
        cy="36"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill={isActive ? color : 'transparent'}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      />
      
      {/* Flash indicator */}
      <motion.circle
        cx="46"
        cy="26"
        r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
      
      {/* Flash effect when active */}
      {isActive && (
        <>
          <motion.circle
            cx="46"
            cy="26"
            r="6"
            fill={color}
            opacity="0.4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.path
            d="M32 30 L32 42 M26 36 L38 36"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          />
        </>
      )}
    </motion.svg>
  );
}

// Modern Step 7: Services Icon (Concierge bell)
export function ModernServicesIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Bell base */}
      <motion.rect
        x="16"
        y="44"
        width="32"
        height="6"
        rx="3"
        fill={color}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      
      {/* Bell dome */}
      <motion.path
        d="M20 44 Q20 20, 32 18 Q44 20, 44 44"
        stroke={color}
        strokeWidth="2.5"
        fill={isActive ? `${color}15` : 'transparent'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      
      {/* Bell handle */}
      <motion.circle
        cx="32"
        cy="18"
        r="4"
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          rotate: isActive ? [0, -10, 10, 0] : 0
        }}
        transition={{ 
          scale: { duration: 0.4, delay: 0.6 },
          rotate: { duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }
        }}
      />
      
      {/* Service rings when active */}
      {isActive && [1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx="32"
          cy="32"
          r={12 + i * 6}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ 
            duration: 1.5,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      ))}
    </motion.svg>
  );
}

// Modern Step 8: Review Icon (Star with checkmark)
export function ModernReviewIcon({ size = 48, isActive, className }: IconProps) {
  const color = isActive ? '#E11D48' : '#6B7280';
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Star */}
      <motion.path
        d="M32 12 L37 26 L52 26 L40 35 L45 49 L32 40 L19 49 L24 35 L12 26 L27 26 Z"
        stroke={color}
        strokeWidth="2.5"
        fill={isActive ? `${color}20` : 'transparent'}
        strokeLinejoin="round"
        initial={{ pathLength: 0, rotate: -180 }}
        animate={{ 
          pathLength: 1,
          rotate: 0
        }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Checkmark in center */}
      <motion.path
        d="M26 32 L30 36 L38 28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      
      {/* Rotating sparkles when active */}
      {isActive && (
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {[0, 90, 180, 270].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 32 + Math.cos(rad) * 24;
            const y = 32 + Math.sin(rad) * 24;
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 0] }}
                transition={{ 
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity
                }}
              />
            );
          })}
        </motion.g>
      )}
    </motion.svg>
  );
}
