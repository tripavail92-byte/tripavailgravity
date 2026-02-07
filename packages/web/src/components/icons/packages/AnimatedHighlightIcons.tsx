import { motion } from 'motion/react';
import React from 'react';
import {
    Wifi,
    Coffee,
    Utensils,
    Car,
    Users,
    Briefcase,
    MapPin,
    Camera,
    Wine,
    Ticket,
    Music,
    Tv,
    Smartphone,
    CreditCard,
    Gift,
    Key
} from 'lucide-react';

interface AnimatedIconProps {
    className?: string;
    animate?: boolean;
    colored?: boolean;
}

// Continuous animation variants
const steamVariants = {
    animate: {
        y: [-2, -12],
        opacity: [0.6, 0],
        scale: [1, 1.3],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
        }
    }
};

const waveVariants = {
    animate: {
        d: [
            "M12 38 Q20 36 28 38 Q36 40 44 38",
            "M12 38 Q20 40 28 38 Q36 36 44 38",
            "M12 38 Q20 36 28 38 Q36 40 44 38"
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ClockIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Clock face with gradient */}
        <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill={colored ? "url(#clockGradient)" : "none"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke={colored ? "#1e293b" : "currentColor"}
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
        />
        {/* Clock hands */}
        <motion.path
            d="M32 16V32L42 42"
            stroke={colored ? "#0f172a" : "currentColor"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
        />
        {colored && (
            <defs>
                <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CocktailIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Martini glass with liquid */}
        <motion.path
            d="M12 10 L32 38 L52 10 Z"
            fill={colored ? "url(#cocktailGradient)" : "none"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
            d="M12 10 L32 38 L52 10 L12 10 Z"
            stroke={colored ? "#334155" : "currentColor"}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
        />

        {/* Glass stem */}
        <motion.line
            x1="32"
            y1="38"
            x2="32"
            y2="54"
            stroke={colored ? "#334155" : "currentColor"}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        />

        {/* Base */}
        <motion.ellipse
            cx="32"
            cy="54"
            rx="8"
            ry="2"
            stroke={colored ? "#334155" : "currentColor"}
            strokeWidth="2.5"
            fill={colored ? "#64748b" : "none"}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
        />

        {/* Animated falling ice cubes */}
        {colored && (
            <>
                {[0, 1, 2].map((i) => (
                    <motion.rect
                        key={`ice-${i}`}
                        x={24 + i * 6}
                        y={16}
                        width="4"
                        height="4"
                        rx="0.5"
                        fill="#93c5fd"
                        stroke="#60a5fa"
                        strokeWidth="1"
                        initial={{ y: 12, opacity: 0, rotate: 0 }}
                        animate={{
                            y: [12, 28, 12],
                            opacity: [0, 1, 0.3, 1, 0],
                            rotate: [0, 180, 360],
                            transition: {
                                duration: 2.5,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeInOut"
                            }
                        }}
                    />
                ))}

                {/* Splash effect at bottom */}
                <motion.circle
                    cx="32"
                    cy="28"
                    r="0"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    animate={{
                        r: [0, 8, 12],
                        opacity: [0.8, 0.4, 0],
                        transition: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                        }
                    }}
                />
            </>
        )}

        {/* Cherry on top */}
        {colored && (
            <>
                <motion.circle
                    cx="40"
                    cy="12"
                    r="3.5"
                    fill="#dc2626"
                    initial={{ scale: 0 }}
                    animate={{
                        scale: [1, 1.1, 1],
                        transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />
                <motion.path
                    d="M40 12 Q42 8 44 6"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                />
            </>
        )}

        {colored && (
            <defs>
                <linearGradient id="cocktailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CoffeeIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Coffee cup base - rounded mug shape */}
        <motion.path
            d="M14 22 L14 42 C14 46 16 50 20 52 L36 52 C40 50 42 46 42 42 L42 22 C42 20 40 18 38 18 L18 18 C16 18 14 20 14 22 Z"
            fill={colored ? "url(#coffeeGradient)" : "none"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
            d="M14 22 L14 42 C14 46 16 50 20 52 L36 52 C40 50 42 46 42 42 L42 22 C42 20 40 18 38 18 L18 18 C16 18 14 20 14 22 Z"
            stroke={colored ? "#78350f" : "currentColor"}
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
        />

        {/* Handle - curved */}
        <motion.path
            d="M42 26 C42 26 48 26 50 26 C52 26 54 28 54 30 L54 34 C54 36 52 38 50 38 C48 38 42 38 42 38"
            stroke={colored ? "#78350f" : "currentColor"}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Continuous Steam Animation */}
        {colored && (
            <>
                {[0, 1, 2].map((i) => (
                    <motion.path
                        key={`steam-${i}`}
                        d={`M${20 + i * 8} 16 Q${22 + i * 8} 10 ${20 + i * 8} 6`}
                        stroke="#fbbf24"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                        variants={steamVariants}
                        animate="animate"
                        style={{
                            originX: 0.5,
                            originY: 1,
                            translateY: i * -2
                        }}
                        transition={{ delay: i * 0.3 }}
                    />
                ))}
            </>
        )}

        {/* Coffee surface with gentle waves */}
        {colored && (
            <motion.path
                variants={waveVariants}
                animate="animate"
                stroke="#92400e"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
            />
        )}

        {colored && (
            <defs>
                <linearGradient id="coffeeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="50%" stopColor="#92400e" />
                    <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WifiIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Center dot - continuously pulsing */}
        <motion.circle
            cx="32"
            cy="50"
            r="3"
            fill={colored ? "#10b981" : "currentColor"}
            animate={colored ? {
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
                transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            } : {}}
        />

        {/* WiFi signal waves - continuously animating outward */}
        {[0, 1, 2].map((i) => (
            <motion.path
                key={`wifi-${i}`}
                d={
                    i === 0
                        ? "M22 40 Q27 36 32 36 Q37 36 42 40"
                        : i === 1
                            ? "M14 32 Q23 24 32 24 Q41 24 50 32"
                            : "M6 24 Q19 12 32 12 Q45 12 58 24"
                }
                stroke={colored ? (i === 0 ? "#10b981" : i === 1 ? "#059669" : "#047857") : "currentColor"}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={colored ? {
                    pathLength: 1,
                    opacity: [0.3, 1, 0.3],
                    transition: {
                        pathLength: { duration: 0.8, delay: i * 0.2 },
                        opacity: {
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut"
                        }
                    }
                } : {
                    pathLength: 1,
                    opacity: 1,
                    transition: { duration: 0.8, delay: i * 0.2 }
                }}
            />
        ))}

        {/* Signal bars indicator */}
        {colored && [0, 1, 2].map((i) => (
            <motion.rect
                key={`bar-${i}`}
                x={48 + i * 3}
                y={54 - i * 3}
                width="2"
                height={4 + i * 3}
                rx="1"
                fill="#10b981"
                animate={{
                    opacity: [0.5, 1, 0.5],
                    scaleY: [1, 1.2, 1],
                    transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                    }
                }}
            />
        ))}
    </motion.svg>
);

// Fitness Icon - Girl on Treadmill
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DumbbellIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Treadmill base */}
        <motion.rect
            x="8"
            y="42"
            width="48"
            height="12"
            rx="2"
            fill={colored ? "#1f2937" : "none"}
            stroke={colored ? "#111827" : "currentColor"}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
        />

        {/* Treadmill belt - moving */}
        {colored && [0, 1, 2, 3, 4].map((i) => (
            <motion.line
                key={`belt-${i}`}
                x1={12 + i * 8}
                y1="42"
                x2={16 + i * 8}
                y2="42"
                stroke="#374151"
                strokeWidth="2"
                animate={{
                    x1: [12 + i * 8, 12 + i * 8 - 40],
                    x2: [16 + i * 8, 16 + i * 8 - 40],
                    transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }
                }}
            />
        ))}

        {/* Treadmill screen/console */}
        <motion.rect
            x="20"
            y="12"
            width="12"
            height="8"
            rx="1"
            fill={colored ? "#3b82f6" : "none"}
            stroke={colored ? "#2563eb" : "currentColor"}
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        />

        {/* Support bar */}
        <motion.path
            d="M26 20 L26 12 M20 12 L32 12"
            stroke={colored ? "#4b5563" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Girl figure - continuously running */}
        {colored && (
            <motion.g
                animate={{
                    x: [0, 2, 0, -2, 0],
                    transition: {
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear"
                    }
                }}
            >
                {/* Head */}
                <motion.circle
                    cx="38"
                    cy="20"
                    r="4"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                />

                {/* Hair/Ponytail */}
                <motion.ellipse
                    cx="40"
                    cy="19"
                    rx="3"
                    ry="2"
                    fill="#92400e"
                    animate={{
                        x: [0, 2, 0],
                        transition: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />

                {/* Body */}
                <motion.path
                    d="M38 24 L38 34"
                    stroke="#ec4899"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* Arms - swinging */}
                <motion.path
                    d="M38 26 L34 30"
                    stroke="#ec4899"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M38 26 L34 30",
                            "M38 26 L36 32",
                            "M38 26 L34 30"
                        ],
                        transition: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />
                <motion.path
                    d="M38 26 L42 32"
                    stroke="#ec4899"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M38 26 L42 32",
                            "M38 26 L40 30",
                            "M38 26 L42 32"
                        ],
                        transition: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />

                {/* Legs - running motion */}
                <motion.path
                    d="M38 34 L36 42"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M38 34 L36 42",
                            "M38 34 L38 42",
                            "M38 34 L40 42",
                            "M38 34 L38 42",
                            "M38 34 L36 42"
                        ],
                        transition: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                />
                <motion.path
                    d="M38 34 L40 42"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M38 34 L40 42",
                            "M38 34 L38 42",
                            "M38 34 L36 42",
                            "M38 34 L38 42",
                            "M38 34 L40 42"
                        ],
                        transition: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                />
            </motion.g>
        )}

        {/* Speed indicator lines */}
        {colored && [0, 1, 2].map((i) => (
            <motion.line
                key={`speed-${i}`}
                x1={48 + i * 2}
                y1={28 + i * 3}
                x2={52 + i * 2}
                y2={28 + i * 3}
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                animate={{
                    opacity: [0.3, 1, 0.3],
                    x1: [48 + i * 2, 46 + i * 2],
                    x2: [52 + i * 2, 50 + i * 2],
                    transition: {
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeOut"
                    }
                }}
            />
        ))}
    </motion.svg>
);

// Room Upgrade Icon - Economy to Premium Transformation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const UpgradeIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Room outline */}
        <motion.rect
            x="8"
            y="12"
            width="48"
            height="40"
            rx="2"
            stroke={colored ? "#6366f1" : "currentColor"}
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
        />

        {/* Bed - transforming from simple to luxury */}
        <motion.g
            animate={colored ? {
                scale: [1, 1.05, 1],
                transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            } : {}}
        >
            {/* Bed base */}
            <motion.rect
                x="16"
                y="32"
                width="32"
                height="14"
                rx="2"
                fill={colored ? "url(#bedGradient)" : "none"}
                stroke={colored ? "#4f46e5" : "currentColor"}
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            />

            {/* Pillows - appearing */}
            <motion.rect
                x="18"
                y="34"
                width="8"
                height="5"
                rx="1"
                fill={colored ? "#fef3c7" : "none"}
                stroke={colored ? "#fbbf24" : "currentColor"}
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: 1, duration: 0.5 }
                }}
            />
            <motion.rect
                x="38"
                y="34"
                width="8"
                height="5"
                rx="1"
                fill={colored ? "#fef3c7" : "none"}
                stroke={colored ? "#fbbf24" : "currentColor"}
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: 1.2, duration: 0.5 }
                }}
            />

            {/* Headboard */}
            <motion.rect
                x="16"
                y="24"
                width="32"
                height="8"
                rx="1"
                fill={colored ? "#8b5cf6" : "none"}
                stroke={colored ? "#7c3aed" : "currentColor"}
                strokeWidth="2"
                initial={{ y: 32, opacity: 0 }}
                animate={{
                    y: 24,
                    opacity: 1,
                    transition: { delay: 0.5, duration: 0.8, type: "spring" }
                }}
            />
        </motion.g>

        {/* Luxury items appearing */}
        {colored && (
            <>
                {/* Lamp 1 */}
                <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 1],
                        scale: [0, 1.2, 1],
                        transition: { delay: 1.5, duration: 0.6 }
                    }}
                >
                    <circle cx="14" cy="22" r="2" fill="#fbbf24" />
                    <line x1="14" y1="24" x2="14" y2="28" stroke="#78350f" strokeWidth="1.5" />
                </motion.g>

                {/* Lamp 2 */}
                <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 1],
                        scale: [0, 1.2, 1],
                        transition: { delay: 1.7, duration: 0.6 }
                    }}
                >
                    <circle cx="50" cy="22" r="2" fill="#fbbf24" />
                    <line x1="50" y1="24" x2="50" y2="28" stroke="#78350f" strokeWidth="1.5" />
                </motion.g>

                {/* Stars/sparkles continuously appearing */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.path
                        key={`star-${i}`}
                        d={`M${20 + i * 8} ${16 + i % 2 * 2} l1 2 l2 0 l-1.5 1.5 l0.5 2 l-2 -1 l-2 1 l0.5 -2 l-1.5 -1.5 l2 0 z`}
                        fill="#fbbf24"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            transition: {
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: "easeInOut"
                            }
                        }}
                    />
                ))}
            </>
        )}

        {colored && (
            <defs>
                <linearGradient id="bedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// Pool Icon - Splash Animation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PoolIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Pool shape */}
        <motion.path
            d="M8 24 C8 24 16 20 32 20 C48 20 56 24 56 24 L56 48 C56 52 52 56 48 56 L16 56 C12 56 8 52 8 48 Z"
            fill={colored ? "url(#poolGradient)" : "none"}
            stroke={colored ? "#0284c7" : "currentColor"}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
        />

        {/* Pool Ladder */}
        <motion.path
            d="M16 16 L16 40 M24 16 L24 36 M16 24 L24 24 M16 32 L24 32"
            stroke={colored ? "#cbd5e1" : "currentColor"}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
        />

        {/* Wave animation inside pool */}
        {colored && (
            <>
                {[0, 1].map((i) => (
                    <motion.path
                        key={`wave-${i}`}
                        d={`M12 ${30 + i * 10} Q20 ${28 + i * 10} 28 ${30 + i * 10} Q36 ${32 + i * 10} 44 ${30 + i * 10} Q52 ${28 + i * 10} 52 ${30 + i * 10}`}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        fill="none"
                        animate={{
                            d: [
                                `M12 ${30 + i * 10} Q20 ${28 + i * 10} 28 ${30 + i * 10} Q36 ${32 + i * 10} 44 ${30 + i * 10} Q52 ${28 + i * 10} 52 ${30 + i * 10}`,
                                `M12 ${30 + i * 10} Q20 ${32 + i * 10} 28 ${30 + i * 10} Q36 ${28 + i * 10} 44 ${30 + i * 10} Q52 ${32 + i * 10} 52 ${30 + i * 10}`,
                                `M12 ${30 + i * 10} Q20 ${28 + i * 10} 28 ${30 + i * 10} Q36 ${32 + i * 10} 44 ${30 + i * 10} Q52 ${28 + i * 10} 52 ${30 + i * 10}`
                            ],
                            transition: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                            }
                        }}
                    />
                ))}
            </>
        )}

        {/* Sun reflecting */}
        {colored && (
            <motion.circle
                cx="46"
                cy="12"
                r="4"
                fill="#fcd34d"
                initial={{ scale: 0 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                    transition: { duration: 2, repeat: Infinity }
                }}
            />
        )}

        {colored && (
            <defs>
                <linearGradient id="poolGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HourglassIcon = ({ className = "w-12 h-12", animate = true, colored = false }: AnimatedIconProps) => (
    <motion.svg
        viewBox="0 0 64 64"
        fill="none"
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        {/* Hourglass shape */}
        <motion.path
            d="M16 12 L48 12 L36 32 L48 52 L16 52 L28 32 L16 12 Z"
            fill={colored ? "url(#sandGradient)" : "none"}
            stroke={colored ? "#b45309" : "currentColor"}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
        />

        {/* Top and Bottom plates */}
        <motion.rect
            x="14"
            y="8"
            width="36"
            height="4"
            fill={colored ? "#78350f" : "currentColor"}
            rx="1"
        />
        <motion.rect
            x="14"
            y="52"
            width="36"
            height="4"
            fill={colored ? "#78350f" : "currentColor"}
            rx="1"
        />

        {/* Sand animation */}
        {colored && (
            <motion.g>
                {/* Top sand - draining */}
                <motion.path
                    d="M20 16 L44 16 L32 30 Z"
                    fill="#fcd34d"
                    animate={{
                        d: [
                            "M20 16 L44 16 L32 30 Z",
                            "M24 24 L40 24 L32 30 Z",
                            "M32 30 L32 30 L32 30 Z",
                            "M20 16 L44 16 L32 30 Z"
                        ],
                        transition: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                />

                {/* Falling stream */}
                <motion.line
                    x1="32"
                    y1="30"
                    x2="32"
                    y2="52"
                    stroke="#fcd34d"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    animate={{
                        strokeDashoffset: [0, -10],
                        transition: {
                            duration: 0.5,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                />

                {/* Bottom sand - filling */}
                <motion.path
                    d="M28 48 L36 48 L32 52 Z"
                    fill="#fcd34d"
                    animate={{
                        d: [
                            "M32 52 L32 52 L32 52 Z",
                            "M22 42 L42 42 L32 52 Z",
                            "M16 52 L48 52 L32 32 Z",
                            "M32 52 L32 52 L32 52 Z"
                        ],
                        transition: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                />
            </motion.g>
        )}

        {/* Shine on glass */}
        <motion.path
            d="M20 16 L22 16 M26 36 L28 36"
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeLinecap="round"
        />

        {colored && (
            <defs>
                <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>
            </defs>
        )}
    </motion.svg>
);

// Helper function to get icon by name
export const getIconForHighlight = (name: string): React.ComponentType<AnimatedIconProps> => {
    const normalized = name.toLowerCase();

    if (normalized.includes('wifi') || normalized.includes('internet')) return WifiIcon;
    if (normalized.includes('coffee') || normalized.includes('tea') || normalized.includes('breakfast')) return CoffeeIcon;
    if (normalized.includes('drink') || normalized.includes('cocktail') || normalized.includes('bar') || normalized.includes('welcome')) return CocktailIcon;
    if (normalized.includes('pool') || normalized.includes('swim')) return PoolIcon;
    if (normalized.includes('gym') || normalized.includes('fitness') || normalized.includes('train')) return DumbbellIcon;
    if (normalized.includes('upgrade') || normalized.includes('room')) return UpgradeIcon;
    if (normalized.includes('late') || normalized.includes('early') || normalized.includes('check')) return HourglassIcon;
    if (normalized.includes('dining') || normalized.includes('food') || normalized.includes('restaurant')) return Utensils;
    if (normalized.includes('transport') || normalized.includes('transfer') || normalized.includes('car')) return Car;
    if (normalized.includes('family') || normalized.includes('kid')) return Users;
    if (normalized.includes('business') || normalized.includes('meeting')) return Briefcase;
    if (normalized.includes('spa') || normalized.includes('massage')) return CocktailIcon; // Using cocktail as spa fallback for now, or could map to another
    if (normalized.includes('photo')) return Camera;
    if (normalized.includes('wine')) return Wine;
    if (normalized.includes('ticket') || normalized.includes('park')) return Ticket;
    if (normalized.includes('music')) return Music;
    if (normalized.includes('tv')) return Tv;
    if (normalized.includes('phone')) return Smartphone;
    if (normalized.includes('credit') || normalized.includes('card')) return CreditCard;
    if (normalized.includes('parking')) return Car;

    return Gift; // Default fallback
};
