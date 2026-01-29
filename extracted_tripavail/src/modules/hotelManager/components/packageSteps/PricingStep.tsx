import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingUp, Calculator, Tag, Zap } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Slider } from '../../../../components/ui/slider';

interface PricingStepProps {
  onComplete: (data: { basePrice: number; totalPrice: number; discountPercentage?: number }) => void;
  onUpdate: (data: { basePrice?: number; totalPrice?: number; discountPercentage?: number }) => void;
  existingData?: { 
    basePrice?: number; 
    totalPrice?: number;
    discountPercentage?: number;
    packageType?: string;
    freeInclusions?: Array<{ name: string; icon?: string }>;
    discountOffers?: Array<{ name: string; discount: number; icon?: string }>;
  };
}

export function PricingStep({ onComplete, onUpdate, existingData }: PricingStepProps) {
  const [basePrice, setBasePrice] = useState(existingData?.basePrice || 199);
  const [discountPercentage, setDiscountPercentage] = useState(existingData?.discountPercentage || 0);
  const [showDiscount, setShowDiscount] = useState(existingData?.discountPercentage ? existingData.discountPercentage > 0 : false);

  // Calculate total price based on base price and discount
  const totalPrice = basePrice - (basePrice * discountPercentage / 100);

  // Suggested pricing based on package type
  const getSuggestedPricing = (packageType: string) => {
    const pricingMap: { [key: string]: { min: number; max: number; recommended: number } } = {
      weekend: { min: 149, max: 299, recommended: 199 },
      romantic: { min: 249, max: 449, recommended: 329 },
      family: { min: 179, max: 399, recommended: 249 },
      business: { min: 199, max: 349, recommended: 259 },
      adventure: { min: 229, max: 449, recommended: 299 },
      culinary: { min: 269, max: 549, recommended: 379 },
      wellness: { min: 299, max: 599, recommended: 429 },
      luxury: { min: 499, max: 1299, recommended: 799 }
    };

    return pricingMap[packageType] || pricingMap.weekend;
  };

  const suggestedPricing = getSuggestedPricing(existingData?.packageType || 'weekend');

  // Calculate estimated value based on free inclusions
  const calculateInclusionsValue = () => {
    const inclusions = existingData?.freeInclusions || [];
    return inclusions.reduce((total, inclusion) => {
      // Estimate value of free inclusions
      const inclusionValues: { [key: string]: number } = {
        'breakfast': 25,
        'spa': 50,
        'massage': 80,
        'dining': 35,
        'room service': 30,
        'upgrade': 45,
        'transfer': 40,
        'welcome drink': 15,
        'late checkout': 25,
        'wifi': 10,
        'parking': 15,
        'pool': 20,
        'fitness': 15
      };
      
      const inclusionKey = Object.keys(inclusionValues).find(key => 
        inclusion.name.toLowerCase().includes(key)
      );
      return total + (inclusionKey ? inclusionValues[inclusionKey] : 20);
    }, 0);
  };

  const estimatedInclusionsValue = calculateInclusionsValue();

  useEffect(() => {
    onUpdate({ basePrice, totalPrice, discountPercentage: showDiscount ? discountPercentage : 0 });
  }, [basePrice, discountPercentage, showDiscount, totalPrice, onUpdate]);

  const handleBasePriceChange = (value: number) => {
    setBasePrice(value);
  };

  const handleDiscountChange = (value: number) => {
    setDiscountPercentage(value);
  };

  const toggleDiscount = () => {
    setShowDiscount(!showDiscount);
    if (!showDiscount) {
      setDiscountPercentage(10);
    } else {
      setDiscountPercentage(0);
    }
  };

  const applySuggestedPrice = (price: number) => {
    setBasePrice(price);
  };

  const handleContinue = () => {
    onComplete({ 
      basePrice, 
      totalPrice,
      discountPercentage: showDiscount ? discountPercentage : 0
    });
  };

  const isCompetitivePrice = basePrice >= suggestedPricing.min && basePrice <= suggestedPricing.max;
  const savings = basePrice - totalPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Pricing</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Set competitive pricing for your package to attract guests while maximizing revenue.
        </p>
      </motion.div>

      {/* Pricing Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ${totalPrice.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Final Price per night</div>
              {showDiscount && discountPercentage > 0 && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  Save ${savings.toFixed(0)}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ${estimatedInclusionsValue}
              </div>
              <div className="text-sm text-gray-600">Estimated perk value</div>
              <div className="text-xs text-green-600 font-medium mt-1">
                Added value
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Base Price Setting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#5FAD43]" />
              <label className="text-sm font-medium text-gray-700">
                Base Price per Night
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">$50</span>
                <Slider
                  value={[basePrice]}
                  onValueChange={(value) => handleBasePriceChange(value[0])}
                  max={1000}
                  min={50}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">$1000</span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => handleBasePriceChange(parseInt(e.target.value) || 50)}
                  min={50}
                  max={1000}
                  className="w-32 text-center"
                />
                <span className="text-sm text-gray-600">per night</span>
              </div>
            </div>

            {/* Price Recommendations */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Recommended for your package type:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => applySuggestedPrice(suggestedPricing.min)}
                  className="text-xs"
                >
                  Budget: ${suggestedPricing.min}
                </Button>
                <Button
                  variant="outline"
                  size="sm" 
                  onClick={() => applySuggestedPrice(suggestedPricing.recommended)}
                  className="text-xs bg-[#5FAD43] text-white border-[#5FAD43] hover:bg-[#4A9C39]"
                >
                  Recommended: ${suggestedPricing.recommended}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestedPrice(suggestedPricing.max)}
                  className="text-xs"
                >
                  Premium: ${suggestedPricing.max}
                </Button>
              </div>
            </div>

            {/* Price Status */}
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              isCompetitivePrice 
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              {isCompetitivePrice ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Competitive pricing for your market
                  </span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Consider adjusting to recommended range (${suggestedPricing.min}-${suggestedPricing.max})
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Discount Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                <label className="text-sm font-medium text-gray-700">
                  Launch Discount (Optional)
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDiscount}
                className={showDiscount ? 'bg-orange-50 border-orange-300' : ''}
              >
                {showDiscount ? 'Remove Discount' : 'Add Discount'}
              </Button>
            </div>

            {showDiscount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">5%</span>
                  <Slider
                    value={[discountPercentage]}
                    onValueChange={(value) => handleDiscountChange(value[0])}
                    max={30}
                    min={5}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">30%</span>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-800">
                    {discountPercentage}% OFF
                  </div>
                  <div className="text-sm text-orange-700">
                    Guests save ${savings.toFixed(0)} per night
                  </div>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  💡 Launch discounts help attract initial bookings and reviews
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Pricing Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gray-50 border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Pricing Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Base price per night</span>
              <span className="font-medium">${basePrice}</span>
            </div>
            {showDiscount && discountPercentage > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Launch discount ({discountPercentage}%)</span>
                <span className="font-medium text-red-600">-${savings.toFixed(0)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium text-gray-900">Guest pays per night</span>
              <span className="text-xl font-bold text-[#5FAD43]">${totalPrice.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">+ Estimated perk value</span>
              <span className="font-medium text-green-600">${estimatedPerkValue}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pricing Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Pricing Strategy Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Research competitor prices for similar packages</li>
                <li>• Consider seasonal pricing adjustments</li>
                <li>• Launch discounts can help build initial momentum</li>
                <li>• Factor in the value of included perks and amenities</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl"
        >
          Continue to Photos & Media
        </Button>
      </motion.div>
    </div>
  );
}