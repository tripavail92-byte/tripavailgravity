import { motion } from 'motion/react';
import { useState } from 'react';

interface VectorProps {
    className?: string;
    isActive?: boolean;
    size?: number;
}

export function KYCSelfieVector({ className = "", isActive = true, size = 200 }: VectorProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            className={className}
            initial="initial"
            animate="animate"
        >
            {/* Background Circle - Soft Glow */}
            <motion.circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="#F0FDF4" 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            />

            {/* User Body */}
            <motion.path
                d="M50 190 C50 150, 150 150, 150 190"
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            />

            {/* User Head */}
            <motion.circle
                cx="100"
                cy="90"
                r="35"
                fill="#FFD700" // Skin tone placeholder using yellow/gold for illustration style
                stroke="#FCD34D"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
            />

            {/* Smile */}
            <motion.path
                d="M85 100 Q100 115 115 100"
                stroke="#000"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            />

            {/* Eyes */}
            <motion.circle cx="85" cy="85" r="3" fill="#000" animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.2 }} />
            <motion.circle cx="115" cy="85" r="3" fill="#000" animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.2, delay: 0.1 }} />

            {/* ID Card Hand */}
            <motion.g
                initial={{ x: 40, y: 20, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
            >
                {/* Arm */}
                <path d="M130 160 L150 120" stroke="#FFD700" strokeWidth="12" strokeLinecap="round" />
                
                {/* ID Card */}
                <rect x="110" y="80" width="70" height="45" rx="4" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
                <rect x="110" y="80" width="70" height="10" rx="4" fill="#3B82F6" />
                
                {/* ID Photo */}
                <rect x="115" y="95" width="20" height="25" rx="2" fill="#E2E8F0" />
                
                {/* ID Lines */}
                <rect x="140" y="100" width="30" height="4" rx="2" fill="#CBD5E1" />
                <rect x="140" y="108" width="20" height="4" rx="2" fill="#CBD5E1" />
                
                {/* Hand holding card */}
                <circle cx="145" cy="125" r="8" fill="#FFD700" />
            </motion.g>

            {/* Success Checkmark Indicator */}
            <motion.circle
                cx="160"
                cy="60"
                r="15"
                fill="#22C55E"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
            />
            <motion.path
                d="M152 60 L158 66 L168 54"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
            />
        </motion.svg>
    );
}
