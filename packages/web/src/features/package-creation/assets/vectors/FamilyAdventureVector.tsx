
import { motion } from 'motion/react';
import { useState } from 'react';
import { VectorProps } from './types';

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
