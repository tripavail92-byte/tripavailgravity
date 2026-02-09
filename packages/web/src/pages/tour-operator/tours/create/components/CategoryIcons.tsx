import { motion } from 'motion/react';

const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, dropShadow: '0px 10px 20px rgba(0,0,0,0.1)' },
};

export const AdventureIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center relative"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Mountains */}
            <motion.path
                d="M20 80 L50 20 L80 80 Z"
                fill="#E2E8F0"
                stroke="#475569"
                strokeWidth="2"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Snow cap */}
            <path d="M40 40 L50 20 L60 40 Q50 35 40 40" fill="white" />
            {/* Sun/Cloud element */}
            <motion.circle
                cx="75" cy="25" r="8"
                fill="#FDE68A"
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
        </svg>
    </motion.div>
);

export const CulturalIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Temple Base */}
            <rect x="15" y="75" width="70" height="10" rx="2" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
            {/* Columns */}
            {[25, 40, 55, 70].map((x, i) => (
                <motion.rect
                    key={i}
                    x={x} y="40" width="6" height="35"
                    fill="#F8FAFC"
                    stroke="#475569"
                    strokeWidth="1.5"
                    animate={{ height: [35, 37, 35] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                />
            ))}
            {/* Roof */}
            <path d="M10 40 L50 15 L90 40 Z" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
        </svg>
    </motion.div>
);

export const NatureIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center text-green-600"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.path
                d="M50 85 V30"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
            {[
                { d: "M50 60 Q70 50 85 60", rotate: [0, 5, 0] },
                { d: "M50 45 Q30 35 15 45", rotate: [0, -5, 0] },
                { d: "M50 30 Q70 15 80 25", rotate: [0, 3, 0] }
            ].map((leaf, i) => (
                <motion.path
                    key={i}
                    d={leaf.d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{ rotate: leaf.rotate }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                />
            ))}
        </svg>
    </motion.div>
);

export const CityIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="20" y="40" width="20" height="45" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
            <rect x="45" y="20" width="25" height="65" fill="#F1F5F9" stroke="#475569" strokeWidth="2" />
            <rect x="75" y="50" width="15" height="35" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
            {/* Windows flicking */}
            {[50, 60, 30, 40, 70].map((y, i) => (
                <motion.rect
                    key={i}
                    x={50 + (i % 2) * 10} y={y} width="4" height="4"
                    fill="#FDE68A"
                    animate={{ opacity: [0, 1, 0.5, 1, 0] }}
                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                />
            ))}
        </svg>
    </motion.div>
);

export const FoodIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center p-1"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20 50 Q50 90 80 50 L85 45 Q50 35 15 45 Z" fill="#FCA5A5" stroke="#475569" strokeWidth="2" />
            {/* Steam */}
            {[40, 50, 60].map((x, i) => (
                <motion.path
                    key={i}
                    d={`M${x} 35 Q${x + 5} 25 ${x} 15`}
                    fill="none"
                    stroke="#D1D5DB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{ y: [0, -10], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
                />
            ))}
        </svg>
    </motion.div>
);

export const BeachIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Sun */}
            <circle cx="70" cy="30" r="15" fill="#FCD34D" />
            {/* Waves */}
            <motion.path
                d="M10 70 Q30 60 50 70 Q70 80 90 70 V90 H10 Z"
                fill="#93C5FD"
                stroke="#1D4ED8"
                strokeWidth="2"
                animate={{
                    d: [
                        "M10 70 Q30 60 50 70 Q70 80 90 70 V90 H10 Z",
                        "M10 75 Q30 85 50 75 Q70 65 90 75 V90 H10 Z",
                        "M10 70 Q30 60 50 70 Q70 80 90 70 V90 H10 Z"
                    ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
    </motion.div>
);

export const HistoricalIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20 80 V40 L35 25 L50 40 V80 Z" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
            <path d="M50 80 V30 L65 15 L80 30 V80 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
            <motion.circle
                cx="50" cy="50" r="2"
                fill="white"
                animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </svg>
    </motion.div>
);

export const ReligiousIcon = () => (
    <motion.div
        className="w-12 h-12 flex items-center justify-center"
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M30 80 V40 Q50 10 70 40 V80 Z" fill="#F1F5F9" stroke="#475569" strokeWidth="2" />
            <motion.circle
                cx="50" cy="40" r="25"
                fill="url(#glowGradient)"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <defs>
                <radialGradient id="glowGradient">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>
        </svg>
    </motion.div>
);
