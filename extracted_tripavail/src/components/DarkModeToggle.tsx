import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ isDarkMode, onToggle }: DarkModeToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        relative p-2 rounded-lg transition-all duration-300 
        ${isDarkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
      `}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      data-tour="dark-mode-toggle"
    >
      <motion.div
        animate={{ 
          rotate: isDarkMode ? 180 : 0,
          scale: isDarkMode ? 1.1 : 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
      >
        {isDarkMode ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
      
      {/* Subtle glow effect in dark mode */}
      {isDarkMode && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-yellow-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
}