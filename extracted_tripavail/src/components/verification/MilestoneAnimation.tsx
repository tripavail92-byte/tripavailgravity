import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Zap, Crown } from 'lucide-react';

interface MilestoneAnimationProps {
  milestone: number;
  isVisible: boolean;
  onComplete: () => void;
}

export const MilestoneAnimation = ({ milestone, isVisible, onComplete }: MilestoneAnimationProps) => {
  const getMilestoneConfig = (milestone: number) => {
    switch (milestone) {
      case 25:
        return {
          icon: Zap,
          color: '#3B82F6',
          bgColor: '#EBF4FF',
          title: 'Great Start!',
          subtitle: '25% Complete',
          particles: 8
        };
      case 50:
        return {
          icon: Star,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          title: 'Halfway There!',
          subtitle: '50% Complete',
          particles: 12
        };
      case 75:
        return {
          icon: Trophy,
          color: '#EF4444',
          bgColor: '#FEE2E2',
          title: 'Almost Done!',
          subtitle: '75% Complete',
          particles: 16
        };
      case 100:
        return {
          icon: Crown,
          color: '#5FAD43',
          bgColor: '#E8F5E3',
          title: 'Verification Complete!',
          subtitle: '100% Complete',
          particles: 20
        };
      default:
        return {
          icon: Star,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          title: 'Milestone Reached!',
          subtitle: `${milestone}% Complete`,
          particles: 10
        };
    }
  };

  const config = getMilestoneConfig(milestone);
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(config.particles)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: config.color }}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 80}vw`,
                  y: `${50 + (Math.random() - 0.5) * 80}vh`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main animation container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.8
            }}
            className="relative z-10"
            onAnimationComplete={() => {
              setTimeout(onComplete, 3000);
            }}
          >
            {/* Milestone card */}
            <div 
              className="rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-auto"
              style={{ backgroundColor: config.bgColor }}
            >
              {/* Icon with pulse animation */}
              <motion.div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: config.color }}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    `0 0 0 0 ${config.color}40`,
                    `0 0 0 20px ${config.color}00`,
                    `0 0 0 0 ${config.color}00`
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <IconComponent className="w-10 h-10 text-white" />
              </motion.div>

              {/* Text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {config.title}
                </h2>
                <p className="text-lg text-gray-700 mb-4">
                  {config.subtitle}
                </p>
                
                {milestone < 100 ? (
                  <p className="text-sm text-gray-600">
                    Keep going! You're doing great.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    🎉 Your hotel is now ready to welcome guests!
                  </p>
                )}
              </motion.div>

              {/* Progress celebration */}
              <motion.div
                className="mt-6"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone}%` }}
                    transition={{ delay: 0.7, duration: 1.5 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Verification Progress
                </p>
              </motion.div>
            </div>

            {/* Floating sparkles */}
            {milestone === 100 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`
                    }}
                    animate={{
                      rotate: [0, 360],
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-32 h-32 border-2 rounded-full"
              style={{ borderColor: config.color }}
              animate={{
                scale: [1, 3, 5],
                opacity: [0.6, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};