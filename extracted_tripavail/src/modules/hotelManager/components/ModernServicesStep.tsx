import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Search, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { getServiceIcon } from '../../../components/icons/services/AnimatedServiceIcons';
import { GuestServicesIcon, LanguagesIcon, AccessibilityIcon } from '../../../components/icons/services/AnimatedSectionIcons';

interface ServicesData {
  services: string[];
  languages: string[];
  accessibility: string[];
}

interface ModernServicesStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function ModernServicesStep({ onComplete, existingData, onUpdate }: ModernServicesStepProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(existingData?.services || []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(existingData?.languages || []);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>(existingData?.accessibility || []);
  
  // Smart accordion logic - only one section open at a time
  const [expandedSection, setExpandedSection] = useState<string | null>('additional-services');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // References for auto-scroll functionality
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const additionalServices = [
    'Airport Transfer', 'Tour Booking', 'Car Rental', 'Laundry Service',
    'Dry Cleaning', 'Babysitting', 'Pet Care', 'Grocery Shopping',
    'Event Planning', 'Catering', 'Photography', 'Translation Services',
    'Medical Assistance', 'Equipment Rental', 'Ticket Booking', 'Currency Exchange'
  ];

  const languages = [
    'English', 'Urdu', 'Hindi', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi',
    'Arabic', 'Persian', 'Chinese', 'Japanese', 'French', 'German', 'Spanish'
  ];

  const accessibilityFeatures = [
    'Wheelchair Accessible Entrance', 'Wheelchair Accessible Rooms', 'Elevator Access',
    'Accessible Bathroom', 'Braille Signage', 'Hearing Loop System', 'Visual Alarms',
    'Accessible Parking', 'Ramps', 'Grab Bars', 'Roll-in Shower', 'Accessible Pool'
  ];

  // Filter services based on search
  const filteredServices = searchQuery
    ? additionalServices.filter(service =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : additionalServices;

  // Smart toggle - close current, open new, and scroll
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      
      // Auto-scroll after a brief delay to allow animation to start
      setTimeout(() => {
        sectionRefs.current[section]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 150);
    }
  };

  const toggleItem = (item: string, list: string[], setList: any, updateKey: string) => {
    const newList = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    
    setList(newList);
    
    const updatedData = {
      services: updateKey === 'services' ? newList : selectedServices,
      languages: updateKey === 'languages' ? newList : selectedLanguages,
      accessibility: updateKey === 'accessibility' ? newList : selectedAccessibility
    };
    
    if (onUpdate) onUpdate(updatedData);
  };

  const handleContinue = () => {
    onComplete({
      services: selectedServices,
      languages: selectedLanguages,
      accessibility: selectedAccessibility
    });
  };

  const getSectionCount = (section: string) => {
    switch (section) {
      case 'additional-services':
        return selectedServices.length;
      case 'languages':
        return selectedLanguages.length;
      case 'accessibility':
        return selectedAccessibility.length;
      default:
        return 0;
    }
  };

  const getTotalSelections = () => {
    return selectedServices.length + selectedLanguages.length + selectedAccessibility.length;
  };

  // Simple Language Icon Component
  const LanguageItemIcon = ({ language }: { language: string }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        stroke="#000000"
        strokeWidth="2"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />
      <motion.text
        x="20"
        y="26"
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
        fill="#000000"
      >
        {language.substring(0, 2).toUpperCase()}
      </motion.text>
    </svg>
  );

  // Simple Accessibility Icon Component
  const AccessibilityItemIcon = ({ feature }: { feature: string }) => {
    // Determine icon based on feature type
    const getFeatureIcon = () => {
      if (feature.toLowerCase().includes('wheelchair')) {
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="12" r="3" fill="#000000" />
            <circle cx="16" cy="28" r="6" stroke="#000000" strokeWidth="2" fill="none" />
            <path d="M20 16V24L26 24" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 24L16 28" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      } else if (feature.toLowerCase().includes('elevator')) {
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="12" y="8" width="16" height="24" rx="2" stroke="#000000" strokeWidth="2" fill="none" />
            <path d="M17 16L20 13L23 16" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 24L20 27L23 24" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      } else if (feature.toLowerCase().includes('braille') || feature.toLowerCase().includes('visual')) {
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="16" cy="16" r="2" fill="#000000" />
            <circle cx="24" cy="16" r="2" fill="#000000" />
            <circle cx="16" cy="24" r="2" fill="#000000" />
            <circle cx="24" cy="24" r="2" fill="#000000" />
            <circle cx="20" cy="20" r="2" fill="#000000" />
          </svg>
        );
      } else if (feature.toLowerCase().includes('parking')) {
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="10" y="10" width="20" height="20" rx="2" stroke="#000000" strokeWidth="2" fill="none" />
            <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700" fill="#000000">P</text>
          </svg>
        );
      } else if (feature.toLowerCase().includes('ramp')) {
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M10 28L30 12" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
            <rect x="8" y="26" width="4" height="4" fill="#000000" />
          </svg>
        );
      }
      // Default accessibility icon
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="12" r="3" fill="#000000" />
          <path d="M20 16C16 16 12 18 12 22V28" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 16C24 16 28 18 28 22V28" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    };

    return getFeatureIcon();
  };

  return (
    <div className="space-y-6">
      {/* Additional Services - Smart Accordion */}
      <motion.div
        ref={el => sectionRefs.current['additional-services'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden shadow-none border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => toggleSection('additional-services')}
            className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            style={{ borderBottom: '1px solid #EAEAEA' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-gray-700 dark:text-gray-300">
                  <GuestServicesIcon size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                  Additional Services
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                  {getSectionCount('additional-services')}/{additionalServices.length}
                </span>
                <motion.div
                  animate={{ rotate: expandedSection === 'additional-services' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'additional-services' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div style={{ padding: '20px' }}>
                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Amenities-style Grid */}
                  <div className="grid grid-cols-2" style={{ gap: '18px 12px' }}>
                    {filteredServices.map((service) => {
                      const isSelected = selectedServices.includes(service);
                      const isHovered = hoveredItem === service;
                      const IconComponent = getServiceIcon(service);

                      return (
                        <motion.button
                          key={service}
                          onClick={() => toggleItem(service, selectedServices, setSelectedServices, 'services')}
                          onMouseEnter={() => setHoveredItem(service)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`relative ${
                            isSelected ? 'border-[1.5px]' : 'border'
                          }`}
                          style={{
                            width: '100%',
                            maxWidth: '160px',
                            height: '130px',
                            padding: '20px 12px',
                            borderRadius: '8px',
                            borderColor: isSelected ? '#000000' : '#E0E0E0',
                            background: '#FFFFFF',
                            transition: 'border-color 0.2s ease, border-width 0.2s ease'
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Vertically Stacked: Icon Above Text */}
                          <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
                            {/* Icon - 40x40px */}
                            <motion.div
                              className="flex-shrink-0"
                              animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <IconComponent
                                isSelected={false}
                                isHovered={isHovered}
                                size={40}
                              />
                            </motion.div>

                            {/* Service Name - Centered */}
                            <div className="text-center">
                              <h4 
                                style={{
                                  fontSize: '15px',
                                  lineHeight: '20px',
                                  fontWeight: isSelected ? 500 : 400,
                                  color: '#1A1A1A'
                                }}
                              >
                                {service}
                              </h4>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Languages Spoken - Smart Accordion */}
      <motion.div
        ref={el => sectionRefs.current['languages'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden shadow-none border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => toggleSection('languages')}
            className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            style={{ borderBottom: '1px solid #EAEAEA' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-gray-700 dark:text-gray-300">
                  <LanguagesIcon size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                  Languages Spoken by Staff
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                  {getSectionCount('languages')}/{languages.length}
                </span>
                <motion.div
                  animate={{ rotate: expandedSection === 'languages' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'languages' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div style={{ padding: '20px' }}>
                  {/* Amenities-style Grid */}
                  <div className="grid grid-cols-2" style={{ gap: '18px 12px' }}>
                    {languages.map((language) => {
                      const isSelected = selectedLanguages.includes(language);
                      const isHovered = hoveredItem === language;

                      return (
                        <motion.button
                          key={language}
                          onClick={() => toggleItem(language, selectedLanguages, setSelectedLanguages, 'languages')}
                          onMouseEnter={() => setHoveredItem(language)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`relative ${
                            isSelected ? 'border-[1.5px]' : 'border'
                          }`}
                          style={{
                            width: '100%',
                            maxWidth: '160px',
                            height: '130px',
                            padding: '20px 12px',
                            borderRadius: '8px',
                            borderColor: isSelected ? '#000000' : '#E0E0E0',
                            background: '#FFFFFF',
                            transition: 'border-color 0.2s ease, border-width 0.2s ease'
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Vertically Stacked: Icon Above Text */}
                          <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
                            {/* Icon - 40x40px */}
                            <motion.div
                              className="flex-shrink-0"
                              animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <LanguageItemIcon language={language} />
                            </motion.div>

                            {/* Language Name - Centered */}
                            <div className="text-center">
                              <h4 
                                style={{
                                  fontSize: '15px',
                                  lineHeight: '20px',
                                  fontWeight: isSelected ? 500 : 400,
                                  color: '#1A1A1A'
                                }}
                              >
                                {language}
                              </h4>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Accessibility Features - Smart Accordion */}
      <motion.div
        ref={el => sectionRefs.current['accessibility'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden shadow-none border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => toggleSection('accessibility')}
            className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            style={{ borderBottom: '1px solid #EAEAEA' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-gray-700 dark:text-gray-300">
                  <AccessibilityIcon size={20} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                  Accessibility Features
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px', color: '#8C8C8C' }}>
                  {getSectionCount('accessibility')}/{accessibilityFeatures.length}
                </span>
                <motion.div
                  animate={{ rotate: expandedSection === 'accessibility' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" style={{ color: '#8C8C8C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'accessibility' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div style={{ padding: '20px' }}>
                  {/* Amenities-style Grid */}
                  <div className="grid grid-cols-2" style={{ gap: '18px 12px' }}>
                    {accessibilityFeatures.map((feature) => {
                      const isSelected = selectedAccessibility.includes(feature);
                      const isHovered = hoveredItem === feature;

                      return (
                        <motion.button
                          key={feature}
                          onClick={() => toggleItem(feature, selectedAccessibility, setSelectedAccessibility, 'accessibility')}
                          onMouseEnter={() => setHoveredItem(feature)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`relative ${
                            isSelected ? 'border-[1.5px]' : 'border'
                          }`}
                          style={{
                            width: '100%',
                            maxWidth: '160px',
                            height: '130px',
                            padding: '20px 12px',
                            borderRadius: '8px',
                            borderColor: isSelected ? '#000000' : '#E0E0E0',
                            background: '#FFFFFF',
                            transition: 'border-color 0.2s ease, border-width 0.2s ease'
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Vertically Stacked: Icon Above Text */}
                          <div className="flex flex-col items-center justify-center h-full" style={{ gap: '12px' }}>
                            {/* Icon - 40x40px */}
                            <motion.div
                              className="flex-shrink-0"
                              animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <AccessibilityItemIcon feature={feature} />
                            </motion.div>

                            {/* Feature Name - Centered */}
                            <div className="text-center">
                              <h4 
                                style={{
                                  fontSize: '15px',
                                  lineHeight: '20px',
                                  fontWeight: isSelected ? 500 : 400,
                                  color: '#1A1A1A'
                                }}
                              >
                                {feature}
                              </h4>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Continue Button - Hotel Manager Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="sticky bottom-0 bg-white dark:bg-gray-900 pt-6"
      >
        <Button
          onClick={handleContinue}
          className="w-full h-14 bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] hover:opacity-90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Continue to Photos
            <ArrowRight size={22} />
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
