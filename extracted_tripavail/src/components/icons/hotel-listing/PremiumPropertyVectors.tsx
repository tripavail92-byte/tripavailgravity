import { motion } from 'motion/react';

interface PremiumPropertyVectorProps {
  propertyType: 'hotel' | 'boutique' | 'resort' | 'motel' | 'lodge' | 'inn' | 'guesthouse' | 'hostel' | '';
  size?: number;
}

export function PremiumPropertyVector({ propertyType, size = 120 }: PremiumPropertyVectorProps) {
  // Use the propertyType to determine which icon to show
  // Default shows hotel icon, then switch to specific types
  const type = propertyType || 'hotel';
  
  // Default premium 3D hotel icon (shown when no type or when type is 'hotel')
  if (!propertyType || propertyType === 'hotel') {
    return (
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}
      >
        <defs>
          {/* Main Building Gradient */}
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9D4EDD" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          
          {/* Roof Gradient */}
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          
          {/* Window Glow */}
          <radialGradient id="windowGlow">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          
          {/* Shadow */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow base */}
        <motion.ellipse
          cx="60"
          cy="105"
          rx="35"
          ry="4"
          fill="#000000"
          opacity="0.15"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />

        {/* Main Building */}
        <motion.rect
          x="30"
          y="35"
          width="60"
          height="65"
          fill="url(#buildingGrad)"
          rx="4"
          filter="url(#shadow)"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        
        {/* Building Left Side (3D effect) */}
        <motion.path
          d="M 30 35 L 25 40 L 25 105 L 30 100 Z"
          fill="#7C3AED"
          opacity="0.6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* Roof */}
        <motion.path
          d="M 20 35 L 60 15 L 100 35 L 90 35 L 60 20 L 30 35 Z"
          fill="url(#roofGrad)"
          filter="url(#shadow)"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
        />

        {/* Windows Grid - 4x5 */}
        {[...Array(20)].map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isLit = i % 3 !== 0; // Some windows lit, some dark
          
          return (
            <motion.rect
              key={i}
              x={38 + col * 12}
              y={42 + row * 11}
              width="8"
              height="8"
              fill={isLit ? "url(#windowGlow)" : "#4C1D95"}
              rx="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: isLit ? [0.8, 1, 0.8] : 1
              }}
              transition={{
                scale: { delay: 0.5 + i * 0.03, duration: 0.3 },
                opacity: isLit ? { 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.1 
                } : {}
              }}
            />
          );
        })}

        {/* Main Entrance */}
        <motion.rect
          x="48"
          y="85"
          width="24"
          height="15"
          fill="#1F2937"
          rx="2"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        />
        
        {/* Door detail */}
        <motion.rect
          x="52"
          y="88"
          width="7"
          height="12"
          fill="#374151"
          rx="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        />
        <motion.rect
          x="61"
          y="88"
          width="7"
          height="12"
          fill="#374151"
          rx="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        />
        
        {/* Door handles */}
        <motion.circle cx="58" cy="94" r="1" fill="#FCD34D" />
        <motion.circle cx="62" cy="94" r="1" fill="#FCD34D" />

        {/* Hotel Sign */}
        <motion.rect
          x="42"
          y="22"
          width="36"
          height="10"
          fill="#1F2937"
          rx="2"
          filter="url(#shadow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.4, type: 'spring' }}
        />
        <motion.text
          x="60"
          y="29"
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="url(#windowGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ 
            opacity: { duration: 2, repeat: Infinity },
            delay: 1.2 
          }}
        >
          HOTEL
        </motion.text>

        {/* Star decorations */}
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            cx={48 + i * 12}
            cy={12}
            r="1.5"
            fill="#FCD34D"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1], 
              opacity: [0, 1, 0.8],
              rotate: 360 
            }}
            transition={{ 
              delay: 1.3 + i * 0.1, 
              duration: 0.6,
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
            }}
          />
        ))}
      </motion.svg>
    );
  }

  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 120 120',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  switch (propertyType) {
    case 'hotel':
      return (
        <motion.svg
          {...iconProps}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}
        >
          <defs>
            <linearGradient id="hotelBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9D4EDD" />
              <stop offset="100%" stopColor="#5B21B6" />
            </linearGradient>
            <linearGradient id="hotelRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <radialGradient id="hotelWindow">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="35" ry="4" fill="#000000" opacity="0.15" />
          
          <motion.rect x="30" y="35" width="60" height="65" fill="url(#hotelBldg)" rx="4"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6 }} />
          
          <motion.path d="M 30 35 L 25 40 L 25 105 L 30 100 Z" fill="#7C3AED" opacity="0.6"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.2 }} />

          <motion.path d="M 20 35 L 60 15 L 100 35 L 90 35 L 60 20 L 30 35 Z" fill="url(#hotelRoof)"
            initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: 'spring' }} />

          {[...Array(20)].map((_, i) => (
            <motion.rect key={i} x={38 + (i % 4) * 12} y={42 + Math.floor(i / 4) * 11} width="8" height="8"
              fill={i % 3 !== 0 ? "url(#hotelWindow)" : "#4C1D95"} rx="1"
              initial={{ scale: 0 }} animate={{ scale: 1, opacity: i % 3 !== 0 ? [0.8, 1, 0.8] : 1 }}
              transition={{ scale: { delay: 0.4 + i * 0.03 }, opacity: { duration: 2, repeat: Infinity, delay: i * 0.1 } }} />
          ))}

          <motion.rect x="48" y="85" width="24" height="15" fill="#1F2937" rx="2"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6 }} />
          
          <rect x="52" y="88" width="7" height="12" fill="#374151" rx="1" />
          <rect x="61" y="88" width="7" height="12" fill="#374151" rx="1" />
          <circle cx="58" cy="94" r="1" fill="#FCD34D" />
          <circle cx="62" cy="94" r="1" fill="#FCD34D" />

          <motion.rect x="42" y="22" width="36" height="10" fill="#1F2937" rx="2"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} />
          <motion.text x="60" y="29" textAnchor="middle" fontSize="7" fontWeight="bold" fill="url(#hotelWindow)"
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
            HOTEL
          </motion.text>
        </motion.svg>
      );

    case 'resort':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="resortBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="pool" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id="palm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="40" ry="4" fill="#000000" opacity="0.2" />

          <motion.rect x="20" y="55" width="80" height="45" fill="url(#resortBldg)" rx="4"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6 }} />
          
          <motion.ellipse cx="60" cy="38" rx="28" ry="10" fill="url(#pool)"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
          
          <motion.path d="M 40 38 Q 50 36 60 38 Q 70 40 80 38" stroke="#0EA5E9" strokeWidth="2" fill="none"
            animate={{ pathOffset: [0, 1] }} transition={{ duration: 2, repeat: Infinity }} />

          {[...Array(8)].map((_, i) => (
            <motion.rect key={i} x={26 + (i % 4) * 16} y={62 + Math.floor(i / 4) * 14} width="10" height="10"
              fill="#FEF3C7" rx="1" initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }} />
          ))}

          {/* Palm trees */}
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
            <rect x="25" y="75" width="6" height="25" fill="#92400E" rx="1" />
            <motion.path d="M 28 75 Q 18 65 20 60 M 28 75 Q 23 63 26 58 M 28 75 Q 33 63 30 58 M 28 75 Q 38 65 36 60"
              stroke="url(#palm)" strokeWidth="3" strokeLinecap="round" fill="none"
              animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ transformOrigin: '28px 75px' }} />
            
            <rect x="89" y="78" width="6" height="20" fill="#92400E" rx="1" />
            <motion.path d="M 92 78 Q 82 70 84 66 M 92 78 Q 87 68 90 64 M 92 78 Q 97 68 94 64 M 92 78 Q 102 70 100 66"
              stroke="url(#palm)" strokeWidth="3" strokeLinecap="round" fill="none"
              animate={{ rotate: [3, -3, 3] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ transformOrigin: '92px 78px' }} />
          </motion.g>

          <motion.circle cx="90" cy="25" r="10" fill="#FCD34D"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, duration: 0.4 }} />
          <motion.path d="M 90 18 L 92 22 L 96 22 L 93 25 L 94 29 L 90 26 L 86 29 L 87 25 L 84 22 L 88 22 Z"
            fill="#F59E0B" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '90px 23px' }} />
        </motion.svg>
      );

    case 'boutique':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="boutiqueBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#BE185D" />
            </linearGradient>
            <linearGradient id="boutiqueAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="32" ry="4" fill="#000000" opacity="0.15" />

          <motion.path d="M 35 100 L 35 40 Q 35 28 45 28 L 75 28 Q 85 28 85 40 L 85 100 Z" fill="url(#boutiqueBldg)"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7 }} />

          <motion.rect x="40" y="55" width="40" height="4" fill="url(#boutiqueAccent)"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
          
          {[...Array(7)].map((_, i) => (
            <motion.line key={i} x1={42 + i * 6} y1={59} x2={42 + i * 6} y2={70} stroke="#F9A8D4" strokeWidth="2"
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 + i * 0.05 }} />
          ))}

          <motion.circle cx="50" cy="42" r="6" stroke="#FCD34D" strokeWidth="3" fill="none"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} />
          <motion.circle cx="70" cy="42" r="6" stroke="#FCD34D" strokeWidth="3" fill="none"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />

          <motion.path d="M 50 78 Q 60 70 70 78 L 70 100 L 50 100 Z" fill="#1F2937"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8, duration: 0.5 }} />

          <motion.path d="M 38 28 L 43 18 L 50 23 L 57 15 L 60 23 L 63 15 L 70 23 L 77 18 L 82 28"
            stroke="url(#boutiqueAccent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />

          {[...Array(3)].map((_, i) => (
            <motion.rect key={i} x={42 + i * 14} y={82} width="10" height="3" fill="url(#boutiqueAccent)" opacity="0.6"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1 + i * 0.1 }} />
          ))}
        </motion.svg>
      );

    case 'motel':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="motelBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="45" ry="4" fill="#000000" opacity="0.15" />

          <motion.rect x="15" y="60" width="90" height="40" fill="url(#motelBldg)" rx="3"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7 }} />

          {[...Array(5)].map((_, i) => (
            <motion.g key={i}>
              <motion.rect x={18 + i * 17} y={68} width="12" height="32" fill="#1F2937" rx="1"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.1 }} />
              <motion.text x={24 + i * 17} y={78} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FCD34D"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
                {i + 1}
              </motion.text>
            </motion.g>
          ))}

          <motion.line x1="15" y1="103" x2="105" y2="103" stroke="#FCD34D" strokeWidth="3" strokeDasharray="10 5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />

          <motion.rect x="40" y="30" width="40" height="22" fill="#1F2937" rx="3"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />
          <motion.text x="60" y="44" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FCD34D"
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
            MOTEL
          </motion.text>
          
          <motion.rect x="58" y="52" width="4" height="8" fill="#1F2937"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.9 }} />
        </motion.svg>
      );

    case 'lodge':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="lodgeWood" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="lodgeRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C2D12" />
              <stop offset="100%" stopColor="#6B1810" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="35" ry="4" fill="#000000" opacity="0.15" />

          <motion.path d="M 25 50 L 60 20 L 95 50 L 85 50 L 60 27 L 35 50 Z" fill="url(#lodgeRoof)"
            initial={{ y: -20 }} animate={{ y: 0 }} transition={{ duration: 0.6, type: 'spring' }} />

          <motion.rect x="35" y="50" width="50" height="55" fill="url(#lodgeWood)" rx="2"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2, duration: 0.6 }} />

          {[...Array(8)].map((_, i) => (
            <motion.line key={i} x1="32" y1={54 + i * 6.5} x2="88" y2={54 + i * 6.5} stroke="#A16207" strokeWidth="2"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4 + i * 0.06 }} />
          ))}

          <motion.rect x="53" y="78" width="14" height="27" fill="#422006" rx="1"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.7 }} />
          <motion.circle cx="63" cy="92" r="1.5" fill="#FCD34D" />

          <motion.rect x="42" y="58" width="11" height="11" fill="#422006" rx="1"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
          <motion.line x1="47.5" y1="58" x2="47.5" y2="69" stroke="#78350F" strokeWidth="1.5" />
          <motion.line x1="42" y1="63.5" x2="53" y2="63.5" stroke="#78350F" strokeWidth="1.5" />

          <motion.rect x="67" y="58" width="11" height="11" fill="#422006" rx="1"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.85 }} />
          <motion.line x1="72.5" y1="58" x2="72.5" y2="69" stroke="#78350F" strokeWidth="1.5" />
          <motion.line x1="67" y1="63.5" x2="78" y2="63.5" stroke="#78350F" strokeWidth="1.5" />

          <motion.rect x="72" y="28" width="6" height="22" fill="#422006"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 }} />
          
          <motion.path d="M 75 28 Q 72 22 74 18 M 76 26 Q 79 20 77 16" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" fill="none"
            animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
        </motion.svg>
      );

    case 'inn':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="innBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <radialGradient id="innWindow">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FCD34D" />
            </radialGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="32" ry="4" fill="#000000" opacity="0.15" />

          <motion.rect x="35" y="55" width="50" height="50" fill="url(#innBldg)" rx="4"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6 }} />

          <motion.path d="M 28 55 L 60 30 L 92 55 L 85 55 L 60 38 L 35 55 Z" fill="#7C2D12"
            initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: 'spring' }} />

          <motion.circle cx="50" cy="68" r="8" fill="url(#innWindow)"
            initial={{ scale: 0 }} animate={{ scale: 1, opacity: [0.8, 1, 0.8] }}
            transition={{ scale: { delay: 0.5, type: 'spring' }, opacity: { duration: 2, repeat: Infinity } }} />
          <motion.path d="M 50 60 L 50 76 M 42 68 L 58 68" stroke="#B91C1C" strokeWidth="2" />

          <motion.circle cx="70" cy="68" r="8" fill="url(#innWindow)"
            initial={{ scale: 0 }} animate={{ scale: 1, opacity: [0.8, 1, 0.8] }}
            transition={{ scale: { delay: 0.6, type: 'spring' }, opacity: { duration: 2, repeat: Infinity, delay: 0.3 } }} />
          <motion.path d="M 70 60 L 70 76 M 62 68 L 78 68" stroke="#B91C1C" strokeWidth="2" />

          <motion.path d="M 53 88 Q 60 82 67 88 L 67 105 L 53 105 Z" fill="#1F2937" rx="2"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.7 }} />
          <motion.circle cx="64" cy="95" r="1.5" fill="#FCD34D" />

          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 }}>
            <rect x="40" y="100" width="7" height="5" fill="#78350F" rx="1" />
            <circle cx="43.5" cy="97" r="3" fill="#EF4444" />
            <circle cx="42" cy="96" r="1.5" fill="#FCA5A5" />
            
            <rect x="73" y="100" width="7" height="5" fill="#78350F" rx="1" />
            <circle cx="76.5" cy="97" r="3" fill="#F97316" />
            <circle cx="75" cy="96" r="1.5" fill="#FED7AA" />
          </motion.g>

          <motion.ellipse cx="60" cy="45" rx="20" ry="7" fill="#1F2937"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }} />
          <motion.text x="60" y="48" textAnchor="middle" fontSize="7" fontWeight="bold" fill="url(#innWindow)">
            THE INN
          </motion.text>
        </motion.svg>
      );

    case 'guesthouse':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="houseBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="houseRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="38" ry="4" fill="#000000" opacity="0.15" />

          <motion.path d="M 20 105 L 20 50 L 60 20 L 100 50 L 100 105 Z" fill="url(#houseBldg)"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7 }} />

          <motion.path d="M 15 50 L 60 15 L 105 50 L 100 50 L 60 20 L 20 50 Z" fill="url(#houseRoof)"
            initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: 'spring' }} />

          <motion.rect x="32" y="55" width="14" height="14" fill="#FEF3C7" rx="1"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
          <motion.path d="M 39 55 L 39 69 M 32 62 L 46 62" stroke="#1D4ED8" strokeWidth="2" />

          <motion.rect x="74" y="55" width="14" height="14" fill="#FEF3C7" rx="1"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
          <motion.path d="M 81 55 L 81 69 M 74 62 L 88 62" stroke="#1D4ED8" strokeWidth="2" />

          <motion.rect x="52" y="78" width="16" height="27" fill="#1F2937" rx="2"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.7 }} />
          <motion.rect x="55" y="82" width="10" height="8" fill="#374151" rx="1" />
          <motion.circle cx="64" cy="93" r="1.5" fill="#FCD34D" />

          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 }}>
            <circle cx="28" cy="103" r="6" fill="#10B981" opacity="0.6" />
            <circle cx="92" cy="103" r="6" fill="#10B981" opacity="0.6" />
            <circle cx="25" cy="99" r="4" fill="#059669" />
            <circle cx="95" cy="99" r="4" fill="#059669" />
          </motion.g>

          <motion.rect x="48" y="103" width="24" height="2" fill="#78350F"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1 }} />

          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }}>
            <rect x="106" y="75" width="8" height="6" fill="#DC2626" rx="2" />
            <line x1="110" y1="81" x2="110" y2="92" stroke="#374151" strokeWidth="2" />
          </motion.g>
        </motion.svg>
      );

    case 'hostel':
      return (
        <motion.svg {...iconProps} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 150 }}>
          <defs>
            <linearGradient id="hostelBldg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="105" rx="35" ry="4" fill="#000000" opacity="0.15" />

          <motion.rect x="30" y="30" width="60" height="75" fill="url(#hostelBldg)" rx="3"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7 }} />

          <motion.line x1="30" y1="60" x2="90" y2="60" stroke="#0F766E" strokeWidth="2.5"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 }} />

          {[...Array(9)].map((_, i) => (
            <motion.rect key={i} x={36 + (i % 3) * 16} y={36 + Math.floor(i / 3) * 20} width="9" height="14"
              fill="#FEF3C7" rx="1" initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }} />
          ))}

          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}>
            <path d="M 42 18 Q 40 15 40 22 Q 40 26 42 30 L 46 27 L 46 18 Z" fill="#F97316" />
            <circle cx="43" cy="22" r="2" fill="#1F2937" />
            <line x1="42" y1="30" x2="42" y2="35" stroke="#78350F" strokeWidth="2" />
            <line x1="46" y1="27" x2="46" y2="35" stroke="#78350F" strokeWidth="2" />
          </motion.g>

          <motion.g initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}>
            <circle cx="78" cy="20" r="11" fill="#10B981" />
            <text x="78" y="26" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">$</text>
          </motion.g>

          <motion.rect x="54" y="90" width="12" height="15" fill="#1F2937" rx="1"
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6 }} />

          <motion.g initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <circle cx="38" cy="108" r="2.5" fill="#F97316" />
            <line x1="38" y1="110.5" x2="38" y2="116" stroke="#F97316" strokeWidth="2" />
            
            <circle cx="82" cy="108" r="2.5" fill="#3B82F6" />
            <line x1="82" y1="110.5" x2="82" y2="116" stroke="#3B82F6" strokeWidth="2" />
          </motion.g>

          <motion.text x="60" y="25" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            HOSTEL
          </motion.text>
        </motion.svg>
      );

    default:
      return null;
  }
}
