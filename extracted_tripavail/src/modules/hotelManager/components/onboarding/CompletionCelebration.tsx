import { motion } from 'motion/react';
import { Check, Sparkles, Star } from 'lucide-react';

interface CompletionCelebrationProps {
  stepName: string;
  onContinue?: () => void;
}

export function CompletionCelebration({ stepName, onContinue }: CompletionCelebrationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-8 mx-4 max-w-sm text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              y: [0, -100, -200],
              x: [0, Math.random() * 100 - 50]
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute top-16"
            style={{ left: `${20 + i * 10}%` }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        ))}
        
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-semibold text-gray-900 mb-2"
        >
          Great job! 🎉
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 mb-6"
        >
          {stepName} completed successfully!
        </motion.p>

        {/* Stars */}
        <motion.div 
          className="flex justify-center gap-1 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[1, 2, 3, 4, 5].map((star, index) => (
            <motion.div
              key={star}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.7 + index * 0.1,
                type: 'spring',
                damping: 15 
              }}
            >
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-sm text-gray-500"
        >
          Tap anywhere to continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
}