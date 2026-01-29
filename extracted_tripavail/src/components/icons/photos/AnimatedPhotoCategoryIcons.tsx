import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IconProps {
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

// Exterior & Building Icon - Continuous Animation
export const ExteriorBuildingIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    {/* Building Base */}
    <motion.rect
      x="6"
      y="14"
      width="20"
      height="14"
      fill="#000000"
      initial={{ y: 32 }}
      animate={{ y: 14 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
    />
    
    {/* Roof */}
    <motion.path
      d="M4 16 L16 6 L28 16"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    />
    
    {/* Windows - Continuous twinkling */}
    {[
      { x: 9, y: 17 },
      { x: 15, y: 17 },
      { x: 21, y: 17 },
      { x: 9, y: 22 },
      { x: 15, y: 22 },
      { x: 21, y: 22 }
    ].map((window, i) => (
      <motion.rect
        key={i}
        x={window.x}
        y={window.y}
        width="3.5"
        height="3.5"
        fill="#FFFFFF"
        initial={{ scale: 0 }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{ 
          delay: 0.3 + i * 0.05,
          scale: { duration: 3, repeat: Infinity, repeatDelay: i * 0.5 },
          opacity: { duration: 3, repeat: Infinity, repeatDelay: i * 0.5 }
        }}
      />
    ))}
    
    {/* Door */}
    <motion.rect
      x="14"
      y="23"
      width="4"
      height="5"
      fill="#FFFFFF"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
      style={{ transformOrigin: "bottom" }}
    />
  </motion.svg>
);

// Lobby & Reception Icon - Continuous Animation
export const LobbyReceptionIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Reception Desk Base */}
    <motion.rect
      x="8"
      y="20"
      width="16"
      height="8"
      rx="1"
      fill="#000000"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
      style={{ transformOrigin: "bottom" }}
    />
    
    {/* Desk Counter Top */}
    <motion.rect
      x="6"
      y="19"
      width="20"
      height="2"
      rx="1"
      fill="#000000"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      style={{ transformOrigin: "center" }}
    />
    
    {/* Computer Screen */}
    <motion.rect
      x="14"
      y="15"
      width="4"
      height="3"
      rx="0.5"
      fill="#000000"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
    />
    <motion.line
      x1="16"
      y1="18"
      x2="16"
      y2="19"
      stroke="#000000"
      strokeWidth="1"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.35 }}
    />
    
    {/* Chandelier/Lighting - Continuous bobbing */}
    <motion.g
      animate={{
        y: [0, -1.5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.circle
        cx="16"
        cy="6"
        r="2"
        fill="#000000"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
      />
      <motion.line
        x1="16"
        y1="8"
        x2="16"
        y2="11"
        stroke="#000000"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.45 }}
      />
      {/* Chandelier crystals - Continuous shimmer */}
      {[-2, 0, 2].map((offset, i) => (
        <motion.line
          key={i}
          x1={16 + offset}
          y1="8"
          x2={16 + offset}
          y2="10"
          stroke="#000000"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            delay: 0.5 + i * 0.2,
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.g>
    
    {/* Guest Figure - Continuous walking animation */}
    <motion.g
      animate={{ 
        x: [0, 3, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Head */}
      <motion.circle cx="4" cy="22" r="1.5" fill="#000000" />
      {/* Body */}
      <motion.rect x="3" y="23.5" width="2" height="3" rx="0.5" fill="#000000" />
      {/* Luggage - Continuous bounce */}
      <motion.rect 
        x="2" 
        y="26" 
        width="1.5" 
        height="1.5" 
        rx="0.3" 
        fill="#000000"
        animate={{
          y: [26, 25.5, 26]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      />
    </motion.g>
    
    {/* Bell Service Indicator - Continuous ringing */}
    <motion.g
      animate={{
        rotate: [0, -8, 8, -8, 8, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3
      }}
      style={{ transformOrigin: "10px 18px" }}
    >
      <motion.path
        d="M8 18 C8 16.5 9 15.5 10 15.5 C11 15.5 12 16.5 12 18 Z"
        fill="#000000"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: "spring" }}
      />
      <motion.circle
        cx="10"
        cy="14.5"
        r="0.5"
        fill="#000000"
      />
    </motion.g>
    
    {/* Key cards on desk */}
    {[19, 21].map((x, i) => (
      <motion.rect
        key={i}
        x={x}
        y="22"
        width="1.5"
        height="2.5"
        rx="0.3"
        fill="#000000"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 + i * 0.05 }}
      />
    ))}
  </motion.svg>
);

// Guest Rooms Icon - Continuous 3-Scene Loop
export const GuestRoomsIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => {
  const [currentView, setCurrentView] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % 3); // Cycle: Bedroom → Bathroom → Amenities
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <AnimatePresence mode="wait">
        {currentView === 0 && (
          // BEDROOM VIEW
          <motion.g
            key="bedroom"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Bed Frame */}
            <motion.rect
              x="4"
              y="18"
              width="24"
              height="8"
              rx="1"
              fill="#000000"
            />
            {/* Mattress */}
            <motion.rect
              x="5"
              y="15"
              width="22"
              height="4"
              rx="0.5"
              fill="#000000"
            />
            {/* Pillows */}
            <motion.ellipse cx="10" cy="14" rx="3" ry="1.5" fill="#000000" />
            <motion.ellipse cx="16" cy="14" rx="3" ry="1.5" fill="#000000" />
            <motion.ellipse cx="22" cy="14" rx="3" ry="1.5" fill="#000000" />
            
            {/* Headboard */}
            <motion.rect x="4" y="8" width="24" height="6" rx="1" fill="#000000" />
            
            {/* Nightstand with lamp */}
            <motion.rect x="28" y="16" width="3" height="6" rx="0.5" fill="#000000" />
            <motion.g
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity
              }}
            >
              <motion.circle cx="29.5" cy="14" r="1.5" fill="#000000" />
              <motion.line x1="29.5" y1="15.5" x2="29.5" y2="16" stroke="#000000" strokeWidth="0.5" />
            </motion.g>
          </motion.g>
        )}

        {currentView === 1 && (
          // BATHROOM VIEW
          <motion.g
            key="bathroom"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Bathtub */}
            <motion.path
              d="M6 20 L6 24 Q6 26 8 26 L24 26 Q26 26 26 24 L26 20 Z"
              fill="#000000"
            />
            <motion.rect x="5" y="18" width="22" height="3" rx="1" fill="#000000" />
            
            {/* Faucet */}
            <motion.circle cx="24" cy="17" r="1" fill="#000000" />
            <motion.line x1="24" y1="18" x2="24" y2="20" stroke="#000000" strokeWidth="1" />
            
            {/* Water drops - Continuous */}
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx={24 - i * 0.5}
                cy={20}
                r={0.5}
                fill="#0EA5E9"
                animate={{
                  y: [0, 4, 8],
                  opacity: [1, 0.7, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
            
            {/* Sink */}
            <motion.rect x="10" y="12" width="8" height="4" rx="1" fill="#000000" />
            <motion.circle cx="14" cy="11" r="0.8" fill="#000000" />
            
            {/* Mirror */}
            <motion.rect x="8" y="4" width="12" height="8" rx="1" fill="none" stroke="#000000" strokeWidth="1.5" />
            
            {/* Towel rack */}
            <motion.line x1="22" y1="10" x2="28" y2="10" stroke="#000000" strokeWidth="1.5" />
            <motion.rect x="23" y="11" width="4" height="6" rx="0.5" fill="#000000" />
          </motion.g>
        )}

        {currentView === 2 && (
          // AMENITIES VIEW
          <motion.g
            key="amenities"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* TV Screen */}
            <motion.rect x="8" y="8" width="16" height="10" rx="1" fill="#000000" />
            <motion.rect x="9" y="9" width="14" height="8" rx="0.5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
            <motion.rect x="15" y="18" width="2" height="3" fill="#000000" />
            <motion.rect x="13" y="21" width="6" height="1" rx="0.5" fill="#000000" />
            
            {/* Mini Bar/Fridge */}
            <motion.rect x="4" y="20" width="6" height="8" rx="0.5" fill="#000000" />
            <motion.circle cx="9" cy="24" r="0.5" fill="#FFFFFF" />
            <motion.line x1="5.5" y1="22" x2="8.5" y2="22" stroke="#FFFFFF" strokeWidth="0.3" />
            <motion.line x1="5.5" y1="24" x2="8.5" y2="24" stroke="#FFFFFF" strokeWidth="0.3" />
            <motion.line x1="5.5" y1="26" x2="8.5" y2="26" stroke="#FFFFFF" strokeWidth="0.3" />
            
            {/* Coffee Machine */}
            <motion.rect x="22" y="22" width="5" height="6" rx="0.5" fill="#000000" />
            <motion.rect x="23" y="21" width="3" height="1.5" rx="0.3" fill="#000000" />
            {/* Steam animation - Continuous */}
            {[0, 1].map((i) => (
              <motion.path
                key={i}
                d={`M${24 + i} 20 Q${24.5 + i} 18 ${24 + i} 16`}
                stroke="#000000"
                strokeWidth="0.5"
                fill="none"
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, -2]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4
                }}
              />
            ))}
            
            {/* Safe */}
            <motion.rect x="12" y="23" width="6" height="5" rx="0.5" fill="#000000" />
            <motion.circle cx="15" cy="25.5" r="0.8" fill="#FFFFFF" />
          </motion.g>
        )}
      </AnimatePresence>
    </motion.svg>
  );
};

// Dining & Restaurant Icon - Continuous 3-Scene Loop
export const DiningRestaurantIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene(prev => (prev + 1) % 3); // Cycle: Restaurant → Café → Bar
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <AnimatePresence mode="wait">
        {currentScene === 0 && (
          // RESTAURANT SCENE
          <motion.g
            key="restaurant"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.5 }}
          >
            {/* Table */}
            <motion.ellipse cx="16" cy="22" rx="10" ry="3" fill="#000000" />
            <motion.rect x="15" y="15" width="2" height="7" fill="#000000" />
            
            {/* Plate */}
            <motion.circle cx="16" cy="18" r="5" fill="none" stroke="#000000" strokeWidth="1.5" />
            <motion.circle cx="16" cy="18" r="3" fill="none" stroke="#000000" strokeWidth="1" />
            
            {/* Fork (left) - Continuous gentle sway */}
            <motion.g
              animate={{
                rotate: [0, -4, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
              style={{ transformOrigin: "10px 18px" }}
            >
              <motion.rect x="9" y="16" width="0.8" height="6" rx="0.4" fill="#000000" />
              <motion.rect x="10.2" y="16" width="0.8" height="6" rx="0.4" fill="#000000" />
              <motion.rect x="8.5" y="21.5" width="3" height="1" rx="0.5" fill="#000000" />
            </motion.g>
            
            {/* Knife (right) - Continuous gentle sway */}
            <motion.g
              animate={{
                rotate: [0, 4, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 0.3
              }}
              style={{ transformOrigin: "22px 18px" }}
            >
              <motion.rect x="21" y="16" width="1.5" height="6" rx="0.7" fill="#000000" />
              <motion.path d="M21 16 L22.5 16 L23 14 L20.5 14 Z" fill="#000000" />
            </motion.g>
            
            {/* Wine glass */}
            <motion.g>
              <motion.path d="M24 12 L26 12 L25.5 16 L24.5 16 Z" fill="#000000" />
              <motion.line x1="25" y1="16" x2="25" y2="19" stroke="#000000" strokeWidth="0.8" />
              <motion.ellipse cx="25" cy="19" rx="1.5" ry="0.5" fill="#000000" />
              {/* Wine liquid */}
              <motion.path
                d="M24.2 13 L25.8 13 L25.5 15 L24.5 15 Z"
                fill="#000000"
                opacity="0.3"
              />
            </motion.g>
            
            {/* Candle - Continuous flickering AMBER FLAME */}
            <motion.g>
              <motion.rect x="7" y="15" width="1" height="3" rx="0.5" fill="#000000" />
              <motion.path
                d="M7.5 14 Q7 13 7.5 12.5 Q8 13 7.5 14"
                fill="#F59E0B"
                animate={{
                  scaleY: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              />
            </motion.g>
          </motion.g>
        )}

        {currentScene === 1 && (
          // CAFÉ SCENE
          <motion.g
            key="cafe"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.5 }}
          >
            {/* Table */}
            <motion.circle cx="16" cy="24" r="8" fill="#000000" />
            <motion.rect x="15" y="18" width="2" height="6" fill="#000000" />
            
            {/* Coffee cup */}
            <motion.g>
              <motion.path
                d="M12 14 L12 18 Q12 19 13 19 L17 19 Q18 19 18 18 L18 14 Z"
                fill="#000000"
              />
              <motion.ellipse cx="15" cy="14" rx="3" ry="1" fill="#000000" />
              {/* Handle */}
              <motion.path
                d="M18 15 Q20 15 20 17 Q20 18 19 18"
                stroke="#000000"
                strokeWidth="1"
                fill="none"
              />
              {/* Steam - Continuous rising */}
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M${13 + i * 1.5} 13 Q${13.5 + i * 1.5} 11 ${13 + i * 1.5} 9`}
                  stroke="#000000"
                  strokeWidth="0.5"
                  fill="none"
                  animate={{
                    opacity: [0, 1, 0],
                    y: [0, -2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4
                  }}
                />
              ))}
            </motion.g>
            
            {/* Pastry/croissant - Continuous gentle pulse */}
            <motion.g
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity
              }}
            >
              <motion.ellipse cx="22" cy="18" rx="3" ry="2" fill="#000000" />
              <motion.ellipse cx="22" cy="18" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.3" />
              <motion.path d="M20 18 Q22 16 24 18" stroke="#000000" strokeWidth="0.5" fill="none" />
            </motion.g>
            
            {/* Newspaper/Menu */}
            <motion.rect x="6" y="18" width="6" height="8" rx="0.5" fill="#000000" />
            <motion.line x1="7" y1="20" x2="11" y2="20" stroke="#FFFFFF" strokeWidth="0.3" />
            <motion.line x1="7" y1="21.5" x2="11" y2="21.5" stroke="#FFFFFF" strokeWidth="0.3" />
            <motion.line x1="7" y1="23" x2="10" y2="23" stroke="#FFFFFF" strokeWidth="0.3" />
          </motion.g>
        )}

        {currentScene === 2 && (
          // BAR SCENE
          <motion.g
            key="bar"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.5 }}
          >
            {/* Bar Counter */}
            <motion.rect x="4" y="20" width="24" height="8" rx="1" fill="#000000" />
            <motion.rect x="4" y="18" width="24" height="2" rx="0.5" fill="#000000" />
            
            {/* Cocktail Glass - Continuous gentle sway */}
            <motion.g
              animate={{
                rotate: [0, -3, 3, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity
              }}
              style={{ transformOrigin: "12px 16px" }}
            >
              <motion.path d="M10 12 L14 12 L12.5 16 L11.5 16 Z" fill="#000000" />
              <motion.line x1="12" y1="16" x2="12" y2="18" stroke="#000000" strokeWidth="0.8" />
              <motion.ellipse cx="12" cy="18" rx="2" ry="0.5" fill="#000000" />
              {/* Olive/garnish */}
              <motion.circle cx="13" cy="12.5" r="0.5" fill="#000000" />
              <motion.line x1="13" y1="10" x2="13" y2="12" stroke="#000000" strokeWidth="0.4" />
            </motion.g>
            
            {/* Wine Bottle */}
            <motion.g>
              <motion.rect x="19" y="8" width="2" height="4" rx="0.3" fill="#000000" />
              <motion.rect x="18.5" y="12" width="3" height="6" rx="0.5" fill="#000000" />
              <motion.ellipse cx="20" cy="7.5" rx="0.8" ry="0.5" fill="#000000" />
            </motion.g>
            
            {/* Beer Glass */}
            <motion.g>
              <motion.path d="M24 12 L24 16 Q24 17 25 17 L26 17 Q27 17 27 16 L27 12 Z" fill="#000000" />
              {/* Foam */}
              <motion.ellipse cx="25.5" cy="12" rx="1.5" ry="1" fill="#000000" />
              <motion.circle
                cx="24.5"
                cy="11.5"
                r="0.5"
                fill="#000000"
                animate={{
                  y: [0, -1, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </motion.g>
            
            {/* Bar Stools */}
            {[8, 16, 24].map((x, i) => (
              <motion.g key={i}>
                <motion.circle cx={x} cy="26" r="2" fill="#000000" />
                <motion.line x1={x} y1="24" x2={x} y2="20" stroke="#000000" strokeWidth="1" />
              </motion.g>
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </motion.svg>
  );
};

// Facilities & Amenities Icon - Continuous Animation with BLUE WATER
export const FacilitiesAmenitiesIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pool Base */}
    <motion.rect
      x="4"
      y="18"
      width="24"
      height="10"
      rx="2"
      fill="#000000"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
      style={{ transformOrigin: "bottom" }}
    />
    
    {/* Water Surface - BLUE */}
    <motion.rect
      x="5"
      y="19"
      width="22"
      height="1"
      fill="#0EA5E9"
      opacity="0.6"
    />
    
    {/* Water Waves - BLUE - Continuous flowing */}
    {[0, 1, 2, 3].map((i) => (
      <motion.path
        key={i}
        d={`M6 ${21 + i * 2} Q10 ${20 + i * 2} 14 ${21 + i * 2} T22 ${21 + i * 2} T26 ${21 + i * 2}`}
        stroke="#0EA5E9"
        strokeWidth="0.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1,
          opacity: 0.5,
          x: [0, 4, 0]
        }}
        transition={{ 
          pathLength: { delay: 0.3 + i * 0.1 },
          x: { repeat: Infinity, duration: 3, ease: "linear" },
          opacity: { delay: 0.3 + i * 0.1 }
        }}
      />
    ))}
    
    {/* Swimmer - Continuous swimming animation */}
    <motion.g
      animate={{
        x: [0, 12, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Head */}
      <motion.circle cx="10" cy="22" r="1.2" fill="#FFFFFF" />
      {/* Body */}
      <motion.ellipse 
        cx="11.5" 
        cy="23" 
        rx="2" 
        ry="0.8" 
        fill="#FFFFFF"
        animate={{
          ry: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 1,
          repeat: Infinity
        }}
      />
      {/* Arm - Continuous swimming stroke */}
      <motion.path
        d="M9 23 Q8 22 7 22.5"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        fill="none"
        animate={{
          d: [
            "M9 23 Q8 22 7 22.5",
            "M9 23 Q8 21 9 20",
            "M9 23 Q8 22 7 22.5"
          ]
        }}
        transition={{
          duration: 1,
          repeat: Infinity
        }}
      />
    </motion.g>
    
    {/* Pool Ladder */}
    <motion.g
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring" }}
    >
      <motion.line x1="26" y1="18" x2="26" y2="27" stroke="#FFFFFF" strokeWidth="1" />
      <motion.line x1="28" y1="18" x2="28" y2="27" stroke="#FFFFFF" strokeWidth="1" />
      {[20, 23, 26].map((y, i) => (
        <motion.line
          key={i}
          x1="26"
          y1={y}
          x2="28"
          y2={y}
          stroke="#FFFFFF"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}
    </motion.g>
    
    {/* Gym Dumbbell - Continuous lifting */}
    <motion.g
      animate={{
        rotate: [0, -15, 15, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatDelay: 1
      }}
      style={{ transformOrigin: "8px 10px" }}
    >
      <motion.circle cx="5" cy="10" r="1.5" fill="#000000" />
      <motion.rect x="5" y="9.2" width="6" height="1.6" fill="#000000" />
      <motion.circle cx="11" cy="10" r="1.5" fill="#000000" />
    </motion.g>
    
    {/* Spa Candle - AMBER FLAME - Continuous flickering */}
    <motion.g>
      <motion.rect x="18" y="12" width="2" height="5" rx="1" fill="#000000" />
      <motion.path
        d="M19 11 Q18.5 10 19 9.5 Q19.5 10 19 11"
        fill="#F59E0B"
        animate={{
          scaleY: [1, 1.4, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity
        }}
      />
      {/* Spa stones */}
      <motion.ellipse cx="22" cy="15" rx="1.5" ry="1" fill="#000000" opacity="0.7" />
      <motion.ellipse cx="24" cy="14.5" rx="1.2" ry="0.8" fill="#000000" opacity="0.7" />
    </motion.g>
    
    {/* Sun rays - Continuous rotation */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const angle = (i * 45) * (Math.PI / 180);
      const x1 = 16 + Math.cos(angle) * 3;
      const y1 = 8 + Math.sin(angle) * 3;
      const x2 = 16 + Math.cos(angle) * 5;
      const y2 = 8 + Math.sin(angle) * 5;
      
      return (
        <motion.line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#000000"
          strokeWidth="0.8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: 1,
            rotate: 360
          }}
          transition={{
            pathLength: { delay: 0.6 + i * 0.05 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
          style={{ transformOrigin: "16px 8px" }}
        />
      );
    })}
    
    {/* Sun center - Continuous gentle pulse */}
    <motion.circle
      cx="16"
      cy="8"
      r="2"
      fill="#000000"
      initial={{ scale: 0 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{
        scale: {
          duration: 2.5,
          repeat: Infinity
        }
      }}
    />
  </motion.svg>
);

// Common Areas Icon - Continuous Animation with GREEN LEAVES
export const CommonAreasIcon = ({ size = 32, isSelected = false, isHovered = false }: IconProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tree Trunk */}
    <motion.rect
      x="14"
      y="16"
      width="4"
      height="12"
      fill="#000000"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
      style={{ transformOrigin: "bottom" }}
    />
    
    {/* Leaves - Bottom Layer - Continuous gentle sway */}
    <motion.circle
      cx="16"
      cy="14"
      r="7"
      fill="#000000"
      initial={{ scale: 0 }}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ 
        delay: 0.2, 
        type: "spring",
        scale: { duration: 3, repeat: Infinity }
      }}
    />
    
    {/* Leaves - Middle Layer */}
    <motion.circle
      cx="16"
      cy="10"
      r="5"
      fill="#000000"
      initial={{ scale: 0 }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ 
        delay: 0.3, 
        type: "spring",
        scale: { duration: 3.5, repeat: Infinity, delay: 0.2 }
      }}
    />
    
    {/* Leaves - Top Layer */}
    <motion.circle
      cx="16"
      cy="7"
      r="3"
      fill="#000000"
      initial={{ scale: 0 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ 
        delay: 0.4, 
        type: "spring",
        scale: { duration: 4, repeat: Infinity, delay: 0.4 }
      }}
    />
    
    {/* GREEN Falling Leaves - Continuous animation */}
    {[0, 1, 2, 3].map((i) => (
      <motion.ellipse
        key={i}
        cx={12 + i * 2.5}
        cy={10}
        rx="0.8"
        ry="1.2"
        fill="#10B981"
        initial={{ y: 0, opacity: 1, rotate: 0 }}
        animate={{ 
          y: [0, 15, 20],
          opacity: [1, 0.6, 0],
          x: [0, 3, -2],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          delay: i * 0.6,
          duration: 3,
          repeat: Infinity,
          ease: "easeIn"
        }}
      />
    ))}
    
    {/* Garden Bench */}
    <motion.g
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
    >
      {/* Bench Seat */}
      <motion.rect
        x="4"
        y="24"
        width="10"
        height="2"
        rx="1"
        fill="#000000"
      />
      
      {/* Bench Back */}
      <motion.rect
        x="4"
        y="20"
        width="10"
        height="1.5"
        rx="0.7"
        fill="#000000"
      />
      
      {/* Bench Supports */}
      <motion.rect x="5" y="21.5" width="1.5" height="2.5" fill="#000000" />
      <motion.rect x="11.5" y="21.5" width="1.5" height="2.5" fill="#000000" />
      
      {/* Bench Legs */}
      <motion.rect x="5" y="26" width="1.5" height="2" fill="#000000" />
      <motion.rect x="11.5" y="26" width="1.5" height="2" fill="#000000" />
    </motion.g>
    
    {/* Reading Person on Bench */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.6, type: "spring" }}
    >
      {/* Head */}
      <motion.circle cx="8" cy="21" r="1.2" fill="#000000" />
      {/* Body */}
      <motion.rect x="6.5" y="22" width="3" height="2.5" rx="0.5" fill="#000000" />
      {/* Book - Continuous reading animation */}
      <motion.rect 
        x="7" 
        y="20" 
        width="2" 
        height="1.5" 
        rx="0.2" 
        fill="#000000"
        animate={{
          rotate: [0, -3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity
        }}
        style={{ transformOrigin: "8px 20px" }}
      />
    </motion.g>
    
    {/* Fountain/Water Feature */}
    <motion.g>
      {/* Fountain Base */}
      <motion.circle cx="26" cy="26" r="3" fill="#000000" />
      <motion.circle cx="26" cy="26" r="2" fill="#FFFFFF" opacity="0.2" />
      
      {/* Water Spray - Continuous */}
      {[0, 1, 2].map((i) => (
        <motion.line
          key={i}
          x1="26"
          y1="26"
          x2={26 + (i - 1) * 1.5}
          y2="20"
          stroke="#000000"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
      
      {/* Water droplets - Continuous */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={25 + i * 0.5}
          cy={22}
          r="0.3"
          fill="#000000"
          animate={{
            y: [0, 4, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </motion.g>
    
    {/* Birds flying - Continuous */}
    {[0, 1].map((i) => (
      <motion.path
        key={i}
        d="M2 8 Q4 6 6 8"
        stroke="#000000"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        initial={{ x: 0, opacity: 0 }}
        animate={{
          x: [0, 28, 0],
          opacity: [0, 1, 0],
          y: [0, -2, 0]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          delay: i * 3.5
        }}
      />
    ))}
  </motion.svg>
);

// Icon Mapper
export const getPhotoCategoryIcon = (categoryId: string) => {
  const iconMap: { [key: string]: React.ComponentType<IconProps> } = {
    'exterior': ExteriorBuildingIcon,
    'lobby': LobbyReceptionIcon,
    'rooms': GuestRoomsIcon,
    'dining': DiningRestaurantIcon,
    'facilities': FacilitiesAmenitiesIcon,
    'common': CommonAreasIcon
  };
  
  return iconMap[categoryId] || ExteriorBuildingIcon;
};
