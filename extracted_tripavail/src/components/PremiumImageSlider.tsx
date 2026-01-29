import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import exampleImage from 'figma:asset/b6230fc835fed9ea5388a6f9992b752e090375d2.png';

interface SlideData {
  id: number;
  image: string;
  title: string;
  location: string;
  description: string;
  type: 'hotel' | 'tour';
  rating: number;
  price: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1673964566152-2aee6bc89929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0fGVufDF8fHx8MTc1NjgwODk3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Paradise Beach Resort",
    location: "Maldives",
    description: "Luxury overwater villas with crystal clear waters",
    type: "hotel",
    rating: 4.9,
    price: "$850"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1488824563702-192b69231ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGFkdmVudHVyZSUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3NTY5MDg0NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Himalayan Adventure Trek",
    location: "Nepal",
    description: "Epic mountain adventure with breathtaking views",
    type: "tour",
    rating: 4.8,
    price: "$1,200"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1742276792355-9becd4c4829e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjaXR5JTIwaG90ZWwlMjBtb2Rlcm58ZW58MXx8fHwxNzU2OTIxOTkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Metropolitan Luxury Suite",
    location: "New York City",
    description: "Premium urban experience in the heart of Manhattan",
    type: "hotel",
    rating: 4.7,
    price: "$450"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1602410125631-7e736e36797c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWZhcmklMjB3aWxkbGlmZSUyMGFkdmVudHVyZXxlbnwxfHx8fDE3NTY4MzE5MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "African Safari Experience",
    location: "Kenya",
    description: "Wildlife adventure in the African savannah",
    type: "tour",
    rating: 4.9,
    price: "$2,500"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1696857674757-185edd346e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwdGVtcGxlJTIwY3VsdHVyYWwlMjBoZXJpdGFnZXxlbnwxfHx8fDE3NTY5MTc3NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Ancient Temples Discovery",
    location: "Cambodia",
    description: "Explore ancient wonders and cultural heritage",
    type: "tour",
    rating: 4.6,
    price: "$899"
  }
];

export function PremiumImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <motion.div 
      className="relative w-full h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Main Slider */}
      <div className="relative w-full h-full overflow-hidden rounded-3xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.4 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                nextSlide();
              } else if (swipe > swipeConfidenceThreshold) {
                prevSlide();
              }
            }}
            className="absolute w-full h-full"
          >
            {/* Background Image with Overlay */}
            <div 
              className="w-full h-full bg-cover bg-center relative"
              style={{ 
                backgroundImage: `url(${slides[currentSlide].image})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-3"
                >
                  {/* Type Badge */}
                  <motion.div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      slides[currentSlide].type === 'hotel' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}
                    style={{
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {slides[currentSlide].type === 'hotel' ? '🏨 Hotel' : '✈️ Tour'}
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold leading-tight">
                    {slides[currentSlide].title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-gray-200">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{slides[currentSlide].location}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {slides[currentSlide].description}
                  </p>

                  {/* Rating and Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{slides[currentSlide].rating}</span>
                    </div>
                    <div 
                      className="text-lg font-semibold"
                      style={{ color: '#5FAD43' }}
                    >
                      {slides[currentSlide].price}
                      <span className="text-xs text-gray-400 ml-1">
                        {slides[currentSlide].type === 'hotel' ? '/night' : '/person'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
        style={{ zIndex: 10 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
        style={{ zIndex: 10 }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2" style={{ zIndex: 10 }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'w-6 bg-white' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Premium Glow Effect */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 30px rgba(95, 173, 67, 0.1)'
        }}
      />
    </motion.div>
  );
}