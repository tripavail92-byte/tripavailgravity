import { motion } from 'motion/react';
import { Award, Star, Target, Zap, Crown, Shield } from 'lucide-react';

interface MotivationalBadgeProps {
  completedSteps: number;
  totalSteps: number;
}

const BADGES = [
  { 
    threshold: 1, 
    icon: Zap, 
    title: 'Getting Started', 
    message: 'First step complete!',
    color: 'from-blue-400 to-blue-600'
  },
  { 
    threshold: 3, 
    icon: Target, 
    title: 'Making Progress', 
    message: 'Halfway there!',
    color: 'from-green-400 to-green-600'
  },
  { 
    threshold: 5, 
    icon: Award, 
    title: 'Almost There', 
    message: 'You\'re on fire!',
    color: 'from-orange-400 to-orange-600'
  },
  { 
    threshold: 7, 
    icon: Crown, 
    title: 'Hotel Master', 
    message: 'Setup complete!',
    color: 'from-purple-400 to-purple-600'
  },
];

export function MotivationalBadge({ completedSteps, totalSteps }: MotivationalBadgeProps) {
  const currentBadge = BADGES
    .slice()
    .reverse()
    .find(badge => completedSteps >= badge.threshold);

  if (!currentBadge) return null;

  const progress = (completedSteps / totalSteps) * 100;
  const BadgeIcon = currentBadge.icon;

  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', delay: 0.3 }}
      className="mb-6"
    >
      <div className={`bg-gradient-to-r ${currentBadge.color} rounded-2xl p-6 text-white text-center relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10" />
        </div>

        <div className="relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center"
          >
            <BadgeIcon className="w-6 h-6" />
          </motion.div>

          <h3 className="font-semibold text-lg mb-1">{currentBadge.title}</h3>
          <p className="text-white/90 text-sm mb-3">{currentBadge.message}</p>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 bg-white/20 rounded-full h-2 max-w-32">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <span className="text-xs font-medium">
              {completedSteps}/{totalSteps}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}