import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Plus, X, Lightbulb, AlertCircle, Sparkles, Gift, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Slider } from '../../../../components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';
import {
  HourglassIcon,
  CocktailIcon,
  CoffeeIcon,
  WifiIcon,
  DumbbellIcon,
  UpgradeIcon,
  PoolIcon,
  getIconForHighlight,
} from '../../../../components/icons/packages/AnimatedHighlightIcons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../../components/ui/dialog';

interface FreeInclusion {
  name: string;
  icon?: string;
}

interface DiscountOffer {
  name: string;
  originalPrice: number;
  discount: number;
  icon?: string;
}

interface HighlightsStepMergedProps {
  onComplete: (data: { 
    freeInclusions: FreeInclusion[];
    discountOffers: DiscountOffer[];
  }) => void;
  onUpdate: (data: { 
    freeInclusions: FreeInclusion[];
    discountOffers: DiscountOffer[];
  }) => void;
  existingData?: { 
    freeInclusions?: FreeInclusion[];
    discountOffers?: DiscountOffer[];
    packageType?: string;
    title?: string;
    fullDescription?: string;
    basePrice?: number;
  };
}

export function HighlightsStepMerged({ onComplete, onUpdate, existingData }: HighlightsStepMergedProps) {
  const [freeInclusions, setFreeInclusions] = useState<FreeInclusion[]>(existingData?.freeInclusions || []);
  const [discountOffers, setDiscountOffers] = useState<DiscountOffer[]>(existingData?.discountOffers || []);
  
  const [newFreeName, setNewFreeName] = useState('');
  
  // Discount Dialog States
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountDialogData, setDiscountDialogData] = useState({
    name: '',
    originalPrice: 0,
    discount: 10
  });
  
  const [showImportancePopup, setShowImportancePopup] = useState(true);
  const [freeOpen, setFreeOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(false);

  // Smart accordion - when one opens, close the other
  const handleFreeOpenChange = (open: boolean) => {
    setFreeOpen(open);
    if (open) setDiscountOpen(false);
  };

  const handleDiscountOpenChange = (open: boolean) => {
    setDiscountOpen(open);
    if (open) setFreeOpen(false);
  };

  // Suggested free inclusions - universal options with clear usage details
  const getSuggestedFreeInclusions = (packageType: string): string[] => {
    return [
      'Breakfast for 2 (daily) — restaurant buffet or set menu',
      'Late checkout to 3:00 PM — subject to availability; 1× per stay',
      'Early check-in from 12:00 PM — subject to availability; 1× per stay',
      'Welcome drink on arrival for 2 — 1× per guest',
      'High-speed Wi-Fi',
      'Spa wet-area access — sauna/steam/Jacuzzi, once per day',
      'Romantic room setup — rose petals + towel art, 1st night only',
      'In-room coffee/tea + two waters (daily)',
      'Complimentary parking — for duration of stay',
      'Pool / rooftop lounge access — standard hours'
    ];
  };

  // Suggested discount offers with prices
  const getSuggestedDiscounts = (packageType: string): Array<{name: string, originalPrice: number, discount: number}> => {
    const discountMap: { [key: string]: Array<{name: string, originalPrice: number, discount: number}> } = {
      weekend: [
        { name: 'Spa treatments', originalPrice: 100, discount: 20 },
        { name: 'Restaurant dining', originalPrice: 60, discount: 15 },
        { name: 'In-room dining', originalPrice: 45, discount: 10 },
        { name: 'Laundry service', originalPrice: 40, discount: 10 },
        { name: 'Extra night extension', originalPrice: 150, discount: 25 }
      ],
      romantic: [
        { name: 'Couples massage', originalPrice: 200, discount: 30 },
        { name: 'Photography session', originalPrice: 150, discount: 25 },
        { name: 'Premium wine selection', originalPrice: 80, discount: 20 },
        { name: 'Private dining upgrade', originalPrice: 120, discount: 35 },
        { name: 'Flower arrangements', originalPrice: 60, discount: 15 }
      ],
      family: [
        { name: 'Babysitting services', originalPrice: 50, discount: 20 },
        { name: 'Theme park tickets', originalPrice: 80, discount: 15 },
        { name: 'Kids activities extra', originalPrice: 40, discount: 25 },
        { name: 'Family photography', originalPrice: 120, discount: 30 },
        { name: 'Extra bed/crib', originalPrice: 30, discount: 50 }
      ],
      business: [
        { name: 'Extended meeting room', originalPrice: 100, discount: 25 },
        { name: 'Secretarial services', originalPrice: 80, discount: 20 },
        { name: 'Business printing', originalPrice: 30, discount: 15 },
        { name: 'Video conferencing', originalPrice: 70, discount: 30 },
        { name: 'Translation services', originalPrice: 150, discount: 25 }
      ],
      adventure: [
        { name: 'Adventure photography', originalPrice: 120, discount: 30 },
        { name: 'Equipment insurance', originalPrice: 50, discount: 50 },
        { name: 'Additional guides', originalPrice: 100, discount: 20 },
        { name: 'Gear upgrades', originalPrice: 80, discount: 25 },
        { name: 'Extra excursions', originalPrice: 150, discount: 15 }
      ],
      culinary: [
        { name: 'Premium wine selection', originalPrice: 100, discount: 25 },
        { name: 'Private chef service', originalPrice: 300, discount: 35 },
        { name: 'Additional courses', originalPrice: 75, discount: 20 },
        { name: 'Cooking equipment', originalPrice: 50, discount: 30 },
        { name: 'Food delivery', originalPrice: 40, discount: 15 }
      ],
      wellness: [
        { name: 'Additional spa services', originalPrice: 120, discount: 25 },
        { name: 'Personal trainer session', originalPrice: 90, discount: 30 },
        { name: 'Wellness products', originalPrice: 60, discount: 20 },
        { name: 'Nutrition consultation', originalPrice: 100, discount: 35 },
        { name: 'Extended treatments', originalPrice: 150, discount: 15 }
      ],
      luxury: [
        { name: 'Luxury car service', originalPrice: 300, discount: 40 },
        { name: 'Private dining chef', originalPrice: 400, discount: 30 },
        { name: 'Premium experiences', originalPrice: 500, discount: 25 },
        { name: 'Personal shopper', originalPrice: 200, discount: 35 },
        { name: 'Yacht rental', originalPrice: 1000, discount: 20 }
      ]
    };

    return discountMap[packageType] || discountMap.weekend;
  };

  // Get smart default price based on service name
  const getDefaultPrice = (serviceName: string): number => {
    const priceMap: { [key: string]: number } = {
      'spa': 100,
      'massage': 150,
      'restaurant': 60,
      'dining': 50,
      'laundry': 40,
      'room service': 35,
      'photography': 150,
      'photo': 150,
      'wine': 80,
      'transfer': 100,
      'car': 120,
      'meeting': 100,
      'guide': 100,
      'equipment': 80,
      'ticket': 80,
      'babysit': 50,
      'bed': 30,
      'crib': 30
    };
    
    const key = Object.keys(priceMap).find(k => 
      serviceName.toLowerCase().includes(k)
    );
    
    return key ? priceMap[key] : 50; // Default $50
  };

  const suggestedFree = getSuggestedFreeInclusions(existingData?.packageType || 'weekend');
  const suggestedDiscounts = getSuggestedDiscounts(existingData?.packageType || 'weekend');

  const addFreeInclusion = (name: string) => {
    if (name.trim() && !freeInclusions.some(item => item.name === name.trim())) {
      const updated = [...freeInclusions, { name: name.trim() }];
      setFreeInclusions(updated);
      onUpdate({ freeInclusions: updated, discountOffers });
      setNewFreeName('');
    }
  };

  const removeFreeInclusion = (index: number) => {
    const updated = freeInclusions.filter((_, i) => i !== index);
    setFreeInclusions(updated);
    onUpdate({ freeInclusions: updated, discountOffers });
  };

  // Open discount dialog with data
  const openDiscountDialog = (name: string = '', originalPrice: number = 0, discount: number = 10) => {
    setDiscountDialogData({
      name,
      originalPrice: originalPrice || getDefaultPrice(name),
      discount
    });
    setShowDiscountDialog(true);
  };

  // Add discount offer from dialog
  const addDiscountOfferFromDialog = () => {
    const { name, originalPrice, discount } = discountDialogData;
    
    if (!name.trim()) return;
    if (originalPrice <= 0) return;
    if (discountOffers.some(item => item.name === name.trim())) return;
    
    const updated = [...discountOffers, { 
      name: name.trim(), 
      originalPrice,
      discount 
    }];
    setDiscountOffers(updated);
    onUpdate({ freeInclusions, discountOffers: updated });
    
    // Reset and close
    setShowDiscountDialog(false);
    setDiscountDialogData({ name: '', originalPrice: 0, discount: 10 });
  };

  const removeDiscountOffer = (index: number) => {
    const updated = discountOffers.filter((_, i) => i !== index);
    setDiscountOffers(updated);
    onUpdate({ freeInclusions, discountOffers: updated });
  };

  const updateDiscountOffer = (index: number, updatedOffer: Partial<DiscountOffer>) => {
    const updated = discountOffers.map((item, i) => 
      i === index ? { ...item, ...updatedOffer } : item
    );
    setDiscountOffers(updated);
    onUpdate({ freeInclusions, discountOffers: updated });
  };

  const handleContinue = () => {
    if (freeInclusions.length >= 3) {
      onComplete({ freeInclusions, discountOffers });
    }
  };

  // Get top highlights (first 8 items with good icons)
  const topHighlights = freeInclusions.slice(0, 8);
  const additionalInclusions = freeInclusions.slice(8);

  return (
    <>
      {/* Importance Popup */}
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
              Package Value Matters!
            </DialogTitle>
            <DialogDescription className="sr-only">
              Learn how to add value to your package with free inclusions and exclusive discounts
            </DialogDescription>
            <div className="text-center text-base space-y-4 pt-4">
              <p className="text-gray-700">
                <strong>Show travelers the complete value.</strong> Free inclusions and discounts make your package irresistible!
              </p>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-left">
                <p className="text-sm text-gray-600">✨ Highlight what's included for free</p>
                <p className="text-sm text-gray-600">💰 Show exclusive discount offers</p>
                <p className="text-sm text-gray-600">⭐ Stand out from competitors</p>
                <p className="text-sm text-gray-600">🎯 Increase booking conversion</p>
              </div>
              <p className="text-gray-600 text-sm">
                The more value you show, the more bookings you'll get!
              </p>
            </div>
          </DialogHeader>
          <Button
            onClick={() => setShowImportancePopup(false)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            Got it! Let's add value
          </Button>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto space-y-6 pb-32 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-400" />
            <h1 className="text-xl text-gray-700">
              Package Highlights
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {freeInclusions.length} free • {discountOffers.length} offers
          </div>
        </motion.div>

        {/* FREE INCLUSIONS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Collapsible open={freeOpen} onOpenChange={handleFreeOpenChange}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base text-gray-900">Free Inclusions</h3>
                      <p className="text-xs text-gray-500">{freeInclusions.length} items included</p>
                    </div>
                  </div>
                  {freeOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-4">
                  {/* Add Custom Free Inclusion Button */}
                  <Button
                    onClick={() => {
                      // Scroll to input or expand a dialog if needed
                      document.getElementById('free-inclusion-input')?.focus();
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Custom Free Inclusion
                  </Button>

                  {/* Current Free Inclusions */}
                  {freeInclusions.length > 0 && (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {freeInclusions.map((item, index) => {
                          const IconComponent = getIconForHighlight(item.name);
                          return (
                            <motion.div
                              key={item.name}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl border border-purple-200 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <IconComponent className="w-8 h-8" colored={true} />
                                  <p className="text-sm text-gray-900">{item.name}</p>
                                </div>
                                <button
                                  onClick={() => removeFreeInclusion(index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Add New Free Inclusion Input */}
                  <div className="flex gap-2">
                    <Input
                      id="free-inclusion-input"
                      value={newFreeName}
                      onChange={(e) => setNewFreeName(e.target.value)}
                      placeholder="Add free inclusion (e.g., Late checkout)"
                      onKeyPress={(e) => e.key === 'Enter' && addFreeInclusion(newFreeName)}
                      maxLength={60}
                      className="flex-1 border-gray-300 focus:border-gray-400 bg-gray-50"
                    />
                    <Button
                      onClick={() => addFreeInclusion(newFreeName)}
                      disabled={!newFreeName.trim()}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Popular free inclusions:</p>
                    <div className="space-y-2">
                      {suggestedFree
                        .filter(suggestion => !freeInclusions.some(item => item.name === suggestion))
                        .slice(0, 10)
                        .map((suggestion, index) => {
                          const IconComponent = getIconForHighlight(suggestion);
                          return (
                            <motion.button
                              key={suggestion}
                              onClick={() => addFreeInclusion(suggestion)}
                              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 text-left transition-all"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ x: 2 }}
                            >
                              <IconComponent className="w-6 h-6" colored={true} />
                              <span className="flex-1 text-sm text-gray-700">{suggestion}</span>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>

        {/* DISCOUNT OFFERS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Collapsible open={discountOpen} onOpenChange={handleDiscountOpenChange}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base text-gray-900">Exclusive Discounts</h3>
                      <p className="text-xs text-gray-500">{discountOffers.length} special offers</p>
                    </div>
                  </div>
                  {discountOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-4">
                  {/* Add New Discount Button */}
                  <Button
                    onClick={() => openDiscountDialog()}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Custom Discount Offer
                  </Button>

                  {/* Current Discount Offers */}
                  {discountOffers.length > 0 && (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {discountOffers.map((offer, index) => {
                          const finalPrice = offer.originalPrice - (offer.originalPrice * offer.discount / 100);
                          const savings = offer.originalPrice * offer.discount / 100;
                          
                          return (
                            <motion.div
                              key={offer.name}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl border border-purple-200 shadow-sm"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                                    <Percent className="w-4 h-4 text-white" />
                                  </div>
                                  <p className="text-sm text-gray-900">{offer.name}</p>
                                </div>
                                <button
                                  onClick={() => removeDiscountOffer(index)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="line-through text-gray-400 text-sm">
                                      ${offer.originalPrice}
                                    </span>
                                    <span className="text-lg text-gray-900">
                                      ${finalPrice.toFixed(0)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-green-700">
                                    Save ${savings.toFixed(0)} ({offer.discount}% OFF)
                                  </p>
                                </div>
                                
                                <Button
                                  onClick={() => openDiscountDialog(offer.name, offer.originalPrice, offer.discount)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                  Edit
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Discount Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Popular discount offers:</p>
                    <div className="space-y-2">
                      {suggestedDiscounts
                        .filter(suggestion => !discountOffers.some(item => item.name === suggestion.name))
                        .slice(0, 4)
                        .map((suggestion, index) => {
                          const finalPrice = suggestion.originalPrice - (suggestion.originalPrice * suggestion.discount / 100);
                          return (
                            <motion.button
                              key={suggestion.name}
                              onClick={() => openDiscountDialog(suggestion.name, suggestion.originalPrice, suggestion.discount)}
                              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 text-left transition-all"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ x: 2 }}
                            >
                              <Percent className="w-5 h-5 text-gray-900" />
                              <div className="flex-1">
                                <span className="text-sm text-gray-900 block">{suggestion.name}</span>
                                <span className="text-xs text-gray-600">
                                  ${suggestion.originalPrice} → ${finalPrice.toFixed(0)} ({suggestion.discount}% OFF)
                                </span>
                              </div>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>

        {/* Minimum Requirements Warning */}
        <AnimatePresence>
          {freeInclusions.length > 0 && freeInclusions.length < 3 && (
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
                    <strong>Almost there!</strong> Add {3 - freeInclusions.length} more {freeInclusions.length === 2 ? 'inclusion' : 'inclusions'} to continue.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Packages with more free inclusions get 60% more bookings.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest Preview Section - TRAVELER COLORS */}
        {freeInclusions.length > 0 && (
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
                      {existingData?.title || 'Your Package Title'}
                    </h2>
                    <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs">
                      {existingData?.packageType?.charAt(0).toUpperCase() + existingData?.packageType?.slice(1) || 'Weekend'}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    {existingData?.fullDescription || 'Your package description will appear here.'}
                  </p>
                </div>

                {/* Top Highlights Section */}
                <div className="space-y-4">
                  <h3 className="text-lg text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-rose-500 fill-rose-500" />
                    What's Included
                  </h3>

                  {/* Top Highlights */}
                  <div className="space-y-2">
                    {topHighlights.map((item, index) => {
                      const IconComponent = getIconForHighlight(item.name);
                      return (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <IconComponent className="w-6 h-6" colored={true} />
                          </div>
                          <span className="text-sm text-gray-700 leading-snug">
                            {item.name}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Additional Inclusions */}
                  {additionalInclusions.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-rose-500" />
                        Additional Free Items
                      </h4>
                      <div className="space-y-1">
                        {additionalInclusions.map((item) => (
                          <p key={item.name} className="text-xs text-gray-600 pl-6">
                            • {item.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discount Offers */}
                  {discountOffers.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-rose-500" />
                        Special Offers
                      </h4>
                      <div className="space-y-2">
                        {discountOffers.map((offer) => {
                          const finalPrice = offer.originalPrice - (offer.originalPrice * offer.discount / 100);
                          return (
                            <div key={offer.name} className="flex items-center justify-between px-6 py-2 bg-rose-50 rounded-lg">
                              <span className="text-xs text-gray-700">• {offer.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-gray-400 text-xs">
                                  ${offer.originalPrice}
                                </span>
                                <span className="text-sm text-rose-600">
                                  ${finalPrice.toFixed(0)}
                                </span>
                                <span className="text-xs text-rose-600">
                                  ({offer.discount}% OFF)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                        ${existingData?.basePrice || '---'}
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
                    <strong>Pro Tip:</strong> Top 8 free items appear with animated icons!
                  </p>
                  <p className="text-xs text-rose-700">
                    Additional items and discounts are clearly listed to show complete package value.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}


      </div>

      {/* DISCOUNT OFFER DIALOG - CLEAN POPUP */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <Percent className="w-8 h-8 text-white" />
            </motion.div>
            <DialogTitle className="text-center text-2xl bg-gradient-to-r from-[#9D4EDD] to-[#00D4FF] bg-clip-text text-transparent">
              Add Discount Offer
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a discounted service to your package by entering the service name, original price, and discount percentage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Service Name */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Service Name</label>
              <Input
                value={discountDialogData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setDiscountDialogData({
                    ...discountDialogData,
                    name,
                    originalPrice: discountDialogData.originalPrice || getDefaultPrice(name)
                  });
                }}
                placeholder="e.g., Spa treatments"
                maxLength={60}
                className="border-gray-300 focus:border-[#9D4EDD] focus:ring-[#9D4EDD]/20"
              />
            </div>

            {/* Original Price */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Original Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  value={discountDialogData.originalPrice || ''}
                  onChange={(e) => setDiscountDialogData({
                    ...discountDialogData,
                    originalPrice: Number(e.target.value)
                  })}
                  placeholder="100"
                  className="pl-8 border-gray-300 focus:border-[#9D4EDD] focus:ring-[#9D4EDD]/20"
                  min={1}
                />
              </div>
              <p className="text-xs text-gray-500">
                The regular price guests would normally pay
              </p>
            </div>

            {/* Discount Percentage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Discount</label>
                <span className="text-2xl text-gray-900">
                  {discountDialogData.discount}%
                </span>
              </div>
              <div className="relative py-2">
                <Slider
                  value={[discountDialogData.discount]}
                  onValueChange={(value) => setDiscountDialogData({
                    ...discountDialogData,
                    discount: value[0]
                  })}
                  max={50}
                  min={5}
                  step={5}
                  className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-[#9D4EDD] [&_[data-slot=slider-range]]:to-[#00D4FF] [&_[data-slot=slider-thumb]]:border-[#9D4EDD] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:shadow-purple-500/30"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>5%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Price Calculation Preview */}
            {discountDialogData.originalPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Original Price:</span>
                  <span className="line-through text-gray-400">
                    ${discountDialogData.originalPrice}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Discount ({discountDialogData.discount}%):</span>
                  <span className="text-red-600">
                    -${(discountDialogData.originalPrice * discountDialogData.discount / 100).toFixed(0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-300 flex items-center justify-between">
                  <span className="text-base text-gray-900">Guest Pays:</span>
                  <span className="text-2xl text-gray-900">
                    ${(discountDialogData.originalPrice - (discountDialogData.originalPrice * discountDialogData.discount / 100)).toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-2 text-center">
                  💰 Guests save ${(discountDialogData.originalPrice * discountDialogData.discount / 100).toFixed(0)} per booking!
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowDiscountDialog(false);
                  setDiscountDialogData({ name: '', originalPrice: 0, discount: 10 });
                }}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={addDiscountOfferFromDialog}
                disabled={!discountDialogData.name.trim() || discountDialogData.originalPrice <= 0}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
              >
                Add Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
