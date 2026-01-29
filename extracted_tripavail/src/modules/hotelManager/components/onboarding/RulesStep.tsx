import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Users, PawPrint, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Switch } from '../../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Card } from '../../../../components/ui/card';

interface RulesStepProps {
  data: any;
  onComplete: (data: any) => void;
}

export function RulesStep({ data, onComplete }: RulesStepProps) {
  const [formData, setFormData] = useState({
    checkIn: data.checkIn || '14:00',
    checkOut: data.checkOut || '12:00',
    childrenPolicy: data.childrenPolicy ?? true,
    childrenAgeLimit: data.childrenAgeLimit || 12,
    petPolicy: data.petPolicy ?? false,
    petTypes: data.petTypes || [],
    petFee: data.petFee || 0,
    otherRules: data.otherRules || '',
  });

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const petTypeOptions = ['Dogs', 'Cats', 'Small pets', 'Service animals'];

  const handleSubmit = () => {
    onComplete(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center"
        >
          <FileText className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Hotel Rules & Policies
          </h2>
          <p className="text-gray-600">
            Set your check-in times and policies
          </p>
        </div>
      </div>

      {/* Check-in/Check-out Times */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Check-in & Check-out</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-In Time</Label>
              <Select value={formData.checkIn} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, checkIn: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Check-Out Time</Label>
              <Select value={formData.checkOut} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, checkOut: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Children Policy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Children Policy</h3>
            </div>
            <Switch
              checked={formData.childrenPolicy}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, childrenPolicy: checked }))
              }
            />
          </div>
          
          {formData.childrenPolicy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <div>
                <Label>Age limit for children</Label>
                <Input
                  type="number"
                  value={formData.childrenAgeLimit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    childrenAgeLimit: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="12"
                  className="mt-1"
                />
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Pet Policy */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PawPrint className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Pet Policy</h3>
            </div>
            <Switch
              checked={formData.petPolicy}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, petPolicy: checked }))
              }
            />
          </div>
          
          {formData.petPolicy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <div>
                <Label>Allowed pet types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {petTypeOptions.map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.petTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              petTypes: [...prev.petTypes, type] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              petTypes: prev.petTypes.filter(t => t !== type) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Pet fee (per night)</Label>
                <Input
                  type="number"
                  value={formData.petFee}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    petFee: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Other Rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <Label>Other Rules (Optional)</Label>
        <Textarea
          value={formData.otherRules}
          onChange={(e) => setFormData(prev => ({ ...prev, otherRules: e.target.value }))}
          placeholder="e.g., No smoking in rooms, Quiet hours 10 PM - 7 AM, Pool closes at 9 PM..."
          rows={4}
        />
        <p className="text-xs text-gray-500">
          Include any additional rules or policies guests should know about
        </p>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}