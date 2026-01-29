import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { DrawerHeader } from '../../components/composite/DrawerHeader';
import { QuickActions } from '../../components/composite/QuickActions';
import { DrawerMenu } from '../../components/composite/DrawerMenu';
import { PartnerModeSwitch } from '../../components/composite/PartnerModeSwitch';
import { travelerDrawerItems, travelerQuickActions } from '../traveler/drawer/items';
import { hotelManagerDrawerItems, hotelManagerQuickActions } from '../hotelManager/drawer/items';
import { tourOperatorDrawerItems, tourOperatorQuickActions } from '../tourOperator/drawer/items';
import type { DrawerMeta, DrawerTheme } from '../types/drawer';
import type { UserRole } from '../../lib/types';

interface DrawerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  selectedItemId: string;
  onItemClick: (itemId: string, screen: string) => void;
  onQuickActionClick: (actionId: string) => void;
  onSwitchToTraveler: () => void;
  onBecomePartner: () => void;
  meta: DrawerMeta;
}

export function DrawerManager({
  isOpen,
  onClose,
  role,
  selectedItemId,
  onItemClick,
  onQuickActionClick,
  onSwitchToTraveler,
  onBecomePartner,
  meta
}: DrawerManagerProps) {
  
  // Get role-specific data
  const getDrawerData = () => {
    switch (role) {
      case 'hotel_manager':
        return {
          items: hotelManagerDrawerItems,
          actions: hotelManagerQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
      case 'tour_operator':
        return {
          items: tourOperatorDrawerItems,
          actions: tourOperatorQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
      default:
        return {
          items: travelerDrawerItems,
          actions: travelerQuickActions,
          theme: {
            accentColor: '#ff5a5f',
            selectedIndicatorColor: '#ff5a5f',
            iconSelectedColor: '#ff5a5f',
            iconHoverColor: '#000000'
          } as DrawerTheme
        };
    }
  };

  const { items, actions, theme } = getDrawerData();
  const isPartnerMode = role !== 'traveler';

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-card shadow-2xl z-[60]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="h-full flex flex-col">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2">
                {/* Close Button */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400 dark:text-muted-foreground" />
                  </button>
                </div>

                {/* Header */}
                <DrawerHeader 
                  meta={meta}
                  role={role}
                  onEditProfile={() => onItemClick('settings', 'settings')}
                />

                {/* Quick Actions */}
                <QuickActions 
                  actions={actions}
                  onActionClick={onQuickActionClick}
                />

                {/* Menu Items */}
                <DrawerMenu
                  items={items}
                  selectedItemId={selectedItemId}
                  theme={theme}
                  onItemClick={onItemClick}
                />


              </div>

              {/* Sticky Bottom Section - Always visible */}
              <div className="flex-shrink-0 space-y-4 bg-white dark:bg-card px-4 pb-4 border-t border-gray-100 dark:border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <PartnerModeSwitch
                  isPartnerMode={isPartnerMode}
                  onSwitchToTraveler={onSwitchToTraveler}
                  onBecomePartner={onBecomePartner}
                />

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-border">
                  <p className="text-xs text-gray-400 dark:text-muted-foreground text-center">
                    Version 1.0.0 • Made with ❤️
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
