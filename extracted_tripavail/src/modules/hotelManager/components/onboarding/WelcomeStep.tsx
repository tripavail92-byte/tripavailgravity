import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Hotel, Users, TrendingUp } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Card } from '../../../../components/ui/card';

interface WelcomeStepProps {
  data: any;
  onComplete: (data: any) => void;
}

export function WelcomeStep({ data, onComplete }: WelcomeStepProps) {
  const [formData, setFormData] = useState({
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const stats = [
    { icon: Hotel, label: 'Hotels Listed', value: '50K+', color: 'text-blue-600' },
    { icon: Users, label: 'Happy Guests', value: '2M+', color: 'text-green-600' },
    { icon: TrendingUp, label: 'Revenue Growth', value: '300%', color: 'text-purple-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-6"
    >
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200"
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hotel className="w-10 h-10 text-white" />
          </motion.div>
        </motion.div>
        
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            List your hotel on TripAvail in minutes
          </h1>
          <p className="text-gray-600">
            Get bookings fast, connect with travelers worldwide.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-3 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <motion.div
            animate={errors.fullName ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className={`transition-all duration-200 ${
                errors.fullName 
                  ? 'border-red-500 bg-red-50' 
                  : formData.fullName 
                  ? 'border-green-500 bg-green-50' 
                  : ''
              }`}
              autoComplete="name"
            />
          </motion.div>
          <AnimatePresence>
            {errors.fullName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-red-500 flex items-center gap-1"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  ⚠️
                </motion.span>
                {errors.fullName}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
          size="lg"
        >
          Start Listing
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-center"
      >
        <p className="text-sm text-gray-500">
          Join thousands of successful hotel partners
        </p>
      </motion.div>
    </motion.div>
  );
}