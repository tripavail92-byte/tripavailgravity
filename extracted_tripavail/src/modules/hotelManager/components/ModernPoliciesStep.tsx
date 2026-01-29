import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { getPremiumPolicyIcon } from '../../../components/icons/policies/PremiumPolicyIcons';
import { IOSTimeRollerPicker } from '../../../components/pickers/IOSTimeRollerPicker';

interface PoliciesData {
  checkIn: string;
  checkOut: string;
  cancellationPolicy: string;
  houseRules: string[];
  childrenPolicy: string;
  petPolicy: string;
  smokingPolicy: string;
}

interface ModernPoliciesStepProps {
  onComplete: (data: any) => void;
  existingData?: any;
  onUpdate?: (data: any) => void;
}

export function ModernPoliciesStep({ onComplete, existingData, onUpdate }: ModernPoliciesStepProps) {
  const [formData, setFormData] = useState<PoliciesData>({
    checkIn: existingData?.checkIn || '',
    checkOut: existingData?.checkOut || '',
    cancellationPolicy: existingData?.cancellationPolicy || '',
    houseRules: existingData?.houseRules || [],
    childrenPolicy: existingData?.childrenPolicy || '',
    petPolicy: existingData?.petPolicy || '',
    smokingPolicy: existingData?.smokingPolicy || ''
  });

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [hoveredPolicy, setHoveredPolicy] = useState<string | null>(null);
  
  // References for auto-scroll functionality
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const cancellationPolicies = [
    { id: 'flexible', name: 'Flexible', description: 'Full refund 1 day prior to arrival' },
    { id: 'moderate', name: 'Moderate', description: 'Full refund 5 days prior to arrival' },
    { id: 'strict', name: 'Strict', description: 'Full refund 14 days prior to arrival' },
    { id: 'super-strict', name: 'Super Strict', description: 'Non-refundable' }
  ];

  const commonHouseRules = [
    'No smoking in rooms',
    'No parties or events',
    'Quiet hours 10 PM - 7 AM',
    'No pets allowed',
    'Check-in ID required',
    'Maximum occupancy strictly enforced',
    'No outside guests after 10 PM',
    'Respect other guests'
  ];

  const childrenPolicies = [
    'Children of all ages welcome',
    'Children under 12 stay free',
    'Children under 6 stay free',
    'Adult-only property',
    'Supervised children only'
  ];

  const petPolicies = [
    'Pets not allowed',
    'Pets allowed with additional fee',
    'Small pets only (under 10kg)',
    'Service animals only',
    'Pets allowed - no fee'
  ];

  const smokingPolicies = [
    'Non-smoking property',
    'Designated smoking areas only',
    'Smoking allowed in some rooms',
    'Outdoor smoking only'
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev.includes(section);
      
      // If clicking the currently open section, close it
      if (isCurrentlyExpanded) {
        return [];
      }
      
      // Otherwise, close all others and open this one
      // Auto-scroll to the section after a short delay to let expansion animation start
      setTimeout(() => {
        const element = sectionRefs.current[section];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      
      return [section];
    });
  };

  const toggleHouseRule = (rule: string) => {
    const newRules = formData.houseRules.includes(rule)
      ? formData.houseRules.filter(r => r !== rule)
      : [...formData.houseRules, rule];
    
    const newData = { ...formData, houseRules: newRules };
    setFormData(newData);
    if (onUpdate) onUpdate(newData);
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (onUpdate) onUpdate(newData);
  };

  const getSectionCount = (section: string) => {
    switch (section) {
      case 'cancellation':
        return formData.cancellationPolicy ? 1 : 0;
      case 'house-rules':
        return formData.houseRules.length;
      case 'children':
        return formData.childrenPolicy ? 1 : 0;
      case 'pets':
        return formData.petPolicy ? 1 : 0;
      case 'smoking':
        return formData.smokingPolicy ? 1 : 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Set your property policies to ensure smooth operations
        </p>
      </motion.div>

      {/* Check-in/Check-out Times Card */}
      <motion.div
        ref={(el) => sectionRefs.current['check-in-out'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div 
          className="rounded-2xl p-6 transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-5 min-h-[64px]">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('check-in-out');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  Check-in & Check-out Times
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.checkIn && formData.checkOut ? `${formData.checkIn} - ${formData.checkOut}` : 'Set arrival & departure times'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.checkIn && formData.checkOut && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block font-medium mb-3 text-gray-700 dark:text-gray-300">
                Check-in Time *
              </label>
              <IOSTimeRollerPicker
                value={formData.checkIn}
                onChange={(time) => handleInputChange('checkIn', time)}
                label="Select Check-in Time"
                isCheckIn={true}
              />
            </div>
            <div>
              <label className="block font-medium mb-3 text-gray-700 dark:text-gray-300">
                Check-out Time *
              </label>
              <IOSTimeRollerPicker
                value={formData.checkOut}
                onChange={(time) => handleInputChange('checkOut', time)}
                label="Select Check-out Time"
                isCheckIn={false}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cancellation Policy */}
      <motion.div
        ref={(el) => sectionRefs.current['cancellation'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div 
          className="rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleSection('cancellation')}
            className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('cancellation');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  Cancellation Policy
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.cancellationPolicy ? 'Refund terms configured' : 'Set cancellation & refund terms'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.cancellationPolicy && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
              <motion.div
                animate={{ rotate: expandedSections.includes('cancellation') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.includes('cancellation') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {cancellationPolicies.map((policy) => (
                    <button
                      key={policy.id}
                      onClick={() => handleInputChange('cancellationPolicy', policy.id)}
                      className="w-full p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {policy.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {policy.description}
                          </p>
                        </div>
                        {formData.cancellationPolicy === policy.id && (
                          <Check size={18} className="text-black dark:text-white ml-3 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* House Rules */}
      <motion.div
        ref={(el) => sectionRefs.current['house-rules'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div 
          className="rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleSection('house-rules')}
            className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('house-rules');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  House Rules
                </h3>
                {formData.houseRules.length > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formData.houseRules.length} rule{formData.houseRules.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.houseRules.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
              <motion.div
                animate={{ rotate: expandedSections.includes('house-rules') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.includes('house-rules') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commonHouseRules.map((rule) => (
                    <button
                      key={rule}
                      onClick={() => toggleHouseRule(rule)}
                      className="p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[56px] flex items-center"
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {rule}
                        </span>
                        {formData.houseRules.includes(rule) && (
                          <Check size={18} className="text-black dark:text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Children Policy */}
      <motion.div
        ref={(el) => sectionRefs.current['children'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div 
          className="rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleSection('children')}
            className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('children');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  Children Policy
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.childrenPolicy ? 'Age restrictions & policies set' : 'Define age restrictions & policies'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.childrenPolicy && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
              <motion.div
                animate={{ rotate: expandedSections.includes('children') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.includes('children') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {childrenPolicies.map((policy) => (
                    <button
                      key={policy}
                      onClick={() => handleInputChange('childrenPolicy', policy)}
                      className="w-full p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[56px] flex items-center"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {policy}
                        </span>
                        {formData.childrenPolicy === policy && (
                          <Check size={18} className="text-black dark:text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Pet Policy */}
      <motion.div
        ref={(el) => sectionRefs.current['pets'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div 
          className="rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleSection('pets')}
            className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('pets');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  Pet Policy
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.petPolicy ? 'Pet rules & fees configured' : 'Set pet allowance & fees'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.petPolicy && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
              <motion.div
                animate={{ rotate: expandedSections.includes('pets') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.includes('pets') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {petPolicies.map((policy) => (
                    <button
                      key={policy}
                      onClick={() => handleInputChange('petPolicy', policy)}
                      className="w-full p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[56px] flex items-center"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {policy}
                        </span>
                        {formData.petPolicy === policy && (
                          <Check size={18} className="text-black dark:text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Smoking Policy */}
      <motion.div
        ref={(el) => sectionRefs.current['smoking'] = el}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div 
          className="rounded-2xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => toggleSection('smoking')}
            className="w-full px-6 py-5 text-left flex items-center justify-between min-h-[64px]"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700"
              >
                {(() => {
                  const IconComponent = getPremiumPolicyIcon('smoking');
                  return (
                    <IconComponent
                      isSelected={true}
                      isHovered={false}
                      size={26}
                    />
                  );
                })()}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                  Smoking Policy
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formData.smokingPolicy ? 'Smoking rules established' : 'Define smoking restrictions'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.smokingPolicy && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-black dark:bg-white flex items-center justify-center"
                >
                  <Check size={18} className="text-white dark:text-black" />
                </motion.div>
              )}
              <motion.div
                animate={{ rotate: expandedSections.includes('smoking') ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.includes('smoking') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-3">
                  {smokingPolicies.map((policy) => (
                    <button
                      key={policy}
                      onClick={() => handleInputChange('smokingPolicy', policy)}
                      className="w-full p-4 rounded-xl text-left transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[56px] flex items-center"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {policy}
                        </span>
                        {formData.smokingPolicy === policy && (
                          <Check size={18} className="text-black dark:text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
