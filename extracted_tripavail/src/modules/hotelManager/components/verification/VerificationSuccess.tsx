import { motion } from 'motion/react';
import { Star, Shield, Award, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { VerificationSuccessIcon } from '../../../../components/icons/verification/VerificationSuccessIcon';

interface VerificationSuccessProps {
  onContinue: () => void;
}

export const VerificationSuccess = ({ onContinue }: VerificationSuccessProps) => {
  const benefits = [
    {
      icon: Shield,
      title: "Trusted by guests",
      description: "Your verified status builds confidence with potential guests"
    },
    {
      icon: Star,
      title: "Higher visibility",
      description: "Verified properties appear higher in search results"
    },
    {
      icon: Award,
      title: "Premium features",
      description: "Access exclusive tools and promotional opportunities"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", damping: 20 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Success Animation */}
        <motion.div 
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <VerificationSuccessIcon className="w-32 h-32 mx-auto mb-6" />
          
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            You're verified!
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Congratulations! Your hotel is now ready to welcome guests.
          </motion.p>
        </motion.div>

        {/* Benefits */}
        <motion.div 
          className="space-y-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h2 className="text-lg font-semibold text-center mb-4">What this means for you:</h2>
          
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2 + index * 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#5FAD43] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-[#5FAD43]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="pt-6"
        >
          <Button
            onClick={onContinue}
            className="w-full bg-[#5FAD43] hover:bg-[#4A9538] text-white py-4 text-lg"
          >
            Start hosting
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Confetti Animation */}
        <motion.div
          className="fixed inset-0 pointer-events-none z-[-1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#5FAD43] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};