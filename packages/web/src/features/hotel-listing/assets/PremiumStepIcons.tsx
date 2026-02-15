import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface IconProps {
  size?: number
  isActive?: boolean
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return isDark
}

// Color helper function - returns lighter colors for dark mode
const getStrokeColor = (isDark: boolean, type: 'primary' | 'secondary' = 'primary') => {
  if (type === 'primary') {
    return isDark ? '#E5E5E5' : '#666666' // Much lighter in dark mode
  }
  return isDark ? '#B8B8B8' : '#888888' // Lighter secondary color in dark mode
}

const getFillColor = (isDark: boolean) => {
  return isDark ? '#D1D1D1' : '#666666'
}

// Property types that will cycle
const PROPERTY_TYPES = [
  { name: 'Hotel', floors: 5 },
  { name: 'Inn', floors: 3 },
  { name: 'Resort', floors: 4 },
  { name: 'Motel', floors: 2 },
  { name: 'Lodge', floors: 3 },
  { name: 'Boutique', floors: 4 },
  { name: 'Hostel', floors: 3 },
  { name: 'Guesthouse', floors: 2 },
]

export const PremiumPropertyTypeIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isDark = useDarkMode()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROPERTY_TYPES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const currentType = PROPERTY_TYPES[currentIndex]
  const floors = currentType.floors

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse
        cx="60"
        cy="105"
        rx="35"
        ry="8"
        fill={isDark ? '#FFFFFF' : '#000000'}
        opacity="0.08"
      />

      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Building - Outline only */}
          <rect
            x="25"
            y={100 - floors * 12}
            width="70"
            height={floors * 12}
            rx="4"
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')}
            strokeWidth="2"
          />

          {/* Windows - Grid Pattern */}
          {Array.from({ length: floors }).map((_, floor) =>
            [0, 1, 2, 3].map((col) => (
              <motion.rect
                key={`${floor}-${col}`}
                x={32 + col * 14}
                y={95 - floor * 12}
                width="8"
                height="6"
                rx="1"
                fill="none"
                stroke={getStrokeColor(isDark, 'secondary')}
                strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 1] }}
                transition={{
                  duration: 2,
                  delay: floor * 0.2 + col * 0.1,
                }}
              />
            )),
          )}

          {/* Entrance Door - Outline */}
          <rect
            x="52"
            y="88"
            width="16"
            height="12"
            rx="2"
            fill="none"
            stroke={getStrokeColor(isDark, 'primary')}
            strokeWidth="2"
          />

          {/* Property Type Label */}
          <motion.text
            x="60"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentType.name}
          </motion.text>
        </motion.g>
      </AnimatePresence>

      {/* Floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + i * 20}
          cy={35}
          r="1.5"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            y: [0, -12, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
          }}
        />
      ))}
    </motion.svg>
  )
}

export const PremiumLocationIcon = ({ size = 80, isActive = false }: IconProps) => {
  const isDark = useDarkMode()

  // Pin positions on the globe (angle, delay)
  const pinPositions = [
    { x: 45, y: 48, delay: 0 },
    { x: 35, y: 56, delay: 0.8 },
    { x: 52, y: 60, delay: 1.6 },
    { x: 42, y: 64, delay: 2.4 },
  ]

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse
        cx="60"
        cy="105"
        rx="30"
        ry="7"
        fill={isDark ? '#FFFFFF' : '#000000'}
        opacity="0.08"
      />

      {/* Main Globe Circle - Outline */}
      <motion.circle
        cx="45"
        cy="56"
        r="20"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Rotating Globe with Longitude and Latitude Lines */}
      <motion.g
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '45px', originY: '56px' }}
      >
        {/* LONGITUDE LINES (Vertical lines) */}

        {/* Center Meridian - Straight vertical line */}
        <line
          x1="45"
          y1="36"
          x2="45"
          y2="76"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1.5"
        />

        {/* Left Longitude Lines - Curved */}
        <path
          d="M 35 36 Q 32 56 35 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />

        <path
          d="M 28 40 Q 25 56 28 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Right Longitude Lines - Curved */}
        <path
          d="M 55 36 Q 58 56 55 76"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.7"
        />

        <path
          d="M 62 40 Q 65 56 62 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* LATITUDE LINES (Horizontal lines) */}

        {/* Equator - Bold center line */}
        <line
          x1="25"
          y1="56"
          x2="65"
          y2="56"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1.5"
        />

        {/* Northern Latitude - Curved horizontal */}
        <path
          d="M 28 46 Q 45 45 62 46"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />

        <path
          d="M 32 40 Q 45 39 58 40"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Southern Latitude - Curved horizontal */}
        <path
          d="M 28 66 Q 45 67 62 66"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.6"
        />

        <path
          d="M 32 72 Q 45 73 58 72"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>

      {/* Map Pins Dropping onto Globe */}
      {pinPositions.map((pin, i) => (
        <motion.g
          key={i}
          animate={{
            y: [0, 0, 0],
            opacity: [0, 1, 1],
          }}
          transition={{
            duration: 3.2,
            delay: pin.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          {/* Pin Drop Animation */}
          <motion.g
            animate={{
              y: [-30, 0],
              scale: [0.3, 1],
            }}
            transition={{
              duration: 0.6,
              delay: pin.delay,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: 'easeOut',
            }}
          >
            {/* Pin Shape - Outline */}
            <path
              d={`M${pin.x} ${pin.y - 8} C${pin.x - 3} ${pin.y - 8} ${pin.x - 4} ${pin.y - 5} ${pin.x - 4} ${pin.y - 3} C${pin.x - 4} ${pin.y} ${pin.x} ${pin.y + 4} ${pin.x} ${pin.y + 4} C${pin.x} ${pin.y + 4} ${pin.x + 4} ${pin.y} ${pin.x + 4} ${pin.y - 3} C${pin.x + 4} ${pin.y - 5} ${pin.x + 3} ${pin.y - 8} ${pin.x} ${pin.y - 8}Z`}
              fill="none"
              stroke={getStrokeColor(isDark, 'primary')}
              strokeWidth="1.5"
            />

            {/* Pin Center Dot */}
            <circle cx={pin.x} cy={pin.y - 3} r="1.5" fill={getFillColor(isDark)} />
          </motion.g>

          {/* Impact Ripple when pin lands */}
          <motion.circle
            cx={pin.x}
            cy={pin.y + 4}
            r="3"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="1"
            fill="none"
            animate={{
              scale: [0, 2.5, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 0.8,
              delay: pin.delay + 0.6,
              repeat: Infinity,
              repeatDelay: 2.6,
              ease: 'easeOut',
            }}
          />
        </motion.g>
      ))}

      {/* Pulsing Global Signal Rings */}
      {[...Array(2)].map((_, i) => (
        <motion.circle
          key={i}
          cx="45"
          cy="56"
          r="20"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1.5"
          fill="none"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            delay: i * 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Orbiting Satellite/Marker */}
      <motion.circle
        cx="65"
        cy="56"
        r="2"
        fill={getStrokeColor(isDark, 'secondary')}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ originX: '45px', originY: '56px' }}
      />

      {/* Compass - Bottom Right */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {/* Compass Circle */}
        <circle
          cx="72"
          cy="70"
          r="10"
          fill="none"
          stroke={getStrokeColor(isDark, 'primary')}
          strokeWidth="1.5"
        />

        {/* Inner compass ring */}
        <circle
          cx="72"
          cy="70"
          r="7"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="0.8"
          strokeDasharray="1 2"
        />

        {/* Compass Needle - Rotating */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '72px', originY: '70px' }}
        >
          {/* North Pointer - Red/Dark tip */}
          <path
            d="M 72 63 L 74 70 L 72 68 L 70 70 Z"
            fill={getFillColor(isDark)}
            stroke={getFillColor(isDark)}
            strokeWidth="0.5"
          />

          {/* South Pointer - Lighter */}
          <path
            d="M 72 77 L 74 70 L 72 72 L 70 70 Z"
            fill="none"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="0.8"
          />
        </motion.g>

        {/* Cardinal Direction Marks */}
        <text
          x="72"
          y="61"
          fontSize="5"
          fontWeight="600"
          fill={getFillColor(isDark)}
          textAnchor="middle"
        >
          N
        </text>
      </motion.g>
    </motion.svg>
  )
}

// Amenities that will cycle
const AMENITIES = [
  { icon: 'wifi', label: 'WiFi' },
  { icon: 'pool', label: 'Pool' },
  { icon: 'gym', label: 'Gym' },
  { icon: 'spa', label: 'Spa' },
  { icon: 'restaurant', label: 'Restaurant' },
  { icon: 'parking', label: 'Parking' },
  { icon: 'ac', label: 'AC' },
  { icon: 'laundry', label: 'Laundry' },
]

export const PremiumAmenitiesIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isDark = useDarkMode()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AMENITIES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const renderAmenityIcon = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary')
    const secondary = getStrokeColor(isDark, 'secondary')
    const fill = getFillColor(isDark)

    switch (type) {
      case 'wifi':
        return (
          <motion.g>
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M${35 - i * 3} ${50 + i * 4} Q40 ${45 + i * 2} ${45 + i * 3} ${50 + i * 4}`}
                stroke={primary}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              />
            ))}
            <circle cx="40" cy="56" r="2" fill={fill} />
          </motion.g>
        )
      case 'pool':
        return (
          <motion.g>
            <rect
              x="25"
              y="48"
              width="30"
              height="16"
              rx="3"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${28 + i * 8} ${56} Q${30 + i * 8} ${54} ${32 + i * 8} ${56}`}
                stroke={secondary}
                strokeWidth="1.5"
                fill="none"
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </motion.g>
        )
      case 'gym':
        return (
          <motion.g>
            <rect
              x="30"
              y="52"
              width="20"
              height="3"
              rx="1.5"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <circle cx="30" cy="53.5" r="4" fill="none" stroke={primary} strokeWidth="2" />
            <circle cx="50" cy="53.5" r="4" fill="none" stroke={primary} strokeWidth="2" />
          </motion.g>
        )
      case 'spa':
        return (
          <motion.g>
            <circle cx="40" cy="52" r="6" fill="none" stroke={primary} strokeWidth="2" />
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${36 + i * 3} ${45} Q${36 + i * 3} ${42} ${36 + i * 3} ${40}`}
                stroke={secondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{ opacity: [0, 0.8, 0], y: [0, -4, -8] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        )
      case 'restaurant':
        return (
          <motion.g>
            <path d="M35 45 L35 62" stroke={primary} strokeWidth="2" strokeLinecap="round" />
            <path d="M32 45 L32 50" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M38 45 L38 50" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M42 45 Q42 50 42 55 L42 62" stroke={primary} strokeWidth="2" fill="none" />
            <circle cx="42" cy="52" r="3" fill="none" stroke={primary} strokeWidth="1.5" />
          </motion.g>
        )
      case 'parking':
        return (
          <motion.g>
            <rect
              x="28"
              y="45"
              width="24"
              height="18"
              rx="2"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <text x="40" y="58" fontSize="12" fontWeight="bold" fill={fill} textAnchor="middle">
              P
            </text>
          </motion.g>
        )
      case 'ac':
        return (
          <motion.g>
            <rect
              x="30"
              y="48"
              width="20"
              height="12"
              rx="2"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            {[...Array(3)].map((_, i) => (
              <motion.line
                key={i}
                x1={34 + i * 5}
                y1={62}
                x2={34 + i * 5}
                y2={68}
                stroke={secondary}
                strokeWidth="1.5"
                animate={{ y2: [68, 72, 68] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </motion.g>
        )
      case 'laundry':
        return (
          <motion.g>
            <rect
              x="30"
              y="46"
              width="20"
              height="18"
              rx="2"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <circle cx="40" cy="55" r="5" fill="none" stroke={secondary} strokeWidth="1.5" />
            <motion.circle
              cx="40"
              cy="55"
              r="3"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.g>
        )
      default:
        return null
    }
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse
        cx="60"
        cy="105"
        rx="30"
        ry="7"
        fill={isDark ? '#FFFFFF' : '#000000'}
        opacity="0.08"
      />

      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Container circle */}
          <circle
            cx="40"
            cy="56"
            r="22"
            fill="none"
            stroke={getStrokeColor(isDark, 'secondary')}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Amenity icon */}
          {renderAmenityIcon(AMENITIES[currentIndex].icon)}

          {/* Label */}
          <motion.text
            x="40"
            y="25"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {AMENITIES[currentIndex].label}
          </motion.text>
        </motion.g>
      </AnimatePresence>

      {/* Orbiting dots */}
      {[...Array(3)].map((_, i) => (
        <motion.circle
          key={i}
          cx="40"
          cy="34"
          r="2"
          fill={getStrokeColor(isDark, 'secondary')}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, delay: i * 0.3, repeat: Infinity },
          }}
          style={{ originX: '40px', originY: '56px' }}
        />
      ))}
    </motion.svg>
  )
}

// Photo sections that will cycle
const PHOTO_SECTIONS = [
  { name: 'Lobby', icon: 'lobby' },
  { name: 'Room', icon: 'room' },
  { name: 'Reception', icon: 'reception' },
  { name: 'Restaurant', icon: 'restaurant' },
  { name: 'Pool', icon: 'pool' },
  { name: 'Exterior', icon: 'exterior' },
]

export const PremiumPhotosIcon = ({ size = 80, isActive = false }: IconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isDark = useDarkMode()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHOTO_SECTIONS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const renderPhotoSection = (type: string) => {
    const primary = getStrokeColor(isDark, 'primary')
    const secondary = getStrokeColor(isDark, 'secondary')

    switch (type) {
      case 'lobby':
        return (
          <motion.g>
            {/* Chandelier */}
            <circle cx="45" cy="50" r="4" fill="none" stroke={primary} strokeWidth="1.5" />
            <line x1="45" y1="46" x2="45" y2="42" stroke={primary} strokeWidth="1.5" />
            {/* Furniture */}
            <rect
              x="38"
              y="58"
              width="6"
              height="8"
              rx="1"
              fill="none"
              stroke={secondary}
              strokeWidth="1.5"
            />
            <rect
              x="48"
              y="58"
              width="6"
              height="8"
              rx="1"
              fill="none"
              stroke={secondary}
              strokeWidth="1.5"
            />
          </motion.g>
        )
      case 'room':
        return (
          <motion.g>
            {/* Bed */}
            <rect
              x="38"
              y="54"
              width="16"
              height="10"
              rx="1"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <rect
              x="38"
              y="50"
              width="16"
              height="4"
              rx="1"
              fill="none"
              stroke={secondary}
              strokeWidth="1.5"
            />
            {/* Pillow */}
            <rect
              x="40"
              y="52"
              width="5"
              height="3"
              rx="0.5"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
          </motion.g>
        )
      case 'reception':
        return (
          <motion.g>
            {/* Desk */}
            <rect
              x="36"
              y="56"
              width="18"
              height="8"
              rx="1"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <line x1="38" y="56" x2="38" y2="64" stroke={secondary} strokeWidth="1.5" />
            <line x1="52" y="56" x2="52" y2="64" stroke={secondary} strokeWidth="1.5" />
            {/* Person */}
            <circle cx="46" cy="48" r="3" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        )
      case 'restaurant':
        return (
          <motion.g>
            {/* Table */}
            <circle cx="45" cy="58" r="8" fill="none" stroke={primary} strokeWidth="2" />
            {/* Plates */}
            <circle cx="42" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
            <circle cx="48" cy="56" r="2.5" fill="none" stroke={secondary} strokeWidth="1.5" />
          </motion.g>
        )
      case 'pool':
        return (
          <motion.g>
            {/* Pool */}
            <rect
              x="36"
              y="52"
              width="18"
              height="12"
              rx="2"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            {/* Water waves */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M${38 + i * 5} ${58} Q${40 + i * 5} ${56} ${42 + i * 5} ${58}`}
                stroke={secondary}
                strokeWidth="1"
                fill="none"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.g>
        )
      case 'exterior':
        return (
          <motion.g>
            {/* Building outline */}
            <rect
              x="38"
              y="48"
              width="14"
              height="16"
              rx="1"
              fill="none"
              stroke={primary}
              strokeWidth="2"
            />
            <rect
              x="40"
              y="52"
              width="3"
              height="3"
              rx="0.5"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
            <rect
              x="45"
              y="52"
              width="3"
              height="3"
              rx="0.5"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
            <rect
              x="40"
              y="57"
              width="3"
              height="3"
              rx="0.5"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
            <rect
              x="45"
              y="57"
              width="3"
              height="3"
              rx="0.5"
              fill="none"
              stroke={secondary}
              strokeWidth="1"
            />
          </motion.g>
        )
      default:
        return null
    }
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse
        cx="60"
        cy="105"
        rx="35"
        ry="8"
        fill={isDark ? '#FFFFFF' : '#000000'}
        opacity="0.08"
      />

      {/* Camera frame - Outline */}
      <rect
        x="20"
        y="35"
        width="80"
        height="55"
        rx="6"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2"
      />

      {/* Lens ring */}
      <circle
        cx="60"
        cy="62"
        r="18"
        fill="none"
        stroke={getStrokeColor(isDark, 'secondary')}
        strokeWidth="1.5"
      />

      {/* Flash */}
      <rect
        x="80"
        y="42"
        width="12"
        height="8"
        rx="2"
        fill="none"
        stroke={getStrokeColor(isDark, 'secondary')}
        strokeWidth="1.5"
      />

      {/* Shutter button */}
      <rect
        x="30"
        y="28"
        width="14"
        height="7"
        rx="2"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2"
      />

      <AnimatePresence mode="wait">
        <motion.g
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          {/* Inner lens content */}
          <g transform="translate(15, 12)">
            {renderPhotoSection(PHOTO_SECTIONS[currentIndex].icon)}
          </g>

          {/* Label */}
          <motion.text
            x="60"
            y="110"
            fontSize="11"
            fontWeight="600"
            fill={getFillColor(isDark)}
            textAnchor="middle"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {PHOTO_SECTIONS[currentIndex].name}
          </motion.text>
        </motion.g>
      </AnimatePresence>

      {/* Floating photos */}
      {[...Array(3)].map((_, i) => (
        <motion.rect
          key={i}
          x={85 + i * 5}
          y={20 + i * 15}
          width="12"
          height="10"
          rx="1"
          fill="none"
          stroke={getStrokeColor(isDark, 'secondary')}
          strokeWidth="1"
          animate={{
            y: [0, -5, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
          }}
        />
      ))}
    </motion.svg>
  )
}

export const PremiumPricingIcon = ({ size = 80, isActive = false }: IconProps) => {
  const isDark = useDarkMode()

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse
        cx="60"
        cy="105"
        rx="35"
        ry="8"
        fill={isDark ? '#FFFFFF' : '#000000'}
        opacity="0.08"
      />

      {/* Stack of Coins/Cards */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: i * 0.2,
            type: 'spring',
            stiffness: 100,
          }}
        >
          {/* Card Shape */}
          <rect
            x={30 + i * 2}
            y={60 - i * 15}
            width="60"
            height="35"
            rx="4"
            fill={isDark ? '#1F2937' : '#FFFFFF'}
            stroke={getStrokeColor(isDark, 'primary')}
            strokeWidth="2"
          />

          {/* Dollar Sign */}
          {i === 2 && (
            <motion.text
              x="60"
              y="55"
              fontSize="24"
              fontWeight="bold"
              fill={getFillColor(isDark)}
              textAnchor="middle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
            >
              $
            </motion.text>
          )}

          {/* Decorative Lines */}
          {i !== 2 && (
            <line
              x1={35 + i * 2}
              y1={70 - i * 15}
              x2={85 + i * 2}
              y2={70 - i * 15}
              stroke={getStrokeColor(isDark, 'secondary')}
              strokeWidth="1"
            />
          )}
        </motion.g>
      ))}

      {/* Growth Arrow (Chart) */}
      <motion.path
        d="M 20 90 L 40 70 L 60 80 L 100 40"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 1 }}
      />

      {/* Arrow Head */}
      <motion.path
        d="M 90 40 L 100 40 L 100 50"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 2.5 }}
      />

      {/* Percentage Symbol floating */}
      <motion.text
        x="90"
        y="30"
        fontSize="16"
        fontWeight="bold"
        fill={getFillColor(isDark)}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: [0, -5, 0],
        }}
        transition={{
          opacity: { delay: 2.8, duration: 0.5 },
          y: { delay: 2.8, duration: 2, repeat: Infinity },
        }}
      >
        %
      </motion.text>

      {/* Coin rolling in */}
      <motion.circle
        cx="10"
        cy="95"
        r="8"
        fill="none"
        stroke={getStrokeColor(isDark, 'primary')}
        strokeWidth="2"
        initial={{ x: -20, rotate: -180, opacity: 0 }}
        animate={{ x: 10, rotate: 0, opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
      />
      <motion.text
        x="20"
        y="99"
        fontSize="10"
        fontWeight="bold"
        fill={getFillColor(isDark)}
        textAnchor="middle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
      >
        $
      </motion.text>
    </motion.svg>
  )
}
