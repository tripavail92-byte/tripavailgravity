import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gift, Percent, Check, Star, Plus, X } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Switch } from '../../../../components/ui/switch';
import { Slider } from '../../../../components/ui/slider';

interface Perk {
  name: string;
  type: 'free' | 'discount';
  discountPercentage?: number;
  enabled: boolean;
}

interface PerksInclusionsStepProps {
  onComplete: (data: { perks: Perk[] }) => void;
  onUpdate: (data: { perks: Perk[] }) => void;
  existingData?: { 
    perks?: Perk[];
    packageType?: string;
  };
}

export function PerksInclusionsStep({ onComplete, onUpdate, existingData }: PerksInclusionsStepProps) {
  const [initialized, setInitialized] = useState(false);
  const [perks, setPerks] = useState<Perk[]>(existingData?.perks || []);
  const [newPerkName, setNewPerkName] = useState('');
  const [newPerkType, setNewPerkType] = useState<'free' | 'discount'>('free');
  const [newPerkDiscount, setNewPerkDiscount] = useState(10);

  // Suggested perks based on package type
  const getSuggestedPerks = (packageType: string): Perk[] => {
    const perkMap: { [key: string]: Perk[] } = {
      weekend: [
        { name: 'Complimentary breakfast', type: 'free', enabled: true },
        { name: 'Late checkout (2 PM)', type: 'free', enabled: true },
        { name: 'Welcome drink on arrival', type: 'free', enabled: true },
        { name: 'Spa services', type: 'discount', discountPercentage: 20, enabled: false },
        { name: 'Restaurant dining', type: 'discount', discountPercentage: 15, enabled: false },
        { name: 'Room upgrade', type: 'free', enabled: false }
      ],
      romantic: [
        { name: 'Champagne & chocolates', type: 'free', enabled: true },
        { name: 'Rose petal turndown', type: 'free', enabled: true },
        { name: 'Couples massage', type: 'discount', discountPercentage: 30, enabled: true },
        { name: 'Private dining setup', type: 'free', enabled: false },
        { name: 'Photography session', type: 'discount', discountPercentage: 25, enabled: false },
        { name: 'Romantic room decoration', type: 'free', enabled: false }
      ],
      family: [
        { name: 'Kids eat free (under 12)', type: 'free', enabled: true },
        { name: 'Family game room access', type: 'free', enabled: true },
        { name: 'Children\'s activity program', type: 'free', enabled: true },
        { name: 'Babysitting services', type: 'discount', discountPercentage: 20, enabled: false },
        { name: 'Theme park tickets', type: 'discount', discountPercentage: 15, enabled: false },
        { name: 'Extra bed/crib setup', type: 'free', enabled: false }
      ],
      business: [
        { name: 'Executive lounge access', type: 'free', enabled: true },
        { name: 'Meeting room (2 hours)', type: 'free', enabled: true },
        { name: 'Express laundry service', type: 'free', enabled: true },
        { name: 'Airport shuttle service', type: 'free', enabled: false },
        { name: 'Extended meeting room', type: 'discount', discountPercentage: 25, enabled: false },
        { name: 'Secretarial services', type: 'discount', discountPercentage: 20, enabled: false }
      ],
      adventure: [
        { name: 'Equipment rental included', type: 'free', enabled: true },
        { name: 'Professional guide service', type: 'free', enabled: true },
        { name: 'Trail maps & recommendations', type: 'free', enabled: true },
        { name: 'Adventure photography', type: 'discount', discountPercentage: 30, enabled: false },
        { name: 'Equipment insurance', type: 'discount', discountPercentage: 50, enabled: false },
        { name: 'Gear cleaning service', type: 'free', enabled: false }
      ],
      culinary: [
        { name: 'Chef\'s tasting menu', type: 'free', enabled: true },
        { name: 'Wine pairing experience', type: 'free', enabled: true },
        { name: 'Cooking class session', type: 'free', enabled: true },
        { name: 'Market tour with chef', type: 'free', enabled: false },
        { name: 'Premium wine selection', type: 'discount', discountPercentage: 25, enabled: false },
        { name: 'Private chef service', type: 'discount', discountPercentage: 35, enabled: false }
      ],
      wellness: [
        { name: 'Daily spa treatment credit', type: 'free', enabled: true },
        { name: 'Yoga & meditation classes', type: 'free', enabled: true },
        { name: 'Healthy meal plan', type: 'free', enabled: true },
        { name: 'Wellness consultation', type: 'free', enabled: false },
        { name: 'Additional spa services', type: 'discount', discountPercentage: 25, enabled: false },
        { name: 'Personal trainer session', type: 'discount', discountPercentage: 30, enabled: false }
      ],
      luxury: [
        { name: 'Personal concierge service', type: 'free', enabled: true },
        { name: 'Premium room amenities', type: 'free', enabled: true },
        { name: 'VIP airport transfer', type: 'free', enabled: true },
        { name: 'Butler service', type: 'free', enabled: false },
        { name: 'Luxury car service', type: 'discount', discountPercentage: 40, enabled: false },
        { name: 'Private dining chef', type: 'discount', discountPercentage: 30, enabled: false }
      ]
    };

    return perkMap[packageType] || perkMap.weekend;
  };

  const suggestedPerks = getSuggestedPerks(existingData?.packageType || 'weekend');

  // Initialize with suggested perks if no existing data
  useEffect(() => {
    if (!initialized && !existingData?.perks && suggestedPerks.length > 0) {
      const initialPerks = suggestedPerks.filter(perk => perk.enabled);
      setPerks(initialPerks);
      onUpdate({ perks: initialPerks });
      setInitialized(true);
    }
  }, [initialized, existingData?.perks, suggestedPerks, onUpdate]);

  const addCustomPerk = () => {
    if (newPerkName.trim()) {
      const newPerk: Perk = {
        name: newPerkName.trim(),
        type: newPerkType,
        discountPercentage: newPerkType === 'discount' ? newPerkDiscount : undefined,
        enabled: true
      };
      
      const updatedPerks = [...perks, newPerk];
      setPerks(updatedPerks);
      onUpdate({ perks: updatedPerks });
      
      setNewPerkName('');
      setNewPerkType('free');
      setNewPerkDiscount(10);
    }
  };

  const removePerk = (index: number) => {
    const updatedPerks = perks.filter((_, i) => i !== index);
    setPerks(updatedPerks);
    onUpdate({ perks: updatedPerks });
  };

  const togglePerk = (perk: Perk) => {
    const isAlreadyAdded = perks.some(p => p.name === perk.name);
    let updatedPerks;
    
    if (isAlreadyAdded) {
      updatedPerks = perks.filter(p => p.name !== perk.name);
    } else {
      updatedPerks = [...perks, { ...perk, enabled: true }];
    }
    
    setPerks(updatedPerks);
    onUpdate({ perks: updatedPerks });
  };

  const updatePerkDiscount = (perkIndex: number, discount: number) => {
    const updatedPerks = perks.map((perk, index) => 
      index === perkIndex 
        ? { ...perk, discountPercentage: discount }
        : perk
    );
    setPerks(updatedPerks);
    onUpdate({ perks: updatedPerks });
  };

  const handleContinue = () => {
    onComplete({ perks });
  };

  const freePerks = perks.filter(p => p.type === 'free');
  const discountPerks = perks.filter(p => p.type === 'discount');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Perks & Inclusions</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Add valuable perks and inclusions to make your package more attractive to guests.
        </p>
      </motion.div>

      {/* Current Perks Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#5FAD43]">{freePerks.length}</div>
              <div className="text-sm text-gray-600">Free Inclusions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{discountPerks.length}</div>
              <div className="text-sm text-gray-600">Discount Offers</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Custom Perk */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#5FAD43]" />
              <h3 className="font-medium text-gray-900">Add Custom Perk</h3>
            </div>

            <div className="space-y-3">
              <Input
                value={newPerkName}
                onChange={(e) => setNewPerkName(e.target.value)}
                placeholder="Enter perk name (e.g., Complimentary breakfast)"
                maxLength={60}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Perk Type</label>
                  <div className="flex gap-2">
                    <Button
                      variant={newPerkType === 'free' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPerkType('free')}
                      className={newPerkType === 'free' ? 'bg-[#5FAD43] hover:bg-[#4A9C39]' : ''}
                    >
                      <Gift className="w-4 h-4 mr-1" />
                      Free
                    </Button>
                    <Button
                      variant={newPerkType === 'discount' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPerkType('discount')}
                      className={newPerkType === 'discount' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <Percent className="w-4 h-4 mr-1" />
                      Discount
                    </Button>
                  </div>
                </div>

                {newPerkType === 'discount' && (
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      Discount: {newPerkDiscount}%
                    </label>
                    <Slider
                      value={[newPerkDiscount]}
                      onValueChange={(value) => setNewPerkDiscount(value[0])}
                      max={50}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={addCustomPerk}
                disabled={!newPerkName.trim()}
                className="w-full gradient-hotel-manager text-white"
              >
                Add Perk
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Current Perks List */}
      {perks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Your Package Perks</h3>
            <div className="space-y-3">
              {perks.map((perk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    perk.type === 'free' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {perk.type === 'free' ? (
                      <Gift className="w-5 h-5 text-[#5FAD43]" />
                    ) : (
                      <Percent className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-900">{perk.name}</span>
                      {perk.type === 'discount' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-blue-700 font-medium">
                            {perk.discountPercentage}% OFF
                          </span>
                          <Slider
                            value={[perk.discountPercentage || 10]}
                            onValueChange={(value) => updatePerkDiscount(index, value[0])}
                            max={50}
                            min={5}  
                            step={5}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removePerk(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Suggested Perks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <h3 className="font-medium text-blue-900 mb-4">
            Popular for {existingData?.packageType?.replace('_', ' ').toUpperCase()} Packages
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {suggestedPerks
              .filter(suggested => !perks.some(p => p.name === suggested.name))
              .map((perk, index) => (
                <motion.button
                  key={index}
                  onClick={() => togglePerk(perk)}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 text-left transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    {perk.type === 'free' ? (
                      <Gift className="w-4 h-4 text-[#5FAD43]" />
                    ) : (
                      <Percent className="w-4 h-4 text-blue-600" />
                    )}
                    <div>
                      <span className="text-sm text-gray-700">{perk.name}</span>
                      {perk.type === 'discount' && (
                        <div className="text-xs text-blue-600 font-medium">
                          {perk.discountPercentage}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-blue-500" />
                </motion.button>
              ))}
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          disabled={perks.length === 0}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {perks.length === 0 ? 'Add at least one perk' : 'Continue to Pricing'}
        </Button>
      </motion.div>
    </div>
  );
}