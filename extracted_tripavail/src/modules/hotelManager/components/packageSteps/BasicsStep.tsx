import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Sparkles, ChevronRight } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';

interface BasicsStepProps {
  onComplete: (data: { title: string; fullDescription: string; hotelName: string }) => void;
  onUpdate: (data: { title?: string; fullDescription?: string; hotelName?: string }) => void;
  existingData?: { 
    title?: string; 
    fullDescription?: string; 
    hotelName?: string;
    packageType?: string;
    smallDescription?: string;
  };
}

export function BasicsStep({ onComplete, onUpdate, existingData }: BasicsStepProps) {
  const [title, setTitle] = useState(existingData?.title || '');
  const [fullDescription, setFullDescription] = useState(existingData?.fullDescription || '');
  const [hotelName, setHotelName] = useState(existingData?.hotelName || 'Grand Vista Hotel');
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

  const titleSuggestions = getTitleSuggestions(existingData?.packageType || 'weekend');

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onUpdate({ title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setFullDescription(value);
    onUpdate({ fullDescription: value });
  };

  const handleHotelNameChange = (value: string) => {
    setHotelName(value);
    onUpdate({ hotelName: value });
  };

  const handleContinue = () => {
    if (title.trim() && fullDescription.trim() && hotelName.trim()) {
      onComplete({
        title: title.trim(),
        fullDescription: fullDescription.trim(),
        hotelName: hotelName.trim()
      });
    }
  };

  const isValid = title.trim().length >= 5 && 
                 fullDescription.trim().length >= 100 && 
                 hotelName.trim().length >= 2;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2"
      >
        <h1 className="text-3xl tracking-tight text-gray-900">
          Package Basics
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
            placeholder="Create an attractive package title"
            className="h-14 text-base border-gray-200 focus:border-gray-400 transition-all duration-200 bg-white rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
            maxLength={80}
          />
        </motion.div>

        {/* Quick Suggestions */}
        <AnimatePresence>
          {title.length === 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex items-center gap-1.5 text-sm text-gray-600 pl-1">
                <Sparkles className="w-4 h-4" />
                <span>Quick suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {titleSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleTitleChange(suggestion)}
                    className="group relative px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    {suggestion}
                    <ChevronRight className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: fullDescription.length > 0 ? 1 : 0 }}
            className="flex items-center gap-2"
          >
            {fullDescription.length < 100 && (
              <span className="text-sm text-amber-600">
                {100 - fullDescription.length} more needed
              </span>
            )}
            {fullDescription.length >= 100 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm text-emerald-600 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                Good length
              </motion.span>
            )}
            <span className={`text-sm ${
              fullDescription.length > 900 ? 'text-amber-600' : 'text-gray-400'
            }`}>
              {fullDescription.length}/1000
            </span>
          </motion.div>
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
            key={hotelName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Property</p>
            <p className="text-lg text-gray-900">
              {hotelName || 'Your Hotel Name'}
            </p>
          </motion.div>

          <motion.div
            key={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider">Package Title</p>
            <p className="text-2xl tracking-tight text-gray-900">
              {title || 'Your Package Title'}
            </p>
          </motion.div>

          <motion.div
            key={fullDescription}
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

      {/* Validation Messages */}
      <AnimatePresence>
        {!isValid && (title.length > 0 || fullDescription.length > 0 || hotelName.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <p className="text-sm text-amber-900 font-medium">Please complete the following:</p>
            <ul className="text-sm text-amber-700 space-y-1 pl-4">
              {hotelName.trim().length < 2 && (
                <li className="list-disc">Hotel name (at least 2 characters)</li>
              )}
              {title.trim().length < 5 && (
                <li className="list-disc">Package title (at least 5 characters)</li>
              )}
              {fullDescription.trim().length < 100 && (
                <li className="list-disc">
                  Description ({100 - fullDescription.trim().length} more characters needed)
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
