import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Plus, X, Lightbulb, AlertCircle, Sparkles } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  HourglassIcon,
  CocktailIcon,
  CoffeeIcon,
  WifiIcon,
  DumbbellIcon,
  UpgradeIcon,
  getIconForHighlight,
} from '../../../../components/icons/packages/AnimatedHighlightIcons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../../components/ui/dialog';

interface HighlightsStepProps {
  onComplete: (data: { highlights: string[] }) => void;
  onUpdate: (data: { highlights: string[] }) => void;
  existingData?: { 
    highlights?: string[];
    packageType?: string;
  };
}

export function HighlightsStep({ onComplete, onUpdate, existingData }: HighlightsStepProps) {
  const [highlights, setHighlights] = useState<string[]>(existingData?.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');
  const [showImportancePopup, setShowImportancePopup] = useState(true);

  // Suggested highlights based on package type
  const getSuggestedHighlights = (packageType: string) => {
    const highlightMap: { [key: string]: string[] } = {
      weekend: [
        'Late checkout until 2 PM',
        'Welcome drink on arrival',
        'Complimentary breakfast',
        'Free Wi-Fi throughout stay',
        'Access to fitness center',
        'Room upgrade (subject to availability)',
        'Parking included',
        'Pool and spa access'
      ],
      romantic: [
        'Champagne and chocolate on arrival',
        'Rose petal turndown service',
        'Couples spa treatment discount',
        'Private candlelit dinner',
        'Late checkout privilege',
        'Romantic room decoration',
        'Breakfast in bed service',
        'Couples massage package'
      ],
      family: [
        'Kids eat free at restaurant',
        'Family game room access',
        'Cribs and high chairs available',
        'Children\'s activity program',
        'Swimming pool access',
        'Babysitting services available',
        'Family movie nights',
        'Kids welcome pack'
      ],
      business: [
        'Executive lounge access',
        'Meeting room credits',
        'Express laundry service',
        'Business center privileges',
        'Priority check-in/out',
        'Complimentary airport shuttle',
        'High-speed internet',
        'Workspace in room'
      ],
      adventure: [
        'Equipment rental included',
        'Professional guide services',
        'Adventure gear storage',
        'Trail maps and recommendations',
        'Post-activity refreshments',
        'Equipment cleaning service',
        'Packed lunch options',
        'First aid kit provided'
      ],
      culinary: [
        'Chef\'s tasting menu',
        'Wine pairing experience',
        'Cooking class session',
        'Market tour with chef',
        'Recipe cards to take home',
        'Private dining options',
        'Sommelier consultation',
        'Food photography session'
      ],
      wellness: [
        'Spa treatment credits',
        'Yoga class access',
        'Healthy meal options',
        'Meditation garden access',
        'Wellness consultation',
        'Detox juice bar credits',
        'Fitness classes included',
        'Aromatherapy amenities'
      ],
      luxury: [
        'Personal concierge service',
        'Premium room amenities',
        'Luxury car service',
        'VIP airport meet & greet',
        'Exclusive lounge access',
        'Butler service available',
        'Private chef option',
        'Helicopter transfer available'
      ]
    };

    return highlightMap[packageType] || highlightMap.weekend;
  };

  const suggestedHighlights = getSuggestedHighlights(existingData?.packageType || 'weekend');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHighlight, setCustomHighlight] = useState('');

  const addHighlight = (highlight: string) => {
    if (highlight.trim() && !highlights.includes(highlight.trim()) && highlights.length < 8) {
      const updatedHighlights = [...highlights, highlight.trim()];
      setHighlights(updatedHighlights);
      onUpdate({ highlights: updatedHighlights });
      setNewHighlight('');
    }
  };

  const addCustomHighlight = () => {
    if (customHighlight.trim() && highlights.length < 8) {
      addHighlight(customHighlight);
      setCustomHighlight('');
      setShowCustomInput(false);
    }
  };

  const removeHighlight = (index: number) => {
    const updatedHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(updatedHighlights);
    onUpdate({ highlights: updatedHighlights });
  };

  const [transformingItem, setTransformingItem] = useState<string | null>(null);

  const addSuggestedHighlight = (suggestion: string) => {
    setTransformingItem(suggestion);
    // Small delay to show transformation animation
    setTimeout(() => {
      addHighlight(suggestion);
      setTransformingItem(null);
    }, 400);
  };

  const handleContinue = () => {
    if (highlights.length >= 3) {
      onComplete({ highlights });
    }
  };

  return (
    <>
      {/* Airbnb-style Importance Popup */}
      <Dialog open={showImportancePopup} onOpenChange={setShowImportancePopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mx-auto mb-4 w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <DialogTitle className="text-center text-2xl">
              Key Highlights Matter!
            </DialogTitle>
            <div className="text-center text-base space-y-4 pt-4">
              <p className="text-gray-700">
                <strong>This is the core of your package.</strong> Highlights are what guests see first and influence their booking decision.
              </p>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-left">
                <p className="text-sm text-gray-600">✨ Boost visibility in search results</p>
                <p className="text-sm text-gray-600">💰 Increase booking conversion by 40%</p>
                <p className="text-sm text-gray-600">⭐ Stand out from competitors</p>
                <p className="text-sm text-gray-600">🎯 Attract your ideal guests</p>
              </div>
              <p className="text-gray-600 text-sm">
                Take time to select highlights that truly showcase your package's unique value!
              </p>
            </div>
          </DialogHeader>
          <Button
            onClick={() => setShowImportancePopup(false)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            Got it! Let's add highlights
          </Button>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto space-y-6 pb-32 px-4">
        {/* Header with Counter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-400" />
            <h1 className="text-xl text-gray-700">
              Package Highlights ({highlights.length}/8)
            </h1>
          </div>
          {highlights.length < 8 && (
            <button
              onClick={() => {/* scroll to suggestions */}}
              className="text-rose-600 text-sm hover:text-rose-700"
            >
              + Add {8 - highlights.length} more
            </button>
          )}
        </motion.div>

        {/* Add New Highlight Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 items-center"
        >
          <Input
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            placeholder="Add a highlight (e.g., Free Breakfast, Late checkout)"
            onKeyPress={(e) => e.key === 'Enter' && addHighlight(newHighlight)}
            maxLength={60}
            className="flex-1 h-14 text-base border-gray-300 focus:border-gray-400 transition-all bg-gray-50 rounded-xl px-4"
          />
          <Button
            onClick={() => addHighlight(newHighlight)}
            disabled={!newHighlight.trim() || highlights.length >= 8}
            className="h-14 w-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>

        {/* Current Highlights Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >

          {/* Selected Highlights - Large Colored Animated Icons Grid */}
          <AnimatePresence mode="popLayout">
            {highlights.length > 0 && (
              <motion.div 
                className="grid grid-cols-3 gap-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {highlights.map((highlight, index) => {
                  const IconComponent = getIconForHighlight(highlight);
                  return (
                    <motion.div
                      key={highlight}
                      layout
                      initial={{ 
                        opacity: 0, 
                        scale: 0.3,
                        y: 30,
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: 0,
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.5,
                        rotate: -10,
                        transition: { duration: 0.2 }
                      }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        delay: index * 0.08 
                      }}
                      className="group relative flex flex-col items-center"
                    >
                      {/* Large Colored Animated Icon */}
                      <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.15, rotate: 3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent className="w-24 h-24" colored={true} />
                        
                        {/* Remove Button - Top Right */}
                        <motion.button
                          onClick={() => removeHighlight(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                      
                      {/* Label Below Icon */}
                      <motion.p 
                        className="text-xs text-center text-gray-700 mt-3 px-2 leading-tight"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        {highlight.length > 25 ? highlight.substring(0, 25) + '...' : highlight}
                      </motion.p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Suggested Highlights - Clean Horizontal Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 pt-2"
        >
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {/* Suggestions first */}
              {suggestedHighlights
                .filter(suggestion => !highlights.includes(suggestion))
                .slice(0, 8)
                .map((suggestion, index) => {
                  const IconComponent = getIconForHighlight(suggestion);
                  const cannotAdd = highlights.length >= 8;
                  const isTransforming = transformingItem === suggestion;
                  
                  return (
                    <motion.button
                      key={suggestion}
                      layout
                      onClick={() => !isTransforming && addSuggestedHighlight(suggestion)}
                      disabled={cannotAdd || isTransforming}
                      className={`group w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        isTransforming 
                          ? 'bg-gray-100 border-gray-300' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: isTransforming ? 0.5 : 1, 
                        x: 0,
                        scale: isTransforming ? 0.95 : 1
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.9,
                        y: -20,
                        transition: { duration: 0.2 }
                      }}
                      transition={{ 
                        delay: 0.25 + index * 0.03,
                        scale: { duration: 0.2 }
                      }}
                      whileHover={!cannotAdd && !isTransforming ? { x: 2 } : {}}
                      whileTap={!cannotAdd && !isTransforming ? { scale: 0.98 } : {}}
                    >
                      {/* Animated SVG Icon */}
                      <motion.div 
                        className="flex-shrink-0 text-gray-500"
                        animate={isTransforming ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <IconComponent className="w-8 h-8" />
                      </motion.div>
                      
                      {/* Text */}
                      <span className="flex-1 text-base text-gray-700 group-hover:text-gray-900">
                        {suggestion}
                      </span>
                      
                      {/* Plus Button with Rotation Animation */}
                      <motion.div 
                        className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-colors"
                        animate={isTransforming ? {
                          rotate: 90,
                          scale: 0.8,
                          opacity: 0.5
                        } : {
                          rotate: 0,
                          scale: 1,
                          opacity: 1
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                      </motion.div>
                    </motion.button>
                  );
                })}
              
              {/* Custom Highlight Option - At Bottom */}
              {!showCustomInput && highlights.length < 8 && (
                <motion.button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 text-left transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-base text-gray-700">
                    Add Custom Highlight
                  </span>
                  <div className="flex-shrink-0 text-gray-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </motion.button>
              )}

              {/* Custom Input Field */}
              {showCustomInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-300"
                >
                  <Input
                    value={customHighlight}
                    onChange={(e) => setCustomHighlight(e.target.value)}
                    placeholder="Enter your custom highlight..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomHighlight()}
                    maxLength={60}
                    className="flex-1 border-gray-300 focus:border-gray-400"
                    autoFocus
                  />
                  <Button
                    onClick={addCustomHighlight}
                    disabled={!customHighlight.trim()}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomHighlight('');
                    }}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>



        {/* Minimum Requirements Warning */}
        <AnimatePresence>
          {highlights.length > 0 && highlights.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-900">
                    <strong>Almost there!</strong> Add {3 - highlights.length} more {highlights.length === 2 ? 'highlight' : 'highlights'} to continue.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Packages with more highlights get 40% more bookings.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest Preview Section - TRAVELER COLORS */}
        {highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 space-y-4"
          >
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="text-lg">Guest Preview</h3>
            </div>

            <motion.div
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Preview Header - TRAVELER ROSE COLOR */}
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4">
                <p className="text-white text-xs uppercase tracking-wider opacity-90">
                  How travelers will see your package
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Package Title & Description */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h2 className="text-2xl text-gray-900">
                      {existingData?.packageTitle || 'Your Package Title'}
                    </h2>
                    <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs">
                      {existingData?.packageType?.charAt(0).toUpperCase() + existingData?.packageType?.slice(1) || 'Weekend'}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    {existingData?.description || 'Your package description will appear here. Add a compelling description to attract more guests!'}
                  </p>
                </div>

                {/* Highlights Section */}
                <div className="space-y-4">
                  <h3 className="text-lg text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-rose-500 fill-rose-500" />
                    What's Included
                  </h3>

                  {/* Highlights List - Traveler View (1 per row) */}
                  <div className="space-y-2">
                    {highlights.map((highlight, index) => {
                      const IconComponent = getIconForHighlight(highlight);
                      return (
                        <motion.div
                          key={highlight}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <IconComponent className="w-6 h-6" colored={true} />
                          </div>
                          <span className="text-sm text-gray-700 leading-snug">
                            {highlight}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA Preview - TRAVELER ROSE GRADIENT */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4 border-t border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Starting from</p>
                      <p className="text-2xl text-gray-900">
                        ${existingData?.price || '---'}
                        <span className="text-sm text-gray-500">/person</span>
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-[#FF385C] to-[#FF6B9D] text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all">
                      Book Now
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Preview Tips - ROSE COLOR */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-rose-50 border border-rose-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-rose-800">
                  <p className="mb-1">
                    <strong>Pro Tip:</strong> Travelers see your highlights with animated icons!
                  </p>
                  <p className="text-xs text-rose-700">
                    Each highlight appears as a beautiful colored icon making your package stand out from competitors.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
