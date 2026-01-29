import { motion } from 'motion/react';

interface HotelOperatorVectorProps {
  className?: string;
}

export function HotelOperatorVector({ className }: HotelOperatorVectorProps) {
  return (
    <motion.svg
      viewBox="0 0 300 200"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E6F3FF" />
          <stop offset="100%" stopColor="#B8E0FF" />
        </linearGradient>
        <linearGradient id="hotelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2C5AA0" />
          <stop offset="100%" stopColor="#1E4080" />
        </linearGradient>
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8F4FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B8E0FF" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F0F0" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
      </defs>

      {/* Sky Background */}
      <rect width="300" height="120" fill="url(#skyGradient)" />
      
      {/* Ground */}
      <motion.rect
        x="0"
        y="120"
        width="300"
        height="80"
        fill="url(#groundGradient)"
        initial={{ y: 200 }}
        animate={{ y: 120 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Hotel Building */}
      <motion.rect
        x="120"
        y="60"
        width="160"
        height="80"
        rx="8"
        fill="url(#hotelGradient)"
        initial={{ y: 200 }}
        animate={{ y: 60 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      {/* Hotel Windows */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Window Row 1 */}
        <rect x="130" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="150" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="170" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="190" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="210" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="230" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="250" y="70" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        
        {/* Window Row 2 */}
        <rect x="130" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="150" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="170" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="190" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="210" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="230" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="250" y="90" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        
        {/* Window Row 3 */}
        <rect x="130" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="150" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="170" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="190" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="210" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="230" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
        <rect x="250" y="110" width="15" height="12" rx="2" fill="#FFE066" opacity="0.9" />
      </motion.g>

      {/* Glass Entrance */}
      <motion.rect
        x="80"
        y="90"
        width="50"
        height="50"
        rx="6"
        fill="url(#glassGradient)"
        stroke="#B8E0FF"
        strokeWidth="2"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      />

      {/* Hotel Sign */}
      <motion.rect
        x="140"
        y="45"
        width="80"
        height="20"
        rx="10"
        fill="#5FAD43"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
      />
      
      <motion.text
        x="180"
        y="58"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        PREMIUM HOTEL
      </motion.text>

      {/* Concierge */}
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        {/* Concierge Body */}
        <ellipse cx="55" cy="130" rx="8" ry="15" fill="#2C5AA0" />
        {/* Concierge Head */}
        <circle cx="55" cy="110" r="6" fill="#FFDBAA" />
        {/* Concierge Hat */}
        <ellipse cx="55" cy="106" rx="7" ry="3" fill="#1E4080" />
        {/* Concierge Arms */}
        <ellipse cx="48" cy="120" rx="3" ry="8" fill="#FFDBAA" />
        <ellipse cx="62" cy="120" rx="3" ry="8" fill="#FFDBAA" />
        {/* Welcome Gesture */}
        <circle cx="65" cy="115" r="2" fill="#FFDBAA" />
      </motion.g>

      {/* Family Group */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {/* Father */}
        <motion.g
          animate={{ y: [0, -1, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        >
          {/* Father Body */}
          <ellipse cx="30" cy="135" rx="6" ry="12" fill="#4A90E2" />
          {/* Father Head */}
          <circle cx="30" cy="115" r="5" fill="#FFDBAA" />
          {/* Father Hair */}
          <path d="M 25 112 Q 30 108 35 112" fill="#8B4513" />
          {/* Father Arms */}
          <ellipse cx="24" cy="125" rx="2" ry="6" fill="#FFDBAA" />
          <ellipse cx="36" cy="125" rx="2" ry="6" fill="#FFDBAA" />
          {/* Luggage */}
          <rect x="38" y="120" width="8" height="6" rx="2" fill="#8B4513" />
        </motion.g>

        {/* Mother */}
        <motion.g
          animate={{ y: [0, -1, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.7 }}
        >
          {/* Mother Body */}
          <ellipse cx="45" cy="135" rx="6" ry="12" fill="#E74C3C" />
          {/* Mother Head */}
          <circle cx="45" cy="115" r="5" fill="#FFDBAA" />
          {/* Mother Hair */}
          <path d="M 40 112 Q 45 108 50 112 Q 47 110 45 112 Q 43 110 40 112" fill="#D2691E" />
          {/* Mother Arms */}
          <ellipse cx="39" cy="125" rx="2" ry="6" fill="#FFDBAA" />
          <ellipse cx="51" cy="125" rx="2" ry="6" fill="#FFDBAA" />
          {/* Handbag */}
          <ellipse cx="53" cy="128" rx="3" ry="4" fill="#8B4513" />
        </motion.g>

        {/* Child 1 */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
        >
          {/* Child Body */}
          <ellipse cx="20" cx="20" cy="140" rx="4" ry="8" fill="#F39C12" />
          {/* Child Head */}
          <circle cx="20" cy="125" r="4" fill="#FFDBAA" />
          {/* Child Hair */}
          <path d="M 16 123 Q 20 119 24 123" fill="#8B4513" />
          {/* Child Arms */}
          <ellipse cx="16" cy="133" rx="1.5" ry="4" fill="#FFDBAA" />
          <ellipse cx="24" cy="133" rx="1.5" ry="4" fill="#FFDBAA" />
          {/* Small Backpack */}
          <ellipse cx="24" cy="130" rx="2" ry="3" fill="#9B59B6" />
        </motion.g>

        {/* Child 2 */}
        <motion.g
          animate={{ y: [0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 2.1, delay: 0.9 }}
        >
          {/* Child Body */}
          <ellipse cx="35" cy="140" rx="4" ry="8" fill="#2ECC71" />
          {/* Child Head */}
          <circle cx="35" cy="125" r="4" fill="#FFDBAA" />
          {/* Child Hair */}
          <path d="M 31 123 Q 35 119 39 123 Q 37 121 35 123 Q 33 121 31 123" fill="#D2691E" />
          {/* Child Arms */}
          <ellipse cx="31" cy="133" rx="1.5" ry="4" fill="#FFDBAA" />
          <ellipse cx="39" cy="133" rx="1.5" ry="4" fill="#FFDBAA" />
          {/* Toy */}
          <circle cx="41" cy="133" r="2" fill="#E74C3C" />
        </motion.g>
      </motion.g>

      {/* Welcome Mat */}
      <motion.ellipse
        cx="105"
        cy="145"
        rx="25"
        ry="8"
        fill="#8B4513"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8 }}
      />

      {/* Decorative Elements */}
      {/* Palm Trees */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
      >
        {/* Tree 1 */}
        <rect x="15" y="110" width="3" height="30" fill="#8B4513" />
        <ellipse cx="16.5" cy="105" rx="8" ry="6" fill="#228B22" />
        
        {/* Tree 2 */}
        <rect x="270" y="115" width="3" height="25" fill="#8B4513" />
        <ellipse cx="271.5" cy="110" rx="7" ry="5" fill="#228B22" />
      </motion.g>

      {/* Stars/Sparkles */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <path d="M 260 25 L 262 30 L 267 30 L 263 33 L 265 38 L 260 35 L 255 38 L 257 33 L 253 30 L 258 30 Z" fill="#FFD700" />
        <path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="#FFD700" />
      </motion.g>
    </motion.svg>
  );
}