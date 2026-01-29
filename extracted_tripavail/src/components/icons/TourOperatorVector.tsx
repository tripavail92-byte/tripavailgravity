import { motion } from 'motion/react';

interface TourOperatorVectorProps {
  className?: string;
}

export function TourOperatorVector({ className }: TourOperatorVectorProps) {
  return (
    <motion.svg
      viewBox="0 0 300 200"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Gradients */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#B0E0E6" />
        </linearGradient>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8FBC8F" />
          <stop offset="100%" stopColor="#6B8E6B" />
        </linearGradient>
        <linearGradient id="busGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#E55A2B" />
        </linearGradient>
        <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#98FB98" />
          <stop offset="100%" stopColor="#90EE90" />
        </linearGradient>
      </defs>

      {/* Sky Background */}
      <rect width="300" height="120" fill="url(#skyGradient)" />

      {/* Mountains Background */}
      <motion.g
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        {/* Mountain Range */}
        <path d="M 0 80 L 50 40 L 100 60 L 150 30 L 200 50 L 250 25 L 300 45 L 300 120 L 0 120 Z" fill="url(#mountainGradient)" />
        {/* Snow Caps */}
        <path d="M 45 45 L 50 40 L 55 45 Z" fill="white" />
        <path d="M 145 35 L 150 30 L 155 35 Z" fill="white" />
        <path d="M 245 30 L 250 25 L 255 30 Z" fill="white" />
      </motion.g>

      {/* Ground */}
      <motion.rect
        x="0"
        y="120"
        width="300"
        height="80"
        fill="url(#groundGradient)"
        initial={{ y: 200 }}
        animate={{ y: 120 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Trees */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.0, type: "spring" }}
      >
        {/* Tree 1 */}
        <rect x="20" y="100" width="4" height="25" fill="#8B4513" />
        <circle cx="22" cy="95" r="8" fill="#228B22" />
        
        {/* Tree 2 */}
        <rect x="260" y="105" width="4" height="20" fill="#8B4513" />
        <circle cx="262" cy="100" r="6" fill="#228B22" />
        
        {/* Tree 3 */}
        <rect x="40" y="95" width="3" height="30" fill="#8B4513" />
        <circle cx="41.5" cy="90" r="7" fill="#228B22" />
      </motion.g>

      {/* Tour Bus */}
      <motion.g
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      >
        {/* Bus Body */}
        <rect x="120" y="130" width="80" height="35" rx="8" fill="url(#busGradient)" />
        
        {/* Bus Windows */}
        <rect x="130" y="135" width="12" height="8" rx="2" fill="#87CEEB" />
        <rect x="145" y="135" width="12" height="8" rx="2" fill="#87CEEB" />
        <rect x="160" y="135" width="12" height="8" rx="2" fill="#87CEEB" />
        <rect x="175" y="135" width="12" height="8" rx="2" fill="#87CEEB" />
        
        {/* Front Window */}
        <rect x="125" y="135" width="8" height="8" rx="2" fill="#87CEEB" />
        
        {/* Bus Wheels */}
        <circle cx="135" cy="170" r="8" fill="#2C3E50" />
        <circle cx="135" cy="170" r="5" fill="#95A5A6" />
        <circle cx="185" cy="170" r="8" fill="#2C3E50" />
        <circle cx="185" cy="170" r="5" fill="#95A5A6" />
        
        {/* Bus Door */}
        <rect x="195" y="140" width="8" height="25" rx="2" fill="#E74C3C" />
        
        {/* Bus Sign */}
        <rect x="130" y="125" width="60" height="8" rx="2" fill="#FFD700" />
        <text x="160" y="131" textAnchor="middle" fill="#2C3E50" fontSize="6" fontWeight="600">ADVENTURE TOURS</text>
      </motion.g>

      {/* Tour Guide */}
      <motion.g
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        {/* Guide Body */}
        <ellipse cx="80" cy="150" rx="8" ry="15" fill="#E67E22" />
        {/* Guide Head */}
        <circle cx="80" cy="130" r="6" fill="#FFDBAA" />
        {/* Guide Hat */}
        <ellipse cx="80" cy="126" rx="8" ry="4" fill="#D35400" />
        <circle cx="80" cy="126" r="2" fill="#F39C12" />
        {/* Guide Arms */}
        <ellipse cx="72" cy="140" rx="3" ry="8" fill="#FFDBAA" />
        <ellipse cx="88" cy="140" rx="3" ry="8" fill="#FFDBAA" />
        
        {/* Flag */}
        <motion.g
          animate={{ rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ transformOrigin: "68px 135px" }}
        >
          <rect x="65" y="120" width="3" height="25" fill="#8B4513" />
          <rect x="58" y="120" width="15" height="10" fill="#E74C3C" />
          <text x="65" y="127" textAnchor="middle" fill="white" fontSize="4" fontWeight="600">TOUR</text>
        </motion.g>
      </motion.g>

      {/* Tourist Group */}
      <motion.g
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        {/* Tourist 1 */}
        <motion.g
          animate={{ y: [0, -1, 0] }}
          transition={{ repeat: Infinity, duration: 2.3, delay: 0.4 }}
        >
          <ellipse cx="50" cy="155" rx="6" ry="12" fill="#3498DB" />
          <circle cx="50" cy="138" r="5" fill="#FFDBAA" />
          <ellipse cx="50" cy="134" rx="6" ry="3" fill="#E74C3C" />
          <ellipse cx="44" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          <ellipse cx="56" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          {/* Camera */}
          <rect x="58" y="143" width="5" height="4" rx="1" fill="#2C3E50" />
          <circle cx="60" cy="145" r="1" fill="#E74C3C" />
        </motion.g>

        {/* Tourist 2 */}
        <motion.g
          animate={{ y: [0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
        >
          <ellipse cx="65" cy="155" rx="6" ry="12" fill="#9B59B6" />
          <circle cx="65" cy="138" r="5" fill="#FFDBAA" />
          <path d="M 60 136 Q 65 132 70 136 Q 67 134 65 136 Q 63 134 60 136" fill="#8B4513" />
          <ellipse cx="59" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          <ellipse cx="71" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          {/* Backpack */}
          <ellipse cx="73" cy="142" rx="3" ry="5" fill="#27AE60" />
        </motion.g>

        {/* Tourist 3 */}
        <motion.g
          animate={{ y: [0, -1, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
        >
          <ellipse cx="35" cy="155" rx="6" ry="12" fill="#E74C3C" />
          <circle cx="35" cy="138" r="5" fill="#FFDBAA" />
          <path d="M 30 136 Q 35 132 40 136" fill="#D2691E" />
          <ellipse cx="29" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          <ellipse cx="41" cy="145" rx="2" ry="6" fill="#FFDBAA" />
          {/* Map */}
          <rect x="25" y="140" width="6" height="8" rx="1" fill="#F4D03F" />
          <path d="M 26 142 L 30 144 L 28 146" stroke="#E74C3C" strokeWidth="0.5" fill="none" />
        </motion.g>
      </motion.g>

      {/* Clouds */}
      <motion.g
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 0.8 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        <circle cx="60" cy="30" r="8" fill="white" />
        <circle cx="68" cy="25" r="10" fill="white" />
        <circle cx="75" cy="30" r="8" fill="white" />
      </motion.g>

      <motion.g
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 0.6 }}
        transition={{ duration: 2, delay: 0.7 }}
      >
        <circle cx="220" cy="40" r="6" fill="white" />
        <circle cx="226" cy="36" r="8" fill="white" />
        <circle cx="232" cy="40" r="6" fill="white" />
      </motion.g>

      {/* Adventure Trail */}
      <motion.path
        d="M 30 170 Q 50 165, 70 170 T 110 165 Q 130 160, 150 165"
        stroke="#F39C12"
        strokeWidth="3"
        strokeDasharray="5,5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 1.2 }}
      />

      {/* Location Markers */}
      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 1.8, type: "spring" }}
      >
        <path d="M 28 165 C 28 160, 38 160, 38 165 C 38 170, 33 180, 33 180 S 28 170, 28 165" fill="#E74C3C" />
        <circle cx="33" cy="165" r="2" fill="white" />
      </motion.g>

      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 2.0, type: "spring" }}
      >
        <path d="M 108 160 C 108 155, 118 155, 118 160 C 118 165, 113 175, 113 175 S 108 165, 108 160" fill="#E74C3C" />
        <circle cx="113" cy="160" r="2" fill="white" />
      </motion.g>

      <motion.g
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 2.2, type: "spring" }}
      >
        <path d="M 148 160 C 148 155, 158 155, 158 160 C 158 165, 153 175, 153 175 S 148 165, 148 160" fill="#E74C3C" />
        <circle cx="153" cy="160" r="2" fill="white" />
      </motion.g>

      {/* Adventure Icons */}
      <motion.g
        animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        {/* Compass */}
        <circle cx="240" cy="150" r="8" fill="#F39C12" />
        <path d="M 240 145 L 243 150 L 240 155 L 237 150 Z" fill="#E74C3C" />
        <path d="M 235 150 L 240 147 L 245 150 L 240 153 Z" fill="#2C3E50" />
      </motion.g>

      <motion.g
        animate={{ y: [0, -4, 0], rotate: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
      >
        {/* Binoculars */}
        <ellipse cx="15" cy="50" rx="4" ry="6" fill="#2C3E50" />
        <ellipse cx="25" cy="50" rx="4" ry="6" fill="#2C3E50" />
        <rect x="17" y="47" width="6" height="6" fill="#34495E" />
        <circle cx="15" cy="50" r="2" fill="#3498DB" />
        <circle cx="25" cy="50" r="2" fill="#3498DB" />
      </motion.g>

      {/* Sun */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        style={{ transformOrigin: "250px 35px" }}
      >
        <circle cx="250" cy="35" r="8" fill="#F1C40F" />
        <path d="M 250 20 L 250 25 M 265 35 L 260 35 M 250 50 L 250 45 M 235 35 L 240 35 M 258 27 L 255 30 M 258 43 L 255 40 M 242 43 L 245 40 M 242 27 L 245 30" stroke="#F39C12" strokeWidth="2" />
      </motion.g>

      {/* Excitement Sparkles */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <motion.g
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <path d="M 100 60 L 102 65 L 107 65 L 103 68 L 105 73 L 100 70 L 95 73 L 97 68 L 93 65 L 98 65 Z" fill="#FFD700" />
        </motion.g>
        
        <motion.g
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
        >
          <path d="M 180 70 L 182 75 L 187 75 L 183 78 L 185 83 L 180 80 L 175 83 L 177 78 L 173 75 L 178 75 Z" fill="#FFD700" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}