
import { motion } from 'motion/react';
import { useState } from 'react';
import { VectorProps } from './types';

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
            <motion.circle cx="35" cy="52" r="4" fill="#FFC107"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 }}
            />

            {/* Interactive Brush */}
            <motion.g
                initial={{ x: 20, y: -20, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
            >
                <motion.rect
                    x="58"
                    y="45"
                    width="4"
                    height="35"
                    rx="2"
                    transform="rotate(45 60 62)"
                    fill="#795548"
                />
                <motion.rect
                    x="52"
                    y="46"
                    width="6"
                    height="10"
                    rx="1"
                    transform="rotate(45 55 51)"
                    fill="#9E9E9E"
                />
                <motion.path
                    d="M48 48L53 43L50 40C48 40 45 42 45 45C45 46 46 47 48 48Z"
                    fill="#E91E63"
                    animate={isActive ? { fill: ["#E91E63", "#2196F3", "#4CAF50", "#FFC107"] } : {}}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            </motion.g>

            {/* Creative Sparks */}
            {isActive && [
                { x: 30, y: 25 },
                { x: 70, y: 25 },
                { x: 20, y: 50 },
                { x: 80, y: 50 }
            ].map((spark, i) => (
                <motion.g key={i}>
                    <motion.line
                        x1={spark.x - 2}
                        y1={spark.y - 2}
                        x2={spark.x + 2}
                        y2={spark.y + 2}
                        stroke={i % 2 === 0 ? "#E91E63" : "#2196F3"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0], rotate: 180 }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    />
                    <motion.line
                        x1={spark.x + 2}
                        y1={spark.y - 2}
                        x2={spark.x - 2}
                        y2={spark.y + 2}
                        stroke={i % 2 === 0 ? "#FFC107" : "#4CAF50"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0], rotate: -180 }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    />
                </motion.g>
            ))}
        </motion.svg>
    );
}
