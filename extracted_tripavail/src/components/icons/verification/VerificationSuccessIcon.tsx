import { motion } from 'motion/react';

export const VerificationSuccessIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
    >
      {/* Outer circle with gradient */}
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        fill="url(#gradient1)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      
      {/* Inner circle */}
      <motion.circle
        cx="48"
        cy="48"
        r="36"
        fill="#5FAD43"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      
      {/* Checkmark */}
      <motion.path
        d="M32 48L42 58L64 36"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />
      
      {/* Sparkle effects */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        {/* Top sparkle */}
        <motion.path
          d="M48 8L50 14L56 12L52 18L48 8Z"
          fill="#FFD700"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Right sparkle */}
        <motion.path
          d="M84 32L86 38L92 36L88 42L84 32Z"
          fill="#FFD700"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Left sparkle */}
        <motion.path
          d="M12 52L14 58L20 56L16 62L12 52Z"
          fill="#FFD700"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Bottom sparkle */}
        <motion.path
          d="M64 80L66 86L72 84L68 90L64 80Z"
          fill="#FFD700"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
      </motion.g>
      
      {/* Pulse effect */}
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        stroke="#5FAD43"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#5FAD43" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};