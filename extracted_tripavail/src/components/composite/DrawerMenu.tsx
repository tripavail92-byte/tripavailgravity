import { motion } from 'motion/react';
import type { DrawerItem, DrawerTheme } from '../../modules/types/drawer';

interface DrawerMenuProps {
  items: DrawerItem[];
  selectedItemId: string;
  theme: DrawerTheme;
  onItemClick: (itemId: string, screen: string) => void;
  animationDelay?: number;
}

export function DrawerMenu({ 
  items, 
  selectedItemId, 
  theme, 
  onItemClick, 
  animationDelay = 0.25 
}: DrawerMenuProps) {
  const navigationItems = items.filter(item => item.type === 'navigation');
  const supportItems = items.filter(item => item.type === 'support');

  const renderMenuItem = (item: DrawerItem, index: number, isSupport = false) => {
    const isSelected = selectedItemId === item.id;

    return (
      <motion.button
        key={item.id}
        onClick={() => onItemClick(item.id, item.screen)}
        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group text-left relative overflow-hidden ${
          isSelected 
            ? 'bg-gray-50 dark:bg-gray-800' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-800'
        }`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay + index * 0.05 }}
        whileTap={{ scale: 0.98 }}
        data-tour={item.tourId}
      >
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
            style={{ backgroundColor: theme.selectedIndicatorColor }}
            layoutId="selectedIndicator"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        
        {/* Icon */}
        <div>
          <item.icon
            isActive={isSelected}
            size={20}
          />
        </div>
        
        <div className="flex-1">
          <span className="font-medium text-gray-900 dark:text-foreground">
            {item.label}
          </span>
          {item.badge && (
            <div className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
              {item.badge}
            </div>
          )}
        </div>

      </motion.button>
    );
  };

  return (
    <nav className="flex-1 space-y-1 mb-4">
      {/* Navigation Items */}
      {navigationItems.map((item, index) => renderMenuItem(item, index))}

      {/* Support Items */}
      {supportItems.length > 0 && (
        <div className="pt-4">
          {supportItems.map((item, index) => renderMenuItem(item, navigationItems.length + index, true))}
        </div>
      )}
    </nav>
  );
}