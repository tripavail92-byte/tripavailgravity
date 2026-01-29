import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Users, Percent, Calculator, Info, Sparkles } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';

interface TourPricingStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  description: string;
  minPeople: number;
  maxPeople: number;
  pricePerPerson: number;
}

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'per-person' | 'per-group';
}

export function TourPricingStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourPricingStepProps) {
  const [pricingData, setPricingData] = useState({
    basePricePerPerson: data.basePricePerPerson || '',
    currency: data.currency || 'PKR',
    groupDiscounts: data.groupDiscounts || false,
    pricingTiers: data.pricingTiers || [],
    seasonalPricing: data.seasonalPricing || false,
    peakSeasonMultiplier: data.peakSeasonMultiplier || '1.2',
    offSeasonMultiplier: data.offSeasonMultiplier || '0.8',
    addons: data.addons || [],
    cancellationPolicy: data.cancellationPolicy || 'flexible',
    depositRequired: data.depositRequired || false,
    depositPercentage: data.depositPercentage || '25',
    includes: data.includes || [],
    excludes: data.excludes || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPriceCalculator, setShowPriceCalculator] = useState(false);

  useEffect(() => {
    onUpdate(pricingData);
  }, [pricingData]);

  const handleInputChange = (field: string, value: any) => {
    setPricingData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!pricingData.basePricePerPerson) {
      newErrors.basePricePerPerson = 'Base price is required';
    } else if (isNaN(Number(pricingData.basePricePerPerson)) || Number(pricingData.basePricePerPerson) <= 0) {
      newErrors.basePricePerPerson = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const addPricingTier = () => {
    const newTier: PricingTier = {
      id: Date.now().toString(),
      name: `Group ${pricingData.pricingTiers.length + 1}`,
      description: '',
      minPeople: pricingData.pricingTiers.length === 0 ? 1 : 5,
      maxPeople: pricingData.pricingTiers.length === 0 ? 4 : 10,
      pricePerPerson: Number(pricingData.basePricePerPerson) || 0
    };
    
    setPricingData(prev => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, newTier]
    }));
  };

  const updatePricingTier = (tierId: string, field: string, value: any) => {
    setPricingData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map(tier =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const removePricingTier = (tierId: string) => {
    setPricingData(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter(tier => tier.id !== tierId)
    }));
  };

  const addAddon = () => {
    const newAddon: Addon = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      type: 'per-person'
    };
    
    setPricingData(prev => ({
      ...prev,
      addons: [...prev.addons, newAddon]
    }));
  };

  const updateAddon = (addonId: string, field: string, value: any) => {
    setPricingData(prev => ({
      ...prev,
      addons: prev.addons.map(addon =>
        addon.id === addonId ? { ...addon, [field]: value } : addon
      )
    }));
  };

  const removeAddon = (addonId: string) => {
    setPricingData(prev => ({
      ...prev,
      addons: prev.addons.filter(addon => addon.id !== addonId)
    }));
  };

  const toggleInclude = (item: string) => {
    setPricingData(prev => ({
      ...prev,
      includes: prev.includes.includes(item)
        ? prev.includes.filter(i => i !== item)
        : [...prev.includes, item]
    }));
  };

  const toggleExclude = (item: string) => {
    setPricingData(prev => ({
      ...prev,
      excludes: prev.excludes.includes(item)
        ? prev.excludes.filter(e => e !== item)
        : [...prev.excludes, item]
    }));
  };

  const COMMON_INCLUDES = [
    'Professional Tour Guide',
    'Transportation',
    'Entrance Fees',
    'Meals (as specified)',
    'Accommodation',
    'Travel Insurance',
    'Photography',
    'Local Taxes'
  ];

  const COMMON_EXCLUDES = [
    'Personal Expenses',
    'Tips and Gratuities',
    'International Flights',
    'Visa Fees',
    'Optional Activities',
    'Alcoholic Beverages',
    'Shopping',
    'Emergency Expenses'
  ];

  const calculateSamplePrice = (people: number) => {
    const basePrice = Number(pricingData.basePricePerPerson) || 0;
    let finalPrice = basePrice;

    // Apply group discounts
    if (pricingData.groupDiscounts && pricingData.pricingTiers.length > 0) {
      const tier = pricingData.pricingTiers.find(t => 
        people >= t.minPeople && people <= t.maxPeople
      );
      if (tier) {
        finalPrice = tier.pricePerPerson;
      }
    }

    return finalPrice * people;
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-[#5FAD43] to-[#4a9637] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Pricing</h2>
            <p className="text-green-100">Set competitive pricing for your tour</p>
          </div>
        </div>
      </Card>

      {/* Base Pricing */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Base Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price Per Person *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={pricingData.basePricePerPerson}
                onChange={(e) => handleInputChange('basePricePerPerson', e.target.value)}
                placeholder="0"
                className={`pl-9 ${errors.basePricePerPerson ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.basePricePerPerson && (
              <p className="text-red-500 text-sm mt-1">{errors.basePricePerPerson}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <Select value={pricingData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sample Price Calculator */}
        {pricingData.basePricePerPerson && (
          <motion.div
            className="mt-4 p-4 bg-[#5FAD43] bg-opacity-10 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-[#5FAD43]" />
              <span className="font-medium text-[#5FAD43]">Sample Pricing</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>1 person: {pricingData.currency} {calculateSamplePrice(1).toLocaleString()}</div>
              <div>2 people: {pricingData.currency} {calculateSamplePrice(2).toLocaleString()}</div>
              <div>4 people: {pricingData.currency} {calculateSamplePrice(4).toLocaleString()}</div>
              <div>8 people: {pricingData.currency} {calculateSamplePrice(8).toLocaleString()}</div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Group Discounts */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Group Discounts</h3>
            <p className="text-sm text-gray-600">Offer discounts for larger groups</p>
          </div>
          <Switch
            checked={pricingData.groupDiscounts}
            onCheckedChange={(checked) => handleInputChange('groupDiscounts', checked)}
          />
        </div>

        <AnimatePresence>
          {pricingData.groupDiscounts && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Pricing Tiers</span>
                <Button
                  size="sm"
                  onClick={addPricingTier}
                  className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
                >
                  Add Tier
                </Button>
              </div>

              {pricingData.pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  className="p-3 border border-gray-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Input
                      placeholder="Tier name"
                      value={tier.name}
                      onChange={(e) => updatePricingTier(tier.id, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Min people"
                      value={tier.minPeople}
                      onChange={(e) => updatePricingTier(tier.id, 'minPeople', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Max people"
                      value={tier.maxPeople}
                      onChange={(e) => updatePricingTier(tier.id, 'maxPeople', Number(e.target.value))}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Price per person"
                        value={tier.pricePerPerson}
                        onChange={(e) => updatePricingTier(tier.id, 'pricePerPerson', Number(e.target.value))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePricingTier(tier.id)}
                        className="text-red-600"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Seasonal Pricing */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Seasonal Pricing</h3>
            <p className="text-sm text-gray-600">Adjust prices for peak and off seasons</p>
          </div>
          <Switch
            checked={pricingData.seasonalPricing}
            onCheckedChange={(checked) => handleInputChange('seasonalPricing', checked)}
          />
        </div>

        <AnimatePresence>
          {pricingData.seasonalPricing && (
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peak Season Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={pricingData.peakSeasonMultiplier}
                  onChange={(e) => handleInputChange('peakSeasonMultiplier', e.target.value)}
                  placeholder="1.2"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 1.2 = 20% increase</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Off Season Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={pricingData.offSeasonMultiplier}
                  onChange={(e) => handleInputChange('offSeasonMultiplier', e.target.value)}
                  placeholder="0.8"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 0.8 = 20% decrease</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Deposit & Cancellation */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Terms</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Require Deposit</label>
              <p className="text-sm text-gray-600">Require partial payment upfront</p>
            </div>
            <Switch
              checked={pricingData.depositRequired}
              onCheckedChange={(checked) => handleInputChange('depositRequired', checked)}
            />
          </div>

          <AnimatePresence>
            {pricingData.depositRequired && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Percentage
                </label>
                <Select 
                  value={pricingData.depositPercentage} 
                  onValueChange={(value) => handleInputChange('depositPercentage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10% Deposit</SelectItem>
                    <SelectItem value="25">25% Deposit</SelectItem>
                    <SelectItem value="50">50% Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Policy
            </label>
            <Select 
              value={pricingData.cancellationPolicy} 
              onValueChange={(value) => handleInputChange('cancellationPolicy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible (Free cancellation 24h before)</SelectItem>
                <SelectItem value="moderate">Moderate (Free cancellation 5 days before)</SelectItem>
                <SelectItem value="strict">Strict (50% refund if cancelled 14 days before)</SelectItem>
                <SelectItem value="non-refundable">Non-refundable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* What's Included/Excluded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-green-700">What's Included</h3>
          <div className="space-y-2">
            {COMMON_INCLUDES.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingData.includes.includes(item)}
                  onChange={() => toggleInclude(item)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-red-700">What's Excluded</h3>
          <div className="space-y-2">
            {COMMON_EXCLUDES.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingData.excludes.includes(item)}
                  onChange={() => toggleExclude(item)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className="px-6"
        >
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white px-6"
        >
          Next: Media
        </Button>
      </div>
    </motion.div>
  );
}