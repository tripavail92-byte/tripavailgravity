import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Clock, AlertTriangle, Plus, X, FileText } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

interface PolicyStepProps {
  onComplete: (data: {
    policies: {
      cancellationPolicy?: string;
      noShowPolicy?: string;
      customPolicies?: string[];
    }
  }) => void;
  onUpdate: (data: {
    policies: {
      cancellationPolicy?: string;
      noShowPolicy?: string;
      customPolicies?: string[];
    }
  }) => void;
  existingData?: {
    policies?: {
      cancellationPolicy?: string;
      noShowPolicy?: string;
      customPolicies?: string[];
    };
    packageType?: string;
  };
}

export function PolicyStep({ onComplete, onUpdate, existingData }: PolicyStepProps) {
  const [cancellationPolicy, setCancellationPolicy] = useState(
    existingData?.policies?.cancellationPolicy || 'flexible'
  );
  const [noShowPolicy, setNoShowPolicy] = useState(
    existingData?.policies?.noShowPolicy || 'charge_full'
  );
  const [customPolicies, setCustomPolicies] = useState<string[]>(
    existingData?.policies?.customPolicies || []
  );
  const [newCustomPolicy, setNewCustomPolicy] = useState('');

  // Predefined policy options
  const cancellationPolicies = {
    flexible: {
      title: 'Flexible',
      description: 'Free cancellation up to 24 hours before check-in',
      details: 'Guests can cancel free of charge until 24 hours before arrival. Cancellations within 24 hours will incur a charge equivalent to one night\'s stay.'
    },
    moderate: {
      title: 'Moderate',
      description: 'Free cancellation up to 5 days before check-in',
      details: 'Free cancellation until 5 days before arrival. Cancellations within 5 days will be charged 50% of the total booking. No-shows will be charged the full amount.'
    },
    strict: {
      title: 'Strict',
      description: 'Free cancellation up to 14 days before check-in',
      details: 'Free cancellation until 14 days before arrival. Cancellations within 14 days will be charged 100% of the booking amount.'
    },
    non_refundable: {
      title: 'Non-Refundable',
      description: 'No refunds - lowest price guaranteed',
      details: 'This booking is non-refundable. No cancellations or changes are permitted. Payment is required at time of booking.'
    }
  };

  const noShowPolicies = {
    charge_full: {
      title: 'Charge Full Amount',
      description: 'Guest is charged the full booking amount for no-shows'
    },
    charge_night: {
      title: 'Charge One Night',
      description: 'Guest is charged for one night only'
    },
    no_charge: {
      title: 'No Charge',
      description: 'No charge for no-shows (not recommended)'
    }
  };

  // Package-specific policy suggestions
  const getPackagePolicySuggestions = (packageType: string) => {
    const policyMap: { [key: string]: string[] } = {
      romantic: [
        'Special dietary requirements must be communicated 48 hours in advance',
        'Spa appointments are subject to availability and should be booked upon arrival',
        'Room decorations are included but customization requests require 24-hour notice'
      ],
      family: [
        'Maximum 2 children under 12 years old for kids-eat-free promotion',
        'High chairs and cribs are subject to availability',
        'Children must be supervised at all times in common areas'
      ],
      business: [
        'Meeting room bookings are confirmed upon check-in based on availability',
        'Business center access is complimentary during business hours (9 AM - 6 PM)',
        'Express check-out service available upon request'
      ],
      adventure: [
        'Adventure activities are weather-dependent and may be rescheduled',
        'Equipment rental requires valid ID and security deposit',
        'Guests participate in activities at their own risk'
      ],
      culinary: [
        'Dietary restrictions and allergies must be communicated at booking',
        'Cooking class participation requires advance registration',
        'Wine tasting sessions are for guests 21+ with valid ID'
      ],
      wellness: [
        'Spa treatments must be booked in advance and are subject to availability',
        'Yoga and meditation classes have limited capacity',
        'Wellness consultations require 24-hour advance booking'
      ],
      luxury: [
        'Concierge services available 24/7 for restaurant reservations and activity bookings',
        'Butler service requests should be made at least 2 hours in advance',
        'Premium amenities and services are subject to availability'
      ]
    };

    return policyMap[packageType] || [
      'Package benefits are valid only during the stay period',
      'Special requests are subject to availability and may incur additional charges',
      'All package inclusions must be used during the stay and cannot be refunded if unused'
    ];
  };

  const packagePolicySuggestions = getPackagePolicySuggestions(existingData?.packageType || 'weekend');

  const updatePolicies = () => {
    const policies = {
      cancellationPolicy,
      noShowPolicy,
      customPolicies: customPolicies.length > 0 ? customPolicies : undefined
    };
    onUpdate({ policies });
  };

  const handleCancellationPolicyChange = (value: string) => {
    setCancellationPolicy(value);
    setTimeout(updatePolicies, 100);
  };

  const handleNoShowPolicyChange = (value: string) => {
    setNoShowPolicy(value);
    setTimeout(updatePolicies, 100);
  };

  const addCustomPolicy = (policy: string) => {
    if (policy.trim() && !customPolicies.includes(policy.trim()) && customPolicies.length < 10) {
      const updatedPolicies = [...customPolicies, policy.trim()];
      setCustomPolicies(updatedPolicies);
      setTimeout(updatePolicies, 100);
      setNewCustomPolicy('');
    }
  };

  const removeCustomPolicy = (index: number) => {
    const updatedPolicies = customPolicies.filter((_, i) => i !== index);
    setCustomPolicies(updatedPolicies);
    setTimeout(updatePolicies, 100);
  };

  const addSuggestedPolicy = (policy: string) => {
    addCustomPolicy(policy);
  };

  const handleContinue = () => {
    const policies = {
      cancellationPolicy,
      noShowPolicy,
      customPolicies: customPolicies.length > 0 ? customPolicies : undefined
    };
    onComplete({ policies });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Policies</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Set clear policies to protect your business and set proper expectations with guests.
        </p>
      </motion.div>

      {/* Cancellation Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5FAD43]" />
              <label className="text-sm font-medium text-gray-700">
                Cancellation Policy *
              </label>
            </div>

            <Select value={cancellationPolicy} onValueChange={handleCancellationPolicyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cancellationPolicies).map(([key, policy]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{policy.title}</div>
                      <div className="text-xs text-gray-600">{policy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Policy Details */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-1">
                {cancellationPolicies[cancellationPolicy as keyof typeof cancellationPolicies]?.title} Policy Details:
              </p>
              <p className="text-xs text-blue-800">
                {cancellationPolicies[cancellationPolicy as keyof typeof cancellationPolicies]?.details}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* No-Show Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <label className="text-sm font-medium text-gray-700">
                No-Show Policy *
              </label>
            </div>

            <Select value={noShowPolicy} onValueChange={handleNoShowPolicyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(noShowPolicies).map(([key, policy]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{policy.title}</div>
                      <div className="text-xs text-gray-600">{policy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* Custom Policies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-medium text-gray-700">
                  Package-Specific Policies ({customPolicies.length}/10)
                </label>
              </div>
            </div>

            {/* Add Custom Policy */}
            <div className="flex gap-2">
              <Textarea
                value={newCustomPolicy}
                onChange={(e) => setNewCustomPolicy(e.target.value)}
                placeholder="Add a specific policy for your package..."
                className="min-h-20 resize-none"
                maxLength={200}
              />
              <Button
                onClick={() => addCustomPolicy(newCustomPolicy)}
                disabled={!newCustomPolicy.trim() || customPolicies.length >= 10}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Custom Policies */}
            {customPolicies.length > 0 && (
              <div className="space-y-2">
                {customPolicies.map((policy, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{policy}</span>
                    </div>
                    <button
                      onClick={() => removeCustomPolicy(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2"
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

      {/* Suggested Policies */}
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
            
            <div className="space-y-2">
              {packagePolicySuggestions
                .filter(policy => !customPolicies.includes(policy))
                .map((policy, index) => (
                  <motion.button
                    key={index}
                    onClick={() => addSuggestedPolicy(policy)}
                    disabled={customPolicies.length >= 10}
                    className="flex items-start justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 text-left transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: customPolicies.length < 10 ? 1.01 : 1 }}
                    whileTap={{ scale: customPolicies.length < 10 ? 0.99 : 1 }}
                  >
                    <span className="text-sm text-gray-700 flex-1">{policy}</span>
                    <Plus className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" />
                  </motion.button>
                ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* General Policies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Standard Hotel Policies</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Check-in: 3:00 PM | Check-out: 11:00 AM</p>
            <p>• Valid photo ID and credit card required at check-in</p>
            <p>• Smoking is prohibited in all rooms and common areas</p>
            <p>• Pets are not permitted unless specified otherwise</p>
            <p>• Hotel reserves the right to verify guest information</p>
          </div>
        </Card>
      </motion.div>

      {/* Policy Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">Policy Best Practices</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Be clear and specific to avoid misunderstandings</li>
            <li>• Balance guest flexibility with business protection</li>
            <li>• Consider your target market when setting cancellation terms</li>
            <li>• Review and update policies regularly based on experience</li>
          </ul>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-100"
      >
        <Button
          onClick={handleContinue}
          className="w-full gradient-hotel-manager text-white py-3 rounded-xl"
        >
          Continue to Review & Publish
        </Button>
      </motion.div>
    </div>
  );
}