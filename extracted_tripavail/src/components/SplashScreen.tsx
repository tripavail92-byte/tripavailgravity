import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState<'logo' | 'explore' | 'complete'>('logo');

  useEffect(() => {
    // Logo stage - show for 2.5 seconds
    const logoTimer = setTimeout(() => {
      setStage('explore');
    }, 2500);

    // Explore stage - show for 4 seconds
    const exploreTimer = setTimeout(() => {
      setStage('complete');
      setTimeout(onComplete, 800);
    }, 6500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(exploreTimer);
    };
  }, [onComplete]);

  const travelImages = [
    {
      src: "https://images.unsplash.com/photo-1702743599501-a821d0b38b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcGFyYWRpc2V8ZW58MXx8fHwxNzU2Nzg3Mjk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Tropical beach paradise",
      size: "large"
    },
    {
      src: "https://images.unsplash.com/photo-1536707014829-340b2d17bd54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHNjZW5lcnl8ZW58MXx8fHwxNzU2ODMyNzAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Mountain landscape",
      size: "medium"
    },
    {
      src: "https://images.unsplash.com/photo-1514939775307-d44e7f10cabd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZSUyMG5pZ2h0fGVufDF8fHx8MTc1Njc4MDgyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "City skyline",
      size: "small"
    },
    {
      src: "https://images.unsplash.com/photo-1650965293194-bea742c33f4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNlcnQlMjBzdW5zZXQlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzU2ODA2MDE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Desert sunset",
      size: "medium"
    },
    {
      src: "https://images.unsplash.com/photo-1610044850302-07625664a2dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjB3YXRlcmZhbGwlMjBuYXR1cmV8ZW58MXx8fHwxNzU2ODE0MTM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Forest waterfall",
      size: "small"
    }
  ];

  const circlePositions = [
    { top: '15%', left: '50%', translateX: '-50%' }, // Top center - large
    { top: '30%', left: '25%' }, // Middle left - medium
    { top: '30%', right: '25%' }, // Middle right - small
    { bottom: '25%', left: '30%' }, // Bottom left - medium
    { bottom: '25%', right: '30%' } // Bottom right - small
  ];

  const getCircleSize = (size: string) => {
    switch (size) {
      case 'large': return 'w-28 h-28';
      case 'medium': return 'w-20 h-20';
      case 'small': return 'w-16 h-16';
      default: return 'w-20 h-20';
    }
  };

  const smallDots = [
    { top: '20%', left: '70%' },
    { top: '45%', left: '15%' },
    { top: '60%', right: '15%' },
    { bottom: '35%', left: '60%' }
  ];

  return (
    <div className="relative size-full bg-white overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'logo' && (
          <motion.div
            key="logo"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Logo Icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#E11D48' }}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.5,
                  type: "spring",
                  stiffness: 200
                }}
              >
                <Globe className="w-8 h-8 text-white" />
              </motion.div>

              {/* Brand Text */}
              <motion.div
                className="flex items-baseline justify-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <span 
                  className="text-3xl"
                  style={{ color: '#E11D48', fontWeight: 'bold' }}
                >
                  Trip
                </span>
                <span 
                  className="text-3xl text-gray-900"
                  style={{ fontWeight: 'bold' }}
                >
                  Avail
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {stage === 'explore' && (
          <motion.div
            key="explore"
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
          >
            {/* Circular Travel Images */}
            <div className="relative w-full max-w-md h-80 mb-12">
              {travelImages.map((image, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${getCircleSize(image.size)} rounded-full overflow-hidden shadow-xl`}
                  style={{
                    ...circlePositions[index],
                    transform: circlePositions[index].translateX ? 
                      `translateX(${circlePositions[index].translateX})` : 'none'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.3 + (index * 0.1),
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <ImageWithFallback
                    src={image.src}
                    alt={image.alt}
                    className="size-full object-cover"
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                </motion.div>
              ))}

              {/* Small decorative dots */}
              {smallDots.map((position, index) => (
                <motion.div
                  key={`dot-${index}`}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: '#E11D48',
                    ...position
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.8 + (index * 0.1) 
                  }}
                />
              ))}
            </div>

            {/* Text Content */}
            <motion.div
              className="text-center max-w-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-2xl text-gray-900 mb-3">
                Explore the World
              </h2>
              <p className="mb-1">
                with <span style={{ color: '#E11D48' }}>TripAvail</span>
              </p>
              
              <motion.p
                className="text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                Embark on an unforgettable journey by
                venturing outside of your comfort zone.
                The world is full of hidden gems just
                waiting to be discovered.
              </motion.p>

              {/* Get Started Button */}
              <motion.button
                className="w-full py-4 rounded-xl text-white flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: '#E11D48' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onComplete}
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Floating particles animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 rounded-full opacity-30"
                  style={{ 
                    backgroundColor: '#E11D48',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}