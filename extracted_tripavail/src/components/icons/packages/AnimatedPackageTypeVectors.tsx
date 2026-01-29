import { motion } from 'motion/react';
import { useState } from 'react';

interface VectorProps {
  className?: string;
  isActive?: boolean;
  size?: number;
}

// Weekend Getaway - Jeep with Luggage and Family on Road Trip
export function WeekendGetawayVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { x: [0, 2, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Sun */}
      <motion.circle
        cx="20"
        cy="25"
        r="8"
        fill="#FDB022"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
      />
      
      {/* Road */}
      <motion.rect
        x="0"
        y="65"
        width="100"
        height="20"
        fill="#6B7280"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ transformOrigin: 'left' }}
      />
      
      {/* Road Lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={10 + i * 20}
          y="74"
          width="10"
          height="2"
          fill="#FFD700"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      
      {/* Jeep Body */}
      <motion.rect
        x="40"
        y="48"
        width="35"
        height="18"
        rx="2"
        fill="url(#weekendJeepGradient)"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 40, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      
      {/* Jeep Hood */}
      <motion.path
        d="M40 55L35 60L40 60Z"
        fill="#9D4EDD"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />
      
      {/* Jeep Cabin/Windows */}
      <motion.rect
        x="48"
        y="42"
        width="20"
        height="8"
        rx="1"
        fill="#90CAF9"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        style={{ transformOrigin: 'bottom' }}
      />
      
      {/* Windshield Divider */}
      <motion.line
        x1="58"
        y1="42"
        x2="58"
        y2="50"
        stroke="#fff"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8 }}
      />
      
      {/* Family Silhouettes in Jeep */}
      <motion.circle cx="52" cy="46" r="2" fill="#455A64" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9 }}
      />
      <motion.circle cx="64" cy="46" r="2" fill="#455A64" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.95 }}
      />
      
      {/* Luggage on Top */}
      <motion.rect
        x="50"
        y="36"
        width="8"
        height="6"
        rx="1"
        fill="#D84315"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 36, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
      <motion.rect
        x="59"
        y="37"
        width="6"
        height="5"
        rx="1"
        fill="#FF5722"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 37, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />
      
      {/* Wheels */}
      <motion.circle
        cx="48"
        cy="66"
        r="5"
        fill="#37474F"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: isActive ? 360 : 0 }}
        transition={{ 
          scale: { duration: 0.3, delay: 1.2 },
          rotate: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
      />
      <motion.circle cx="48" cy="66" r="3" fill="#CFD8DC" />
      
      <motion.circle
        cx="67"
        cy="66"
        r="5"
        fill="#37474F"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: isActive ? 360 : 0 }}
        transition={{ 
          scale: { duration: 0.3, delay: 1.25 },
          rotate: { duration: 2, repeat: Infinity, ease: "linear" }
        }}
      />
      <motion.circle cx="67" cy="66" r="3" fill="#CFD8DC" />
      
      {/* Headlight */}
      <motion.circle
        cx="37"
        cy="58"
        r="2"
        fill="#FFD700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.3 }}
      />
      
      {/* Dust Clouds Behind Jeep */}
      {isHovered && [0, 1, 2].map((i) => (
        <motion.ellipse
          key={i}
          cx={32 - i * 8}
          cy={68}
          rx="4"
          ry="2"
          fill="#D1D5DB"
          opacity="0.5"
          initial={{ x: 0, opacity: 0 }}
          animate={{ 
            x: [-10, -20],
            opacity: [0.5, 0]
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
      
      {/* Flying Birds */}
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${65 + i * 10} ${22 + i * 3}C${67 + i * 10} ${21 + i * 3} ${69 + i * 10} ${21 + i * 3} ${71 + i * 10} ${22 + i * 3}`}
          stroke="#546E7A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ x: -30, opacity: 0 }}
          animate={{ 
            x: [0, 30],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "linear"
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="weekendJeepGradient" x1="40" y1="48" x2="75" y2="66">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Romantic Escape - Couple with Heart in the Middle
export function RomanticEscapeVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Background Sunset Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="38"
        fill="#FFE5EC"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Person 1 (Left - Male) */}
      <motion.g
        initial={{ x: -15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Head */}
        <motion.circle cx="32" cy="45" r="6" fill="#9D4EDD" />
        {/* Body */}
        <motion.rect x="27" y="52" width="10" height="16" rx="3" fill="#9D4EDD" />
        {/* Arm reaching toward center */}
        <motion.path
          d="M37 56L42 50"
          stroke="#9D4EDD"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8 }}
        />
      </motion.g>
      
      {/* Person 2 (Right - Female) */}
      <motion.g
        initial={{ x: 15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle cx="68" cy="45" r="6" fill="#00D4FF" />
        {/* Body (dress shape) */}
        <motion.path
          d="M63 52L68 52L70 68L66 68Z"
          fill="#00D4FF"
        />
        {/* Arm reaching toward center */}
        <motion.path
          d="M63 56L58 50"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.9 }}
        />
      </motion.g>
      
      {/* Center Heart */}
      <motion.path
        d="M50 58L40 48C37 45 37 40 40 37C43 34 48 34 50 38C52 34 57 34 60 37C63 40 63 45 60 48L50 58Z"
        fill="url(#romanticHeartGradient)"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ 
          scale: isActive ? [1, 1.15, 1] : 1,
          rotate: 0
        }}
        transition={{ 
          scale: { duration: 1.5, repeat: Infinity },
          rotate: { duration: 0.6, type: "spring", stiffness: 200 }
        }}
      />
      
      {/* Heart Shine */}
      <motion.ellipse
        cx="46"
        cy="42"
        rx="4"
        ry="6"
        fill="#fff"
        opacity="0.4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2 }}
      />
      
      {/* Floating Hearts Around Couple */}
      {[
        { x: 25, y: 30, delay: 0 },
        { x: 75, y: 32, delay: 0.3 },
        { x: 30, y: 70, delay: 0.6 },
        { x: 70, y: 68, delay: 0.9 }
      ].map((heart, i) => (
        <motion.path
          key={i}
          d={`M${heart.x} ${heart.y}C${heart.x} ${heart.y} ${heart.x - 1.5} ${heart.y - 1.5} ${heart.x - 1.5} ${heart.y - 2.5}C${heart.x - 1.5} ${heart.y - 3.5} ${heart.x} ${heart.y - 4} ${heart.x + 1} ${heart.y - 3.5}C${heart.x + 2} ${heart.y - 4} ${heart.x + 3} ${heart.y - 3.5} ${heart.x + 3} ${heart.y - 2.5}C${heart.x + 3} ${heart.y - 1.5} ${heart.x + 1.5} ${heart.y} ${heart.x + 1} ${heart.y + 1.5}Z`}
          fill="#E91E63"
          opacity="0.5"
          initial={{ y: heart.y + 10, opacity: 0 }}
          animate={{ 
            y: [heart.y + 10, heart.y - 10, heart.y - 10],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            delay: heart.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Ground/Base Line */}
      <motion.line
        x1="22"
        y1="70"
        x2="78"
        y2="70"
        stroke="#F8BBD0"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      
      {/* Sparkles on Hover */}
      {isHovered && [
        { x: 40, y: 35 },
        { x: 60, y: 37 }
      ].map((sparkle, i) => (
        <motion.g key={i}>
          <motion.line
            x1={sparkle.x - 2}
            y1={sparkle.y}
            x2={sparkle.x + 2}
            y2={sparkle.y}
            stroke="#FFD700"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
          <motion.line
            x1={sparkle.x}
            y1={sparkle.y - 2}
            x2={sparkle.x}
            y2={sparkle.y + 2}
            stroke="#FFD700"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2 + 0.1
            }}
          />
        </motion.g>
      ))}
      
      <defs>
        <linearGradient id="romanticHeartGradient" x1="40" y1="37" x2="60" y2="58">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Family Adventure - Happy Family Silhouette
export function FamilyAdventureVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Sun in Background */}
      <motion.circle
        cx="75"
        cy="30"
        r="12"
        fill="#FFD700"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Parent 1 (Left - Dad) */}
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.circle 
          cx="25" 
          cy="42" 
          r="7" 
          fill="#2196F3"
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.rect 
          x="20" 
          y="50" 
          width="10" 
          height="20" 
          rx="3" 
          fill="#2196F3"
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.g>
      
      {/* Child 1 (Center-Left - Girl) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.circle 
          cx="40" 
          cy="48" 
          r="5" 
          fill="#64B5F6"
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.rect 
          x="36.5" 
          y="54" 
          width="7" 
          height="14" 
          rx="2" 
          fill="#64B5F6"
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </motion.g>
      
      {/* Child 2 (Center-Right - Boy) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.circle 
          cx="60" 
          cy="48" 
          r="5" 
          fill="#64B5F6"
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.rect 
          x="56.5" 
          y="54" 
          width="7" 
          height="14" 
          rx="2" 
          fill="#64B5F6"
          animate={isActive ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
      </motion.g>
      
      {/* Parent 2 (Right - Mom) */}
      <motion.g
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.circle 
          cx="75" 
          cy="42" 
          r="7" 
          fill="#2196F3"
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <motion.rect 
          x="70" 
          y="50" 
          width="10" 
          height="20" 
          rx="3" 
          fill="#2196F3"
          animate={isActive ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
      </motion.g>
      
      {/* Ground Line */}
      <motion.line
        x1="15"
        y1="72"
        x2="85"
        y2="72"
        stroke="#1976D2"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
      
      {/* Heart connecting family */}
      {isHovered && (
        <motion.path
          d="M50 32C50 32 48 30 46 30C44 30 44 32 46 34L50 38L54 34C56 32 56 30 54 30C52 30 50 32 50 32Z"
          fill="#E91E63"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      )}
    </motion.svg>
  );
}

// Business Elite - Group of Well-Dressed People in Meeting
export function BusinessEliteVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { y: [0, -2, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Conference Room Table */}
      <motion.ellipse
        cx="50"
        cy="65"
        rx="35"
        ry="8"
        fill="#90A4AE"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Table Top Surface */}
      <motion.ellipse
        cx="50"
        cy="63"
        rx="32"
        ry="7"
        fill="#B0BEC5"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      
      {/* Person 1 (Left - in suit) */}
      <motion.g
        initial={{ x: -15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle cx="25" cy="40" r="5" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="20.5" y="46" width="9" height="14" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="24" y="46" width="2" height="8" fill="#9D4EDD" />
      </motion.g>
      
      {/* Person 2 (Center-Left - in suit) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Head */}
        <motion.circle cx="40" cy="35" r="6" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="34.5" y="42" width="11" height="17" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="39" y="42" width="2" height="10" fill="#00D4FF" />
        {/* Briefcase on table */}
        <motion.rect
          x="43"
          y="58"
          width="6"
          height="4"
          rx="1"
          fill="#8D6E63"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
      </motion.g>
      
      {/* Person 3 (Center-Right - in dress) */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {/* Head */}
        <motion.circle cx="60" cy="35" r="6" fill="#607D8B" />
        {/* Professional Dress */}
        <motion.path
          d="M55 42L60 42L62 59L58 59Z"
          fill="url(#businessDressGradient)"
        />
        {/* Document on table */}
        <motion.rect
          x="51"
          y="58"
          width="5"
          height="4"
          rx="0.5"
          fill="#fff"
          stroke="#CFD8DC"
          strokeWidth="0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9 }}
        />
      </motion.g>
      
      {/* Person 4 (Right - in suit) */}
      <motion.g
        initial={{ x: 15, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Head */}
        <motion.circle cx="75" cy="40" r="5" fill="#607D8B" />
        {/* Suit Body */}
        <motion.rect x="70.5" y="46" width="9" height="14" rx="2" fill="#455A64" />
        {/* Tie */}
        <motion.rect x="74" y="46" width="2" height="8" fill="url(#businessTieGradient)" />
      </motion.g>
      
      {/* Laptop on Table (Center) */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        {/* Laptop Base */}
        <motion.rect x="46" y="57" width="8" height="5" rx="0.5" fill="#37474F" />
        {/* Laptop Screen */}
        <motion.rect x="47" y="50" width="6" height="7" rx="0.5" fill="#90CAF9" />
        <motion.rect x="47.5" y="50.5" width="5" height="6" fill="#BBDEFB" />
      </motion.g>
      
      {/* Coffee Cups */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <motion.ellipse cx="32" cy="60" rx="2" ry="1.5" fill="#8D6E63" />
        <motion.rect x="30" y="58" width="4" height="2" fill="#A1887F" />
        
        <motion.ellipse cx="68" cy="60" rx="2" ry="1.5" fill="#8D6E63" />
        <motion.rect x="66" y="58" width="4" height="2" fill="#A1887F" />
      </motion.g>
      
      {/* Rising Chart/Presentation on Hover */}
      {isHovered && (
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {/* Chart Background */}
          <motion.rect x="42" y="20" width="16" height="12" rx="1" fill="#fff" stroke="#CFD8DC" strokeWidth="0.5" />
          {/* Rising Bars */}
          <motion.rect x="44" y="28" width="2" height="3" fill="#4CAF50" 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect x="47" y="26" width="2" height="5" fill="#4CAF50" 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.1 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect x="50" y="24" width="2" height="7" fill="#4CAF50" 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.2 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect x="53" y="25" width="2" height="6" fill="#4CAF50" 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 }}
            style={{ transformOrigin: 'bottom' }}
          />
        </motion.g>
      )}
      
      {/* Sparkle/Success Indicators */}
      {isActive && [
        { x: 35, y: 28 },
        { x: 65, y: 30 }
      ].map((sparkle, i) => (
        <motion.circle
          key={i}
          cx={sparkle.x}
          cy={sparkle.y}
          r="1.5"
          fill="#FFD700"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="businessDressGradient" x1="55" y1="42" x2="62" y2="59">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id="businessTieGradient" x1="74" y1="46" x2="74" y2="54">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Adventure Package - Mountain Peak with Flag
export function AdventurePackageVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Sky/Background Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        fill="#E3F2FD"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Back Mountains */}
      <motion.path
        d="M10 75L30 45L50 60L70 35L90 75Z"
        fill="#9D4EDD"
        opacity="0.4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 0.4 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      
      {/* Front Mountain */}
      <motion.path
        d="M15 75L35 50L55 65L75 40L85 75Z"
        fill="url(#adventureMountainGradient)"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      
      {/* Snow Caps */}
      <motion.path
        d="M35 50L40 42L45 50L42 52Z"
        fill="#fff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />
      <motion.path
        d="M75 40L80 32L85 40L82 42Z"
        fill="#fff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
      
      {/* Flag Pole */}
      <motion.line
        x1="80"
        y1="32"
        x2="80"
        y2="20"
        stroke="#FFD700"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      />
      
      {/* Waving Flag */}
      <motion.path
        d="M80 20L88 22L86 26L80 24Z"
        fill="#FFD700"
        initial={{ scaleX: 0 }}
        animate={{ 
          scaleX: 1,
          x: isActive ? [0, 1, 0] : 0
        }}
        transition={{ 
          scaleX: { duration: 0.4, delay: 1 },
          x: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ transformOrigin: 'left' }}
      />
      
      {/* Sun */}
      <motion.circle
        cx="25"
        cy="30"
        r="8"
        fill="#FDB022"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
      
      {/* Clouds */}
      {isHovered && (
        <motion.g
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: [0, 15, 0], opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <motion.ellipse cx="60" cy="28" rx="6" ry="3" fill="#fff" opacity="0.8" />
          <motion.ellipse cx="65" cy="26" rx="5" ry="3" fill="#fff" opacity="0.8" />
        </motion.g>
      )}
      
      <defs>
        <linearGradient id="adventureMountainGradient" x1="15" y1="40" x2="85" y2="75">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Culinary Journey - Chef Hat with Steam
export function CulinaryJourneyVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Plate */}
      <motion.ellipse
        cx="50"
        cy="70"
        rx="28"
        ry="6"
        fill="#F57C00"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Plate Detail */}
      <motion.ellipse
        cx="50"
        cy="70"
        rx="24"
        ry="5"
        fill="#FF9800"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      
      {/* Chef Hat Base */}
      <motion.rect
        x="35"
        y="60"
        width="30"
        height="10"
        rx="2"
        fill="url(#culinaryHatBaseGradient)"
        stroke="#9D4EDD"
        strokeWidth="1"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ transformOrigin: 'bottom' }}
      />
      
      {/* Chef Hat Puffy Top */}
      <motion.path
        d="M38 60C38 52 42 45 50 45C58 45 62 52 62 60Z"
        fill="#fff"
        stroke="#00D4FF"
        strokeWidth="1.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
      />
      
      {/* Hat Pleats */}
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1={40 + i * 5}
          y1={60}
          x2={40 + i * 5}
          y2={50}
          stroke="#F5F5F5"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7 + i * 0.05 }}
        />
      ))}
      
      {/* Steam Rising */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${42 + i * 8} 43Q${44 + i * 8} 38 ${42 + i * 8} 33Q${40 + i * 8} 28 ${42 + i * 8} 23`}
          stroke="#90CAF9"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0, 0.7, 0]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Fork and Knife Crossed */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Fork */}
        <motion.g transform="rotate(-15 20 72)">
          <motion.line x1="20" y1="65" x2="20" y2="78" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
          <motion.line x1="18" y1="65" x2="18" y2="70" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" />
          <motion.line x1="22" y1="65" x2="22" y2="70" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
        
        {/* Knife */}
        <motion.g transform="rotate(15 80 72)">
          <motion.line x1="80" y1="65" x2="80" y2="78" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
          <motion.path d="M78 65L80 68L82 65Z" fill="#E65100" />
        </motion.g>
      </motion.g>
      
      {/* Stars on hover */}
      {isHovered && (
        <>
          <motion.circle
            cx="30"
            cy="52"
            r="2"
            fill="#9D4EDD"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="70"
            cy="52"
            r="2"
            fill="#00D4FF"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
      
      <defs>
        <linearGradient id="culinaryHatBaseGradient" x1="35" y1="60" x2="65" y2="70">
          <stop offset="0%" stopColor="#F3E5F5" />
          <stop offset="100%" stopColor="#E1F5FE" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Wellness Retreat - Person Doing Yoga
export function WellnessRetreatVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Peaceful Background Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="38"
        fill="#F3E5F5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Sunrise/Glow */}
      <motion.circle
        cx="50"
        cy="30"
        r="10"
        fill="#FFD700"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Yoga Mat */}
      <motion.rect
        x="30"
        y="60"
        width="40"
        height="4"
        rx="2"
        fill="url(#wellnessYogaMatGradient)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Person in Lotus/Meditation Pose */}
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Head */}
        <motion.circle 
          cx="50" 
          cy="40" 
          r="6" 
          fill="#9D4EDD"
          animate={isActive ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Body (Torso) */}
        <motion.rect 
          x="46" 
          y="47" 
          width="8" 
          height="10" 
          rx="2" 
          fill="url(#wellnessYogaBodyGradient)"
          animate={isActive ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Left Arm (raised, bent at elbow - meditation mudra) */}
        <motion.path
          d="M46 50L40 48L38 53"
          stroke="#9D4EDD"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5 }}
        />
        
        {/* Right Arm (raised, bent at elbow - meditation mudra) */}
        <motion.path
          d="M54 50L60 48L62 53"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6 }}
        />
        
        {/* Legs in Lotus Position */}
        <motion.ellipse
          cx="50"
          cy="60"
          rx="10"
          ry="4"
          fill="#00D4FF"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7 }}
        />
        
        {/* Hand Mudras (meditation gesture) */}
        <motion.circle cx="38" cy="53" r="2" fill="#CE93D8" 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        />
        <motion.circle cx="62" cy="53" r="2" fill="#CE93D8" 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.85 }}
        />
      </motion.g>
      
      {/* Peaceful Energy Aura/Chakra */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="50"
          cy="40"
          r={8 + i * 4}
          stroke="#E1BEE7"
          strokeWidth="1"
          fill="none"
          opacity={0.3 - i * 0.08}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3 - i * 0.08, 0.1, 0.3 - i * 0.08]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Decorative Leaves */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {/* Left Leaf */}
        <motion.path
          d="M20 55Q18 50 20 45Q22 50 20 55"
          fill="#10B981"
          opacity="0.6"
          animate={isActive ? { rotate: [0, 5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '20px 50px' }}
        />
        
        {/* Right Leaf */}
        <motion.path
          d="M80 55Q78 50 80 45Q82 50 80 55"
          fill="#10B981"
          opacity="0.6"
          animate={isActive ? { rotate: [0, -5, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '80px 50px' }}
        />
      </motion.g>
      
      {/* Floating Lotus Petals on Hover */}
      {isHovered && [
        { x: 30, y: 35, delay: 0 },
        { x: 70, y: 38, delay: 0.3 },
        { x: 40, y: 25, delay: 0.6 }
      ].map((petal, i) => (
        <motion.ellipse
          key={i}
          cx={petal.x}
          cy={petal.y}
          rx="3"
          ry="5"
          fill="#E1BEE7"
          opacity="0.7"
          initial={{ y: petal.y + 20, opacity: 0, rotate: 0 }}
          animate={{ 
            y: [petal.y + 20, petal.y - 10, petal.y - 10],
            opacity: [0, 0.7, 0],
            rotate: [0, 180, 180]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            delay: petal.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Om Symbol */}
      {isActive && (
        <motion.text
          x="50"
          y="78"
          textAnchor="middle"
          fill="#9C27B0"
          fontSize="12"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ॐ
        </motion.text>
      )}
      
      {/* Breathing Indicator Dots */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={45 + i * 5}
          cy="20"
          r="1.5"
          fill={i === 0 ? "#9D4EDD" : i === 1 ? "#7E69D6" : "#00D4FF"}
          opacity="0.4"
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
      
      <defs>
        <linearGradient id="wellnessYogaMatGradient" x1="30" y1="62" x2="70" y2="62">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id="wellnessYogaBodyGradient" x1="46" y1="47" x2="54" y2="57">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Luxury Experience - Diamond Crown
export function LuxuryExperienceVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Crown Base */}
      <motion.path
        d="M25 60L30 42L38 50L50 38L62 50L70 42L75 60L72 68H28L25 60Z"
        fill="url(#luxuryCrownGradient)"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6 }}
        style={{ transformOrigin: 'bottom' }}
      />
      
      {/* Crown Gems/Points */}
      <motion.circle
        cx="30"
        cy="40"
        r="5"
        fill="#FFD700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      <motion.circle
        cx="50"
        cy="35"
        r="6"
        fill="#FFD700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <motion.circle
        cx="70"
        cy="40"
        r="5"
        fill="#FFD700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      
      {/* Precious Gems on Points */}
      <motion.circle cx="30" cy="40" r="2.5" fill="#E91E63" 
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
      />
      <motion.circle cx="50" cy="35" r="3" fill="#2196F3" 
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
      />
      <motion.circle cx="70" cy="40" r="2.5" fill="#4CAF50" 
        initial={{ scale: 0 }}
        animate={{ scale: isActive ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
      />
      
      {/* Crown Band Details */}
      {[32, 38, 44, 50, 56, 62, 68].map((x, i) => (
        <motion.rect
          key={x}
          x={x - 1.5}
          y="60"
          width="3"
          height="3"
          rx="0.5"
          fill="#fff"
          opacity="0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 1 + i * 0.05 }}
        />
      ))}
      
      {/* Velvet Cushion Base */}
      <motion.rect
        x="28"
        y="68"
        width="44"
        height="8"
        rx="3"
        fill="url(#luxuryCushionGradient)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      />
      
      {/* Cushion Shine */}
      <motion.ellipse
        cx="50"
        cy="70"
        rx="15"
        ry="2"
        fill="#E1F5FE"
        opacity="0.3"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, delay: 1.4 }}
      />
      
      {/* Sparkle Effects Around Crown */}
      {[
        { x: 20, y: 45, delay: 0 },
        { x: 80, y: 45, delay: 0.3 },
        { x: 50, y: 25, delay: 0.6 },
        { x: 35, y: 32, delay: 0.9 }
      ].map((sparkle, i) => (
        <motion.g key={i}>
          <motion.line
            x1={sparkle.x - 3}
            y1={sparkle.y}
            x2={sparkle.x + 3}
            y2={sparkle.y}
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: "easeInOut"
            }}
          />
          <motion.line
            x1={sparkle.x}
            y1={sparkle.y - 3}
            x2={sparkle.x}
            y2={sparkle.y + 3}
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              delay: sparkle.delay + 0.2,
              ease: "easeInOut"
            }}
          />
        </motion.g>
      ))}
      
      <defs>
        <linearGradient id="luxuryCrownGradient" x1="25" y1="38" x2="75" y2="68">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="50%" stopColor="#7E69D6" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id="luxuryCushionGradient" x1="28" y1="68" x2="72" y2="76">
          <stop offset="0%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// Custom Package - Creative Palette with Brush
export function CustomPackageVector({ className = "", isActive = false, size = 80 }: VectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      animate={isActive ? { rotate: [0, 2, -2, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Paint Palette */}
      <motion.path
        d="M50 30C35 30 25 38 25 48C25 58 30 65 40 67C42 67 43 66 43 64C43 62 42 60 42 58C42 56 43 54 45 54C47 54 48 56 48 58C48 62 46 65 42 68C50 70 60 68 68 62C75 56 78 48 75 40C72 32 62 30 50 30Z"
        fill="#fff"
        stroke="#E0E0E0"
        strokeWidth="2"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
      />
      
      {/* Paint Colors on Palette */}
      <motion.circle cx="38" cy="42" r="4" fill="#E91E63" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      />
      <motion.circle cx="50" cy="40" r="4" fill="#2196F3" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.circle cx="62" cy="42" r="4" fill="#4CAF50" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />
      <motion.circle cx="45" cy="52" r="4" fill="#FF9800" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />
      <motion.circle cx="57" cy="52" r="4" fill="#9C27B0" 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
      
      {/* Paint Brush */}
      <motion.g
        initial={{ x: 20, y: -20, rotate: -45, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        {/* Brush Handle */}
        <motion.rect
          x="65"
          y="25"
          width="4"
          height="20"
          rx="2"
          fill="#D84315"
          transform="rotate(-45 67 35)"
        />
        {/* Brush Ferrule */}
        <motion.rect
          x="58"
          y="32"
          width="4"
          height="6"
          fill="#757575"
          transform="rotate(-45 60 35)"
        />
        {/* Brush Bristles */}
        <motion.path
          d="M56 36L52 40L54 42L58 38Z"
          fill="#FFEB3B"
          transform="rotate(-45 55 39)"
        />
      </motion.g>
      
      {/* Creative Sparkles/Stars */}
      {[
        { x: 30, y: 28, size: 3, delay: 0 },
        { x: 72, y: 58, size: 2.5, delay: 0.3 },
        { x: 60, y: 25, size: 2, delay: 0.6 }
      ].map((star, i) => (
        <motion.g key={i}>
          <motion.path
            d={`M${star.x} ${star.y - star.size}L${star.x + star.size * 0.3} ${star.y - star.size * 0.3}L${star.x + star.size} ${star.y}L${star.x + star.size * 0.3} ${star.y + star.size * 0.3}L${star.x} ${star.y + star.size}L${star.x - star.size * 0.3} ${star.y + star.size * 0.3}L${star.x - star.size} ${star.y}L${star.x - star.size * 0.3} ${star.y - star.size * 0.3}Z`}
            fill="#FFD700"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: isActive ? [1, 1.3, 1] : 1,
              rotate: isActive ? 360 : 0
            }}
            transition={{ 
              scale: { duration: 1.5, repeat: Infinity, delay: star.delay },
              rotate: { duration: 3, repeat: Infinity, ease: "linear" }
            }}
          />
        </motion.g>
      ))}
      
      {/* Floating Color Drops on Hover */}
      {isHovered && [
        { x: 45, y: 70, color: "#E91E63", delay: 0 },
        { x: 55, y: 72, color: "#2196F3", delay: 0.2 }
      ].map((drop, i) => (
        <motion.circle
          key={i}
          cx={drop.x}
          cy={drop.y}
          r="2"
          fill={drop.color}
          initial={{ y: 60, opacity: 0 }}
          animate={{ 
            y: [60, drop.y, drop.y + 10],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            delay: drop.delay
          }}
        />
      ))}
      
      {/* Plus Sign in Circle (Create New) */}
      <motion.circle
        cx="75"
        cy="70"
        r="8"
        fill="url(#customGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 300 }}
      />
      <motion.line x1="75" y1="66" x2="75" y2="74" stroke="#fff" strokeWidth="2" strokeLinecap="round" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.4 }}
      />
      <motion.line x1="71" y1="70" x2="79" y2="70" stroke="#fff" strokeWidth="2" strokeLinecap="round" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.5 }}
      />
      
      <defs>
        <linearGradient id="customGradient" x1="67" y1="62" x2="83" y2="78">
          <stop offset="0%" stopColor="#5FAD43" />
          <stop offset="50%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#9C27B0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
