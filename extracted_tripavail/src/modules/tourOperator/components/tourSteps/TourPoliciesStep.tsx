import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Clock, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';

interface TourPoliciesStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCompleting: boolean;
}

interface PolicyRule {
  id: string;
  title: string;
  description: string;
  type: 'requirement' | 'restriction' | 'recommendation';
  isActive: boolean;
}

const DEFAULT_POLICIES = [
  {
    id: 'age-restriction',
    title: 'Age Requirements',
    description: 'Minimum age 12 years. Children under 16 must be accompanied by an adult.',
    type: 'requirement' as const,
    isActive: false
  },
  {
    id: 'fitness-level',
    title: 'Fitness Requirements',
    description: 'Moderate fitness level required. Involves walking for 3-4 hours.',
    type: 'requirement' as const,
    isActive: false
  },
  {
    id: 'weather-policy',
    title: 'Weather Conditions',
    description: 'Tours operate in all weather conditions unless deemed unsafe.',
    type: 'restriction' as const,
    isActive: false
  },
  {
    id: 'group-behavior',
    title: 'Group Conduct',
    description: 'Respectful behavior towards guides, locals, and other participants required.',
    type: 'requirement' as const,
    isActive: false
  },
  {
    id: 'photography',
    title: 'Photography Policy',
    description: 'Photography allowed except in restricted areas or sacred sites.',
    type: 'restriction' as const,
    isActive: false
  },
  {
    id: 'luggage-limit',
    title: 'Luggage Restrictions',
    description: 'Maximum 1 small backpack per person. Large luggage not permitted.',
    type: 'restriction' as const,
    isActive: false
  }
];

const CANCELLATION_POLICIES = [
  {
    id: 'flexible',
    name: 'Flexible',
    description: 'Free cancellation up to 24 hours before tour start',
    refundSchedule: [
      { period: '24+ hours before', refund: 100 },
      { period: 'Less than 24 hours', refund: 0 }
    ]
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Free cancellation up to 7 days before tour start',
    refundSchedule: [
      { period: '7+ days before', refund: 100 },
      { period: '3-6 days before', refund: 50 },
      { period: 'Less than 3 days', refund: 0 }
    ]
  },
  {
    id: 'strict',
    name: 'Strict',
    description: 'Free cancellation up to 14 days before tour start',
    refundSchedule: [
      { period: '14+ days before', refund: 100 },
      { period: '7-13 days before', refund: 50 },
      { period: '3-6 days before', refund: 25 },
      { period: 'Less than 3 days', refund: 0 }
    ]
  },
  {
    id: 'non-refundable',
    name: 'Non-Refundable',
    description: 'No refunds under any circumstances',
    refundSchedule: [
      { period: 'Any time', refund: 0 }
    ]
  }
];

export function TourPoliciesStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isCompleting
}: TourPoliciesStepProps) {
  const [policiesData, setPoliciesData] = useState({
    cancellationPolicy: data.cancellationPolicy || 'flexible',
    customCancellationTerms: data.customCancellationTerms || '',
    healthSafetyRequirements: data.healthSafetyRequirements || [],
    tourRules: data.tourRules || DEFAULT_POLICIES,
    liabilityWaiver: data.liabilityWaiver || false,
    insuranceRequired: data.insuranceRequired || false,
    customTerms: data.customTerms || '',
    emergencyContact: data.emergencyContact || '',
    weatherPolicy: data.weatherPolicy || 'operate-unless-dangerous',
    groupSizePolicy: data.groupSizePolicy || '',
    specialRequirements: data.specialRequirements || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onUpdate(policiesData);
  }, [policiesData]);

  const handleInputChange = (field: string, value: any) => {
    setPoliciesData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateTourRule = (ruleId: string, field: string, value: any) => {
    setPoliciesData(prev => ({
      ...prev,
      tourRules: prev.tourRules.map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const addCustomRule = () => {
    const newRule: PolicyRule = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'requirement',
      isActive: true
    };
    
    setPoliciesData(prev => ({
      ...prev,
      tourRules: [...prev.tourRules, newRule]
    }));
  };

  const removeCustomRule = (ruleId: string) => {
    setPoliciesData(prev => ({
      ...prev,
      tourRules: prev.tourRules.filter(rule => rule.id !== ruleId)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (policiesData.customCancellationTerms && policiesData.customCancellationTerms.length < 50) {
      newErrors.customCancellationTerms = 'Please provide more detailed cancellation terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const selectedCancellationPolicy = CANCELLATION_POLICIES.find(
    policy => policy.id === policiesData.cancellationPolicy
  );

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'requirement':
        return CheckCircle;
      case 'restriction':
        return XCircle;
      case 'recommendation':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getPolicyColor = (type: string) => {
    switch (type) {
      case 'requirement':
        return '#5FAD43';
      case 'restriction':
        return '#F44336';
      case 'recommendation':
        return '#FF9800';
      default:
        return '#6B7280';
    }
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Tour Policies</h2>
            <p className="text-green-100">Set clear guidelines for your tour</p>
          </div>
        </div>
      </Card>

      {/* Cancellation Policy */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Cancellation Policy</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <Select 
              value={policiesData.cancellationPolicy} 
              onValueChange={(value) => handleInputChange('cancellationPolicy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_POLICIES.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name} - {policy.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refund Schedule Display */}
          {selectedCancellationPolicy && (
            <motion.div
              className="p-4 bg-gray-50 rounded-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <h4 className="font-medium text-gray-900 mb-3">Refund Schedule</h4>
              <div className="space-y-2">
                {selectedCancellationPolicy.refundSchedule.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{schedule.period}</span>
                    <Badge 
                      variant={schedule.refund === 100 ? "default" : schedule.refund === 0 ? "destructive" : "secondary"}
                    >
                      {schedule.refund}% refund
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Cancellation Terms (Optional)
            </label>
            <Textarea
              value={policiesData.customCancellationTerms}
              onChange={(e) => handleInputChange('customCancellationTerms', e.target.value)}
              placeholder="Add any specific terms or exceptions to your cancellation policy..."
              rows={3}
              className={errors.customCancellationTerms ? 'border-red-500' : ''}
            />
            {errors.customCancellationTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.customCancellationTerms}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Tour Rules & Requirements */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Tour Rules & Requirements</h3>
          <Button
            size="sm"
            onClick={addCustomRule}
            className="bg-[#5FAD43] hover:bg-[#5FAD43]/90 text-white"
          >
            Add Custom Rule
          </Button>
        </div>

        <div className="space-y-3">
          {policiesData.tourRules.map((rule) => {
            const IconComponent = getPolicyIcon(rule.type);
            const color = getPolicyColor(rule.type);
            
            return (
              <motion.div
                key={rule.id}
                className={`p-4 border rounded-lg ${rule.isActive ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={rule.title}
                        onChange={(e) => updateTourRule(rule.id, 'title', e.target.value)}
                        placeholder="Rule title"
                        className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                      />
                      <Select 
                        value={rule.type} 
                        onValueChange={(value) => updateTourRule(rule.id, 'type', value)}
                      >
                        <SelectTrigger className="w-auto h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="requirement">Requirement</SelectItem>
                          <SelectItem value="restriction">Restriction</SelectItem>
                          <SelectItem value="recommendation">Recommendation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <textarea
                      value={rule.description}
                      onChange={(e) => updateTourRule(rule.id, 'description', e.target.value)}
                      placeholder="Describe this rule..."
                      className="w-full text-sm text-gray-700 bg-transparent border-none p-0 resize-none focus:ring-0"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => updateTourRule(rule.id, 'isActive', checked)}
                    />
                    {!DEFAULT_POLICIES.find(p => p.id === rule.id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomRule(rule.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Safety & Insurance */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Safety & Insurance</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Liability Waiver Required</label>
              <p className="text-sm text-gray-600">Participants must sign a liability waiver</p>
            </div>
            <Switch
              checked={policiesData.liabilityWaiver}
              onCheckedChange={(checked) => handleInputChange('liabilityWaiver', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Travel Insurance Required</label>
              <p className="text-sm text-gray-600">Participants must have valid travel insurance</p>
            </div>
            <Switch
              checked={policiesData.insuranceRequired}
              onCheckedChange={(checked) => handleInputChange('insuranceRequired', checked)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact Information
            </label>
            <Textarea
              value={policiesData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              placeholder="Provide emergency contact details and procedures..."
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Weather & Operational Policies */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Operational Policies</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weather Policy
            </label>
            <Select 
              value={policiesData.weatherPolicy} 
              onValueChange={(value) => handleInputChange('weatherPolicy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operate-unless-dangerous">Operate unless dangerous conditions</SelectItem>
                <SelectItem value="cancel-severe-weather">Cancel in severe weather</SelectItem>
                <SelectItem value="reschedule-bad-weather">Reschedule in bad weather</SelectItem>
                <SelectItem value="indoor-alternative">Provide indoor alternatives</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Size Policy
            </label>
            <Textarea
              value={policiesData.groupSizePolicy}
              onChange={(e) => handleInputChange('groupSizePolicy', e.target.value)}
              placeholder="Explain minimum/maximum group sizes and policies for small groups..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements
            </label>
            <Textarea
              value={policiesData.specialRequirements}
              onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
              placeholder="Any special requirements like equipment, clothing, physical fitness..."
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Additional Terms */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Terms & Conditions</h3>
        
        <Textarea
          value={policiesData.customTerms}
          onChange={(e) => handleInputChange('customTerms', e.target.value)}
          placeholder="Add any additional terms, conditions, or policies specific to your tour..."
          rows={4}
        />
      </Card>

      {/* Policy Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📋 Policy Checklist</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Cancellation policy defined</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{policiesData.tourRules.filter(r => r.isActive).length} active tour rules</span>
          </div>
          <div className="flex items-center gap-2">
            {policiesData.liabilityWaiver ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span>Liability waiver {policiesData.liabilityWaiver ? 'required' : 'not required'}</span>
          </div>
          <div className="flex items-center gap-2">
            {policiesData.emergencyContact ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span>Emergency contact {policiesData.emergencyContact ? 'provided' : 'missing'}</span>
          </div>
        </div>
      </Card>

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
          Next: Schedule
        </Button>
      </div>
    </motion.div>
  );
}