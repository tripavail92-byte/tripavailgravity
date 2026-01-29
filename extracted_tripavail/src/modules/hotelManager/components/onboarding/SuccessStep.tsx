import { motion } from 'motion/react';
import { CheckCircle, Clock, Mail, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

interface SuccessStepProps {
  data: any;
  onNext: () => void;
}

export function SuccessStep({ data, onNext }: SuccessStepProps) {
  const nextSteps = [
    {
      icon: Clock,
      title: 'Admin Review',
      description: 'Our team will review your submission within 24-48 hours',
      status: 'pending'
    },
    {
      icon: Mail,
      title: 'Email Notification',
      description: 'You\'ll receive updates about your listing status',
      status: 'upcoming'
    },
    {
      icon: Smartphone,
      title: 'Push Notifications',
      description: 'Get instant notifications about bookings and reviews',
      status: 'upcoming'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-6 text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="relative"
      >
        <motion.div
          className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 0 0 rgba(34, 197, 94, 0.7)',
              '0 0 0 20px rgba(34, 197, 94, 0)',
              '0 0 0 0 rgba(34, 197, 94, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <motion.h1 
          className="text-2xl font-semibold text-gray-900"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background: 'linear-gradient(90deg, #1f2937, #10b981, #1f2937)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome to TripAvail! 🎉
        </motion.h1>
        <p className="text-gray-600">
          Your hotel listing has been submitted for review. You're joining over 50,000 successful hotel partners worldwide!
        </p>
        
        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4 p-3 bg-green-50 rounded-lg"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-green-800">
            <strong>234</strong> hotels joined this week!
          </p>
        </motion.div>
      </motion.div>

      {/* Submission Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="space-y-2">
            <h3 className="font-medium text-green-900">Submission Details</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p><strong>Hotel:</strong> {data.hotelName}</p>
              <p><strong>Contact:</strong> {data.email}</p>
              <p><strong>Submitted:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="space-y-4"
      >
        <h3 className="font-semibold text-gray-900">What happens next?</h3>
        
        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    step.status === 'pending' 
                      ? 'bg-orange-100' 
                      : 'bg-gray-100'
                  }`}>
                    <step.icon className={`w-4 h-4 ${
                      step.status === 'pending' 
                        ? 'text-orange-600' 
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {step.status === 'pending' && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Benefits After Approval */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7 }}
        className="bg-blue-50 p-4 rounded-lg border border-blue-200"
      >
        <h4 className="font-medium text-blue-900 mb-2">After Approval</h4>
        <ul className="text-sm text-blue-800 space-y-1 text-left">
          <li>• Create and publish travel packages</li>
          <li>• Access advanced analytics dashboard</li>
          <li>• Manage bookings and guest communications</li>
          <li>• Start earning revenue from travelers</li>
        </ul>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="pt-4"
      >
        <Button
          onClick={onNext}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          size="lg"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Support */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1 }}
        className="text-center"
      >
        <p className="text-sm text-gray-500">
          Questions? Contact our support team at{' '}
          <a href="mailto:support@tripavail.com" className="text-green-600 hover:underline">
            support@tripavail.com
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}