import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Plus, Edit2, MapPin, Building, Plane, ArrowLeft } from 'lucide-react';
import { SmartIcon } from './icons/SmartIcon';
import { HotelManagerSmartIcon } from './icons/hotel-manager/HotelManagerSmartIcon';
import { ProfileAvatar } from './ProfileAvatar';
import { ICON_COLOR_MAP, ICON_COLORS, MENU_ITEMS } from '../lib/constants';
import { roleManager } from '../modules/roles/RoleManager';
import type { AppView, UserRole } from '../lib/types';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  partnerMode: 'hotel_manager' | 'tour_operator' | null;
  onPartnerSelection: () => void;
  onSwitchToTravelerMode: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToView?: (view: AppView) => void;
}

export function HamburgerMenu({ 
  isOpen, 
  onToggle, 
  partnerMode, 
  onPartnerSelection, 
  onSwitchToTravelerMode, 
  onNavigateToDashboard, 
  onNavigateToView 
}: HamburgerMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>('dashboard');

  // Get effective role and menu items from role manager
  const effectiveRole: UserRole = partnerMode || 'traveler';
  const menuItems = roleManager.getMenuItems(effectiveRole);

  // Handle menu item click
  const handleMenuItemClick = (itemId: string, label: string, view: AppView) => {
    setSelectedItem(itemId);
    
    if (view === 'dashboard' && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onNavigateToView) {
      onNavigateToView(view);
    }
    
    onToggle();
  };

  // Get role-specific accent color
  const getRoleAccentColor = () => {
    switch (partnerMode) {
      case 'hotel_manager':
        return ICON_COLORS.CORAL;
      case 'tour_operator':
        return ICON_COLORS.MAUVE;
      default:
        return ICON_COLORS.LIME;
    }
  };

  const accentColor = getRoleAccentColor();

  return (
    <>
      {/* Menu Button */}
      <motion.button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors z-[60] relative"
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </motion.div>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[60]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="h-full flex flex-col p-4">
              {/* Close Button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={onToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Profile Section */}
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Profile Header */}
                <div className="flex items-start gap-3 mb-4">
                  <ProfileAvatar />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">Maria</h3>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">tours@adventures.com</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {partnerMode === 'hotel_manager' ? (
                        <>
                          <Building className="w-4 h-4" />
                          <span>Hotel Manager • Pakistan</span>
                        </>
                      ) : partnerMode === 'tour_operator' ? (
                        <>
                          <Plane className="w-4 h-4" />
                          <span>Tour Operator • Pakistan</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Traveler • Pakistan</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Completion */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-semibold text-blue-600">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" 
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>
              </motion.div>

              {/* Role-specific Action Buttons */}
              {partnerMode === 'hotel_manager' && (
                <motion.div
                  className="mb-4 space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    onClick={() => {
                      if (onNavigateToView) {
                        onNavigateToView('hotel-onboarding');
                        onToggle(); // Close the hamburger menu
                      }
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-6 h-6 bg-[#5FAD43] rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Hotel Onboarding</span>
                      <p className="text-xs text-gray-600">Set up your hotel listing</p>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Post Hotel Package</span>
                  </motion.button>
                </motion.div>
              )}

              {partnerMode === 'tour_operator' && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-900">Create New Tour</span>
                  </motion.button>
                </motion.div>
              )}

              {!partnerMode && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SmartIcon type="plan-trip" size="md" />
                    <span className="font-medium text-gray-900">Plan New Trip</span>
                  </motion.button>
                </motion.div>
              )}

              {/* Menu Items */}
              <nav className="flex-1 space-y-1 mb-4">
                {menuItems.map((item, index) => {
                  const isSelected = selectedItem === item.id;
                  const isHovered = hoveredItem === item.id;
                  
                  return (
                    <motion.button
                      key={item.label}
                      onClick={() => handleMenuItemClick(item.id, item.label, item.view)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group text-left relative overflow-hidden ${
                        isSelected 
                          ? 'bg-gray-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                          style={{ backgroundColor: accentColor }}
                          layoutId="selectedIndicator"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      
                      {/* Icon */}
                      <div>
                        {partnerMode === 'hotel_manager' ? (
                          <HotelManagerSmartIcon
                            type={item.iconType as keyof typeof ICON_COLOR_MAP}
                            isSelected={isSelected}
                            isHovered={isHovered}
                            size="lg"
                          />
                        ) : (
                          <SmartIcon
                            type={item.iconType as keyof typeof ICON_COLOR_MAP}
                            isSelected={isSelected}
                            isHovered={isHovered}
                            size="md"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {item.label}
                        </span>
                        {item.badge && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.badge}
                          </div>
                        )}
                      </div>
                      
                      {/* Hover glow effect */}
                      {(isHovered || isSelected) && (
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-5"
                          style={{ backgroundColor: '#000000' }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.05, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.button>
                  );
                })}

                {/* Help & Support */}
                <motion.button
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredItem('help')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => setSelectedItem('help')}
                >
                  {selectedItem === 'help' && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                      style={{ backgroundColor: accentColor }}
                      layoutId="selectedIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  <div>
                    {partnerMode === 'hotel_manager' ? (
                      <HotelManagerSmartIcon
                        type="help"
                        isSelected={selectedItem === 'help'}
                        isHovered={hoveredItem === 'help'}
                        size="lg"
                      />
                    ) : (
                      <SmartIcon
                        type="help"
                        isSelected={selectedItem === 'help'}
                        isHovered={hoveredItem === 'help'}
                        size="md"
                      />
                    )}
                  </div>
                  
                  <span className="font-medium text-gray-900">
                    Help & Support
                  </span>
                </motion.button>

                {/* Legal & Policies */}
                <motion.button
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-left relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredItem('legal')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => setSelectedItem('legal')}
                >
                  {selectedItem === 'legal' && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                      style={{ backgroundColor: accentColor }}
                      layoutId="selectedIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  <div>
                    {partnerMode === 'hotel_manager' ? (
                      <HotelManagerSmartIcon
                        type="legal"
                        isSelected={selectedItem === 'legal'}
                        isHovered={hoveredItem === 'legal'}
                        size="lg"
                      />
                    ) : (
                      <SmartIcon
                        type="legal"
                        isSelected={selectedItem === 'legal'}
                        isHovered={hoveredItem === 'legal'}
                        size="md"
                      />
                    )}
                  </div>
                  
                  <span className="font-medium text-gray-900">
                    Legal & Policies
                  </span>
                </motion.button>
              </nav>

              {/* Bottom Section */}
              <div className="space-y-4">
                {/* Switch to Traveler Mode - Only for Partners */}
                {partnerMode && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="border-t border-gray-200 pt-4">
                      <motion.button
                        onClick={onSwitchToTravelerMode}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Switch to Traveler Mode</h3>
                          <p className="text-sm text-gray-600">Browse and book trips as a traveler</p>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Become a Partner Section - Only for Traveler */}
                {!partnerMode && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Partner with us</h4>
                      <motion.button
                        onClick={onPartnerSelection}
                        className="w-full p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-gray-200 hover:from-blue-100 hover:to-green-100 transition-all text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">Become a Partner</h3>
                        <p className="text-sm text-gray-600">Join TripAvail and grow your business</p>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
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