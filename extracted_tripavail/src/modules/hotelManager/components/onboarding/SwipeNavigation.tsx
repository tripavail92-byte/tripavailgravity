import { motion, PanInfo } from 'motion/react';
import { useState } from 'react';

interface SwipeNavigationProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipeLeft?: boolean;
  canSwipeRight?: boolean;
}

export function SwipeNavigation({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  canSwipeLeft = true, 
  canSwipeRight = true 
}: SwipeNavigationProps) {
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && canSwipeRight && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && canSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.95 }}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
      
      {/* Swipe Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {canSwipeRight && (
          <motion.div
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-gray-400 flex items-center gap-1"
          >
            ← Swipe for previous
          </motion.div>
        )}
        {canSwipeLeft && (
          <motion.div
            animate={{ x: [5, -5, 5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-gray-400 flex items-center gap-1"
          >
            Swipe for next →
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}