import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, RefreshCw, Check, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface PropertyDescriptionAIProps {
  propertyType: string;
  hotelName?: string;
  onSuggestionSelect: (suggestion: string) => void;
  className?: string;
}

export function PropertyDescriptionAI({ 
  propertyType, 
  hotelName, 
  onSuggestionSelect, 
  className = "" 
}: PropertyDescriptionAIProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // AI-powered suggestion templates based on property type
  const getPropertySuggestions = (type: string, name?: string) => {
    const propertyName = name || "our property";
    
    const templates = {
      hotel: [
        `Experience exceptional comfort at ${propertyName}, where modern amenities meet warm hospitality. Our thoughtfully designed rooms offer the perfect retreat for both business and leisure travelers, with premium facilities and personalized service that ensures every stay is memorable.`,
        `Welcome to ${propertyName}, a sophisticated hotel that combines contemporary elegance with timeless comfort. Located in the heart of the city, we offer luxurious accommodations, world-class dining, and exceptional service that caters to discerning travelers seeking an unforgettable experience.`,
        `${propertyName} redefines hospitality with our blend of modern luxury and genuine care. From our stylishly appointed rooms to our attentive staff, every detail is crafted to exceed expectations and create lasting memories for our valued guests.`
      ],
      boutique: [
        `Discover the unique charm of ${propertyName}, an intimate boutique property where every corner tells a story. Our carefully curated spaces blend artistic flair with modern comfort, offering a distinctive stay that reflects local culture and provides personalized experiences for the discerning traveler.`,
        `${propertyName} is a gem of contemporary design and authentic character. This boutique haven offers an exclusive atmosphere with handpicked furnishings, local artwork, and bespoke services that create an intimate and memorable stay unlike any other.`,
        `Step into ${propertyName}, where boutique luxury meets local authenticity. Our thoughtfully designed spaces feature unique décor, artisanal touches, and personalized service, creating an intimate retreat that celebrates individuality and style.`
      ],
      resort: [
        `Escape to ${propertyName}, a luxurious resort destination where relaxation meets adventure. Surrounded by stunning natural beauty, our comprehensive facilities include world-class spa services, recreational activities, and gourmet dining, all designed to create the ultimate vacation experience.`,
        `${propertyName} offers an all-encompassing resort experience with pristine accommodations, diverse dining options, and endless recreational possibilities. Whether seeking relaxation or adventure, guests enjoy access to premium amenities in a breathtaking setting.`,
        `Immerse yourself in the luxury of ${propertyName}, where every moment is designed for indulgence. Our resort features expansive grounds, multiple dining venues, recreational facilities, and spa services, creating an idyllic escape from everyday life.`
      ],
      motel: [
        `${propertyName} provides comfortable, convenient accommodation for travelers seeking quality and value. Our well-appointed rooms offer modern amenities, easy parking access, and friendly service, making us the perfect choice for road trips and extended stays.`,
        `Experience reliable comfort at ${propertyName}, where we combine affordability with quality service. Our clean, comfortable rooms and convenient location make us ideal for business travelers and families seeking practical accommodation without compromising on comfort.`,
        `Choose ${propertyName} for your next stay and enjoy straightforward hospitality with all essential amenities. Our property offers comfortable rooms, convenient access, and friendly service at exceptional value for money.`
      ],
      lodge: [
        `Nestled in nature's embrace, ${propertyName} offers a rustic retreat that combines outdoor adventure with comfortable accommodation. Our lodge provides the perfect base for exploring the natural beauty while enjoying warm hospitality and hearty cuisine in a cozy, welcoming atmosphere.`,
        `${propertyName} is your gateway to nature's wonders, offering comfortable lodge accommodation surrounded by scenic landscapes. Experience the perfect blend of outdoor adventure and indoor comfort, with facilities designed for relaxation after a day of exploration.`,
        `Discover the charm of ${propertyName}, where mountain hospitality meets modern comfort. Our lodge offers cozy accommodations, local cuisine, and easy access to outdoor activities, creating the ideal retreat for nature lovers and adventure seekers.`
      ],
      inn: [
        `Welcome to ${propertyName}, a charming inn where traditional hospitality creates a home-away-from-home experience. Our cozy accommodations, personalized service, and warm atmosphere make every guest feel like part of the family while exploring the local area.`,
        `${propertyName} embodies the warmth and character of a traditional inn with modern comforts. Our intimate setting, comfortable rooms, and friendly service create a welcoming environment where guests can relax and enjoy authentic local hospitality.`,
        `Experience the intimate charm of ${propertyName}, where every guest receives personalized attention in our cozy, welcoming environment. Our inn combines comfortable accommodations with local character, creating memorable stays filled with genuine hospitality.`
      ],
      guesthouse: [
        `${propertyName} offers a warm, home-like atmosphere where guests enjoy comfortable accommodation in a family-friendly environment. Our personalized service, comfortable rooms, and local insights create an authentic experience that makes travelers feel truly welcome.`,
        `Discover the comfort of ${propertyName}, a welcoming guesthouse that provides intimate accommodation with personal touches. Our family-run property offers clean, comfortable rooms and local hospitality that ensures a memorable and authentic travel experience.`,
        `Experience genuine hospitality at ${propertyName}, where our guesthouse provides comfortable, affordable accommodation with a personal touch. Enjoy home-style comfort, friendly service, and local recommendations that enhance your travel experience.`
      ],
      hostel: [
        `${propertyName} offers vibrant, budget-friendly accommodation perfect for young travelers and backpackers. Our social atmosphere, clean facilities, and prime location create the ideal base for exploring while meeting fellow adventurers from around the world.`,
        `Join the community at ${propertyName}, where budget-conscious travelers find comfortable beds, social spaces, and modern amenities. Our hostel combines affordability with cleanliness and security, making it the perfect choice for solo travelers and groups.`,
        `${propertyName} provides exceptional value accommodation with a focus on community and comfort. Our modern facilities, social areas, and friendly atmosphere create the perfect environment for budget travelers seeking authentic experiences and new friendships.`
      ]
    };

    return templates[type as keyof typeof templates] || templates['hotel'];
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    setSelectedSuggestion(null);
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSuggestions = getPropertySuggestions(propertyType, hotelName);
    setSuggestions(newSuggestions);
    setIsGenerating(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    onSuggestionSelect(suggestion);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Suggestion Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isGenerating ? 360 : 0 }}
            transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-[#ff5a5f]" />
          </motion.div>
          <span className="text-sm font-medium text-gray-700">AI Writing Assistant</span>
        </div>
        
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating || !propertyType}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Ideas'}
        </Button>
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff5a5f]" />
              AI-Generated Suggestions
            </h4>
            
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedSuggestion === suggestion
                      ? 'border-[#ff5a5f] bg-[#ff5a5f]/5 shadow-md'
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">
                      {suggestion}
                    </p>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      {selectedSuggestion === suggestion && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Check className="w-4 h-4 text-[#ff5a5f]" />
                        </motion.div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(suggestion);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Click any suggestion to use it, or use it as inspiration for your own description
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {suggestions.length === 0 && !isGenerating && (
        <Card className="p-6 text-center border-dashed border-2 border-gray-200">
          <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">
            Get AI-powered description suggestions
          </p>
          <p className="text-xs text-gray-400">
            Select a property type above and click "Generate Ideas" to get started
          </p>
        </Card>
      )}
    </div>
  );
}