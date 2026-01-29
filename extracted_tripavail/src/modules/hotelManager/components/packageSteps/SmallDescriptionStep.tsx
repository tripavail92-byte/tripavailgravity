import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Sparkles, RefreshCw, Type, FileText } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';

interface SmallDescriptionStepProps {
  onComplete: (data: { 
    hotelName: string;
    title: string; 
    fullDescription: string;
  }) => void;
  onUpdate: (data: { 
    hotelName?: string;
    title?: string; 
    fullDescription?: string;
  }) => void;
  existingData?: { 
    packageType?: string;
    hotelName?: string;
    title?: string; 
    fullDescription?: string;
  };
}

export function SmallDescriptionStep({ onComplete, onUpdate, existingData }: SmallDescriptionStepProps) {
  const [hotelName, setHotelName] = useState(existingData?.hotelName || 'Grand Vista Hotel');
  const [title, setTitle] = useState(existingData?.title || '');
  const [fullDescription, setFullDescription] = useState(existingData?.fullDescription || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Auto-generate title suggestions based on package type
  const getTitleSuggestions = (packageType: string) => {
    const titleMap: { [key: string]: string[] } = {
      weekend: [
        "Weekend Escape Package",
        "Perfect Weekend Getaway",
        "Weekend Bliss Retreat"
      ],
      romantic: [
        "Romance & Roses Package",
        "Intimate Couples Retreat",
        "Love Story Experience"
      ],
      family: [
        "Family Fun Adventure",
        "Kids & Family Special",
        "Family Memories Package"
      ],
      business: [
        "Executive Business Package",
        "Corporate Elite Stay",
        "Business Traveler Special"
      ],
      adventure: [
        "Adventure Seeker Package",
        "Outdoor Explorer Experience",
        "Thrill & Chill Combo"
      ],
      culinary: [
        "Gourmet Experience Package",
        "Culinary Journey Special",
        "Taste & Stay Experience"
      ],
      wellness: [
        "Wellness & Spa Retreat",
        "Mind Body Soul Package",
        "Rejuvenation Experience"
      ],
      luxury: [
        "Ultimate Luxury Experience",
        "VIP Elite Package",
        "Platinum Indulgence"
      ]
    };

    return titleMap[packageType] || titleMap.weekend;
  };

  // Auto-suggestions based on package type for description
  const getDescriptionSuggestions = (packageType: string) => {
    const suggestionMap: { [key: string]: string[] } = {
      weekend: [
        "Escape the ordinary with a perfect weekend retreat featuring luxury amenities and relaxation. Unwind in style with our curated weekend experience designed for maximum comfort and enjoyment. Your ideal weekend getaway awaits with premium accommodations and memorable experiences.",
        "Experience the ultimate weekend escape with luxurious accommodations, world-class dining, and rejuvenating spa treatments. Perfect for couples or friends looking to recharge and create lasting memories in a serene setting."
      ],
      romantic: [
        "Rekindle romance with an intimate escape featuring candlelit dinners and couples' spa treatments. Create unforgettable memories with your loved one in our romantic sanctuary of luxury and intimacy. Celebrate love with enchanting experiences designed for couples seeking romance and connection.",
        "Ignite passion and romance with our exclusive couples' retreat. Enjoy private dining experiences, sunset views, couples massages, and luxurious suite accommodations designed to celebrate your love story."
      ],
      family: [
        "Adventure awaits the whole family with exciting activities, comfortable accommodations, and endless fun. Create lasting family memories with our specially curated experiences for guests of all ages. Perfect family getaway featuring kid-friendly amenities and entertainment for everyone to enjoy.",
        "Bring the whole family for an unforgettable experience with activities for all ages. From kids' clubs to family suites, we've thought of everything to make your family vacation stress-free and fun."
      ],
      business: [
        "Elevate your business travel with premium accommodations and professional amenities for success. Experience seamless business hospitality with executive services and comfortable meeting spaces. Where business meets luxury - premium corporate packages designed for the discerning professional.",
        "Maximize productivity and comfort with our business traveler package. Features include high-speed WiFi, executive lounge access, meeting room credits, and a dedicated workspace in your suite."
      ],
      adventure: [
        "Unleash your adventurous spirit with thrilling outdoor experiences and comfortable base camp accommodations. Epic adventures await with guided excursions, equipment rentals, and cozy mountain lodge comfort. For thrill-seekers and nature lovers - your gateway to unforgettable outdoor adventures.",
        "Feed your adventurous soul with hiking, rock climbing, kayaking, and more. All equipment and experienced guides included, with comfortable accommodations to rest after your exciting day."
      ],
      culinary: [
        "Embark on a gastronomic journey with world-class cuisine, wine tastings, and culinary masterclasses. Savor exceptional flavors with our chef-curated dining experiences and gourmet adventures. A feast for all senses featuring artisanal cuisine, premium ingredients, and culinary excellence.",
        "Indulge in a culinary adventure featuring multi-course tasting menus, sommelier-led wine pairings, cooking classes with our executive chef, and exclusive access to local food markets."
      ],
      wellness: [
        "Rejuvenate your mind, body, and soul with holistic wellness treatments and serene accommodations. Find your inner peace with transformative wellness experiences in a tranquil sanctuary setting. Restore balance and vitality with our comprehensive wellness retreat featuring spa treatments and mindfulness.",
        "Discover true relaxation with daily yoga sessions, meditation classes, therapeutic massages, organic wellness cuisine, and access to our state-of-the-art spa facilities."
      ],
      luxury: [
        "Indulge in unparalleled luxury with exclusive VIP services, premium amenities, and world-class hospitality. Experience the pinnacle of hospitality with bespoke services and ultra-luxury accommodations. Where opulence meets excellence - an exclusive experience crafted for the most discerning guests.",
        "Experience absolute luxury with butler service, private transfers, Michelin-star dining, premium suite accommodations, and personalized concierge attention to every detail."
      ]
    };

    return suggestionMap[packageType] || suggestionMap.weekend;
  };

  const titleSuggestions = getTitleSuggestions(existingData?.packageType || 'weekend');
  const descriptionSuggestions = getDescriptionSuggestions(existingData?.packageType || 'weekend');

  const handleGenerateSuggestion = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomSuggestion = descriptionSuggestions[Math.floor(Math.random() * descriptionSuggestions.length)];
      setFullDescription(randomSuggestion);
      onUpdate({ fullDescription: randomSuggestion });
      setIsGenerating(false);
    }, 1000);
  };

  const handleHotelNameChange = (value: string) => {
    setHotelName(value);
    onUpdate({ hotelName: value });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onUpdate({ title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setFullDescription(value);
    onUpdate({ fullDescription: value });
  };

  const handleContinue = () => {
    if (hotelName.trim() && title.trim() && fullDescription.trim()) {
      onComplete({ 
        hotelName: hotelName.trim(),
        title: title.trim(),
        fullDescription: fullDescription.trim() 
      });
    }
  };

  const isValid = hotelName.trim().length >= 2 && 
                 title.trim().length >= 5 && 
                 fullDescription.trim().length >= 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2"
      >
        <h1 className="text-3xl tracking-tight text-gray-900">
          Package Details
        </h1>
        <p className="text-gray-600 text-base">
          Set up the fundamental details of your package including title, full description, and hotel information.
        </p>
      </motion.div>

      {/* Hotel/Property Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-400" />
          <label className="text-base text-gray-900">
            Hotel/Property Name
          </label>
        </div>
        
        <motion.div
          animate={{
            scale: focusedField === 'hotelName' ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Input
            value={hotelName}
            onChange={(e) => handleHotelNameChange(e.target.value)}
            onFocus={() => setFocusedField('hotelName')}
            onBlur={() => setFocusedField(null)}
            placeholder="Grand Vista Hotel"
            className="h-14 text-base border-gray-200 focus:border-gray-400 transition-all duration-200 bg-white rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
          />
        </motion.div>
        
        <p className="text-sm text-gray-500 pl-1">
          This will appear as the property name for your package
        </p>
      </motion.div>

      {/* Package Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-base text-gray-900">
            Package Title
          </label>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: title.length > 0 ? 1 : 0 }}
            className={`text-sm ${
              title.length > 60 ? 'text-amber-600' : 'text-gray-400'
            }`}
          >
            {title.length}/80
          </motion.span>
        </div>
        
        <motion.div
          animate={{
            scale: focusedField === 'title' ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            placeholder="Weekend Escape Package"
            className="h-14 text-base border-gray-200 focus:border-gray-400 transition-all duration-200 bg-white rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            maxLength={80}
          />
        </motion.div>
      </motion.div>

      {/* Detailed Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-base text-gray-900">
            Detailed Description
          </label>
          <Button
            size="sm"
            onClick={handleGenerateSuggestion}
            disabled={isGenerating}
            className="gradient-hotel-manager text-white hover:opacity-90 transition-opacity"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'AI Suggest'}
          </Button>
        </div>
        
        <motion.div
          animate={{
            scale: focusedField === 'description' ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Textarea
            value={fullDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            placeholder="Provide a comprehensive description of your package. Include what's included, special features, amenities, and what makes it unique..."
            className="min-h-[180px] resize-none text-base border-gray-200 focus:border-gray-400 transition-all duration-200 bg-white rounded-xl shadow-sm hover:shadow-md focus:shadow-lg leading-relaxed"
            maxLength={1000}
          />
        </motion.div>
        
        <div className="flex items-center justify-between text-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: fullDescription.length > 0 ? 1 : 0 }}
            className="flex items-center gap-2"
          >
            {fullDescription.length < 100 && (
              <span className="text-amber-600">
                {100 - fullDescription.length} more characters needed
              </span>
            )}
            {fullDescription.length >= 100 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-emerald-600 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                Good length
              </motion.span>
            )}
          </motion.div>
          <span className={`text-sm ${
            fullDescription.length > 900 ? 'text-amber-600' : 'text-gray-400'
          }`}>
            {fullDescription.length}/1000
          </span>
        </div>
        
        <p className="text-sm text-gray-500 pl-1">
          Focus on unique features and experiences. Use emotional language that resonates with your target audience.
        </p>
      </motion.div>

      {/* Live Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 p-6 shadow-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5"></div>
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 uppercase tracking-wider">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            Live Preview
          </div>

          <motion.div
            key={`preview-hotel-${hotelName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Property</p>
            <p className="text-lg text-gray-900">
              {hotelName || 'Grand Vista Hotel'}
            </p>
          </motion.div>

          <motion.div
            key={`preview-title-${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Package Title</p>
            <p className="text-2xl tracking-tight text-gray-900">
              {title || 'Weekend Escape Package'}
            </p>
          </motion.div>

          <motion.div
            key={`preview-desc-${fullDescription.substring(0, 50)}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
            <p className="text-base text-gray-600 leading-relaxed">
              {fullDescription || 'Your detailed package description will appear here...'}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Writing Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="p-4 bg-gray-50 border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Writing Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Focus on unique features and experiences</li>
            <li>• Use emotional language that resonates with your target audience</li>
            <li>• Highlight the value and benefits guests will receive</li>
            <li>• Keep it concise but compelling</li>
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}
