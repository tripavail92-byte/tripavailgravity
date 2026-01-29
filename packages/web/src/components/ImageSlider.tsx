import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface ImageSliderProps {
    images: string[];
    alt: string;
    className?: string;
    autoSlideDelay?: number;
}

export function ImageSlider({
    images,
    alt,
    className = "w-full h-full object-cover",
    autoSlideDelay = 5000
}: ImageSliderProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, autoSlideDelay);

        return () => clearInterval(timer);
    }, [images.length, autoSlideDelay]);

    const goToImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    if (images.length === 0) return null;

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Images */}
            <div className="relative w-full h-full">
                {images.map((image, index) => (
                    <motion.div
                        key={`img-${index}`}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                            opacity: index === currentImageIndex ? 1 : 0,
                            scale: index === currentImageIndex ? 1 : 1.1
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                        <img
                            src={image}
                            alt={`${alt} ${index + 1}`}
                            className={className}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Image Indicators - Only show if more than 1 image */}
            {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, index) => (
                        <motion.button
                            key={`dot-${index}`}
                            onClick={() => goToImage(index)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/70'
                                }`}
                            whileTap={{ scale: 0.9 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
