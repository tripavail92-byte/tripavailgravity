
import { motion } from 'motion/react';
import { useState } from 'react';
import { VectorProps } from './types';

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
