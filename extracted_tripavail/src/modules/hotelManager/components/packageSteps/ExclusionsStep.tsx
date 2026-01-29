import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Plus, X, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Switch } from '../../../../components/ui/switch';

interface ExclusionsStepProps {
  onComplete: (data: { exclusions: string[] }) => void;
  onUpdate: (data: { exclusions: string[] }) => void;
  existingData?: { 
    exclusions?: string[];
    packageType?: string;
  };
}

export function ExclusionsStep({ onComplete, onUpdate, existingData }: ExclusionsStepProps) {
  const [exclusions, setExclusions] = useState<string[]>(existingData?.exclusions || []);
  const [newExclusion, setNewExclusion] = useState('');
  const [showCommonExclusions, setShowCommonExclusions] = useState(true);

  // Common exclusions based on industry standards
  const commonExclusions = [
    'Airfare and transportation to hotel',
    'Personal expenses and incidentals',
    'Travel insurance',
    'Gratuities and tips',
    'Alcoholic beverages (unless specified)',
    'Room service charges',
    'Spa treatments (unless included)',
    'Activities not mentioned in inclusions',
    'Laundry and dry cleaning services',
    'Telephone calls and internet (if not complimentary)',
    'Parking fees (unless specified as free)',
    'Pet accommodation fees',
    'Late checkout fees (unless included)',
    'Minibar consumption',
    'Airport transfers (unless specified)'
  ];

  // Package-specific suggested exclusions
  const getPackageSpecificExclusions = (packageType: string) => {
    const exclusionMap: { [key: string]: string[] } = {
      romantic: [
        'Additional spa services beyond included treatments',
        'Premium wine and champagne selections',
        'Photography services',
        'Private dining surcharges'
      ],
      family: [
        'Children\'s special dietary requirements',
        'Childcare services beyond specified hours',
        'Additional kids\' activities not listed',
        'Stroller and baby equipment rental'
      ],
      business: [
        'International calling charges',
        'Premium meeting room equipment',
        'Secretarial services',
        'Extended business center hours'
      ],
      adventure: [
        'Professional photography of activities',
        'Equipment insurance coverage',
        'Advanced or specialized gear',
        'Medical insurance for high-risk activities'
      ],
      culinary: [
        'Premium wine pairings beyond basic selection',
        'Private chef services',
        'Special dietary preparation charges',
        'Take-home gourmet ingredients'
      ],
      wellness: [
        'Personal trainer sessions',
        'Advanced spa treatments',
        'Specialized wellness consultations',
        'Organic meal supplements'
      ],
      luxury: [
        'Private jet or helicopter transfers',
        'Personal shopping assistance',
        'Extended concierge services',
        'Premium entertainment bookings'
      ]
    };

    return exclusionMap[packageType] || [];
  };

  const packageSpecificExclusions = getPackageSpecificExclusions(existingData?.packageType || 'weekend');

  const addExclusion = (exclusion: string) => {
    if (exclusion.trim() && !exclusions.includes(exclusion.trim())) {
      const updatedExclusions = [...exclusions, exclusion.trim()];
      setExclusions(updatedExclusions);
      onUpdate({ exclusions: updatedExclusions });
      setNewExclusion('');
    }
  };

  const removeExclusion = (index: number) => {
    const updatedExclusions = exclusions.filter((_, i) => i !== index);
    setExclusions(updatedExclusions);
    onUpdate({ exclusions: updatedExclusions });
  };

  const addSuggestedExclusion = (suggestion: string) => {
    addExclusion(suggestion);
  };

  const handleContinue = () => {
    onComplete({ exclusions });
  };

  const handleSkip = () => {
    // Allow skipping this step with minimal exclusions
    const minimalExclusions = [
      'Personal expenses and incidentals',
      'Travel insurance',
      'Activities not mentioned in inclusions'
    ];
    onComplete({ exclusions: minimalExclusions });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Exclusions</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Clearly specify what's not included to set proper expectations and avoid disputes.
        </p>
      </motion.div>

      {/* Current Exclusions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <label className="text-sm font-medium text-gray-700">
                  What's Not Included ({exclusions.length})
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="text-gray-600 border-gray-300"
              >
                Use Defaults & Skip
              </Button>
            </div>

            {/* Add New Exclusion */}
            <div className="flex gap-2">
              <Input
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="Add an exclusion (e.g., Airfare to destination)"
                onKeyPress={(e) => e.key === 'Enter' && addExclusion(newExclusion)}
                maxLength={100}
              />
              <Button
                onClick={() => addExclusion(newExclusion)}
                disabled={!newExclusion.trim()}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Exclusions List */}
            {exclusions.length > 0 && (
              <div className="space-y-2">
                {exclusions.map((exclusion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-800">{exclusion}</span>
                    </div>
                    <button
                      onClick={() => removeExclusion(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Common Exclusions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Common Hotel Exclusions</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {showCommonExclusions ? 'Hide' : 'Show'}
                </span>
                <Switch
                  checked={showCommonExclusions}
                  onCheckedChange={setShowCommonExclusions}
                />
                {showCommonExclusions ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>

            {showCommonExclusions && (
              <div className="grid grid-cols-1 gap-2">
                {commonExclusions
                  .filter(exclusion => !exclusions.includes(exclusion))
                  .map((exclusion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => addSuggestedExclusion(exclusion)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 text-left transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="text-sm text-gray-700">{exclusion}</span>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Package-Specific Exclusions */}
      {packageSpecificExclusions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="space-y-4">
              <h3 className="font-medium text-blue-900">
                Suggested for {existingData?.packageType?.replace('_', ' ').toUpperCase()} Packages
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {packageSpecificExclusions
                  .filter(exclusion => !exclusions.includes(exclusion))
                  .map((exclusion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => addSuggestedExclusion(exclusion)}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 text-left transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="text-sm text-gray-700">{exclusion}</span>
                      <Plus className="w-4 h-4 text-blue-500" />
                    </motion.button>
                  ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">Exclusion Best Practices</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Be specific and clear about what's not included</li>
            <li>• List high-cost items that guests might assume are included</li>
            <li>• Include standard industry exclusions to avoid confusion</li>
            <li>• Keep the language professional and not overly restrictive</li>
          </ul>
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
          Continue to Perks & Inclusions
        </Button>
      </motion.div>
    </div>
  );
}