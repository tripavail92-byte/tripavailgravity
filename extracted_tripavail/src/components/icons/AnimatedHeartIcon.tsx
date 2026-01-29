import { motion } from 'motion/react';

interface AnimatedHeartIconProps {
  className?: string;
}

export function AnimatedHeartIcon({ className = "w-5 h-5" }: AnimatedHeartIconProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="heartGradient" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FF69B4" />
          <stop offset="40%" stopColor="#FF1493" />
          <stop offset="100%" stopColor="#DC143C" />
        </radialGradient>
        <radialGradient id="heartGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFB6C1" />
          <stop offset="100%" stopColor="#FF69B4" />
        </radialGradient>
      </defs>
      
      {/* Main heart shape */}
      <motion.path
        d="M20.84 4.61C20.3292 4.09885 19.7228 3.69354 19.0554 3.41696C18.3879 3.14038 17.6725 2.99805 16.95 2.99805C16.2275 2.99805 15.5121 3.14038 14.8446 3.41696C14.1772 3.69354 13.5708 4.09885 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54869 7.04096 1.54869 8.5C1.54869 9.95904 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.3511 11.8792 21.7564 11.2728 22.033 10.6054C22.3096 9.93789 22.4519 9.22248 22.4519 8.5C22.4519 7.77752 22.3096 7.06211 22.033 6.39459C21.7564 5.72708 21.3511 5.12075 20.84 4.61Z"
        stroke="#B22222"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#heartGradient)"
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Pulsing heart beats */}
      <motion.path
        d="M20.84 4.61C20.3292 4.09885 19.7228 3.69354 19.0554 3.41696C18.3879 3.14038 17.6725 2.99805 16.95 2.99805C16.2275 2.99805 15.5121 3.14038 14.8446 3.41696C14.1772 3.69354 13.5708 4.09885 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54869 7.04096 1.54869 8.5C1.54869 9.95904 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.3511 11.8792 21.7564 11.2728 22.033 10.6054C22.3096 9.93789 22.4519 9.22248 22.4519 8.5C22.4519 7.77752 22.3096 7.06211 22.033 6.39459C21.7564 5.72708 21.3511 5.12075 20.84 4.61Z"
        stroke="#FF69B4"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 0.2, 0.6],
          stroke: ["#FF69B4", "#FFB6C1", "#FF69B4"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
      
      {/* Inner glow effect */}
      <motion.circle
        cx="12"
        cy="12"
        r="4"
        fill="url(#heartGlow)"
        opacity="0.3"
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Heart sparkles */}
      <motion.circle
        cx="8"
        cy="8"
        r="0.8"
        fill="#FFD700"
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5
        }}
      />
      
      <motion.circle
        cx="16"
        cy="10"
        r="0.6"
        fill="#FFF8DC"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1
        }}
      />
      
      <motion.circle
        cx="10"
        cy="16"
        r="0.5"
        fill="#FFFF00"
        animate={{
          scale: [0, 1.2, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1.5
        }}
      />
      
      {/* Floating hearts */}
      <motion.path
        d="M15 8C15 8 15.5 7.5 16 8C16.5 8.5 16.5 9 16 9.5C15.5 10 15 9.5 15 9.5"
        stroke="#FF1493"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FFB6C1"
        opacity="0.8"
        animate={{
          y: [0, -8, -16],
          opacity: [0.8, 0.4, 0],
          scale: [0.8, 1.2, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      
      <motion.path
        d="M9 10C9 10 9.3 9.7 9.6 10C9.9 10.3 9.9 10.6 9.6 10.9C9.3 11.2 9 10.9 9 10.9"
        stroke="#DC143C"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#FF69B4"
        opacity="0.7"
        animate={{
          y: [0, -6, -12],
          opacity: [0.7, 0.3, 0],
          scale: [0.9, 1.3, 0.7]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeOut",
          delay: 1
        }}
      />
      
      {/* Heart highlight */}
      <motion.path
        d="M8 8C8.5 7.5 9.5 7.5 10 8.5"
        stroke="#FFB6C1"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
        animate={{
          opacity: [0.8, 0.4, 0.8],
          pathLength: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Love pulse rings */}
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="#FF69B4"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        animate={{
          scale: [0.8, 1.4, 0.8],
          opacity: [0.3, 0.05, 0.3]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      
      <motion.circle
        cx="12"
        cy="12"
        r="12"
        stroke="#FFB6C1"
        strokeWidth="0.8"
        fill="none"
        opacity="0.2"
        animate={{
          scale: [0.6, 1.6, 0.6],
          opacity: [0.2, 0.02, 0.2]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5
        }}
      />
    </motion.svg>
  );
}