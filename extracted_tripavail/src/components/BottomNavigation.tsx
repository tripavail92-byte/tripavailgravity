import { motion } from 'motion/react';
import { NeonGlassyHomeIcon } from './icons/NeonGlassyHomeIcon';
import { NeonGlassyHotelIcon } from './icons/NeonGlassyHotelIcon';
import { NeonGlassyBeachTourIcon } from './icons/NeonGlassyBeachTourIcon';
import { NeonGlassyMessageIcon } from './icons/NeonGlassyMessageIcon';
import { NeonGlassyProfileIcon } from './icons/NeonGlassyProfileIcon';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', icon: NeonGlassyHomeIcon, label: 'Home' },
    { id: 'hotels', icon: NeonGlassyHotelIcon, label: 'Hotels' },
    { id: 'tours', icon: NeonGlassyBeachTourIcon, label: 'Tours' },
    { id: 'messages', icon: NeonGlassyMessageIcon, label: 'Messages' },
    { id: 'profile', icon: NeonGlassyProfileIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center py-2 px-2 relative"
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
            >
              {/* Icon Container with individual glassy effect */}
              <motion.div className="relative mb-2">
                <tab.icon 
                  className="w-7 h-7"
                  isActive={isActive}
                />
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-xs transition-all duration-300 ${
                  isActive 
                    ? 'font-semibold' 
                    : 'font-medium opacity-70'
                }`}
                style={{
                  color: isActive ? '#E11D48' : '#6B7280',
                  textShadow: isActive ? '0 0 6px rgba(225, 29, 72, 0.4)' : 'none'
                }}
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              >
                {tab.label}
              </motion.span>
              
              {/* Active Bottom Indicator */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 w-10 h-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, #E11D48 50%, transparent 100%)`,
                    boxShadow: '0 0 6px rgba(225, 29, 72, 0.6)'
                  }}
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}