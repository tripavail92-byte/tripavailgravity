import { motion } from 'motion/react';
import { ArrowLeft, Building, Plane, Star, TrendingUp, Users, Calendar, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PartnerSelectionProps {
  onBack: () => void;
  onSelectPartnerMode: (mode: 'hotel_manager' | 'tour_operator') => void;
}

export function PartnerSelection({ onBack, onSelectPartnerMode }: PartnerSelectionProps) {
  return (
    <div className="size-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-background dark:to-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-border/50 z-20 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-foreground" />
            </motion.button>
            
            <div>
              <h1 className="text-xl text-gray-900 dark:text-foreground">Become a Partner</h1>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Join TripAvail and grow your business</p>
            </div>
          </div>
          
          {/* TripAvail Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">
              <span className="text-primary">Trip</span>
              <span className="text-gray-900 dark:text-foreground"> Avail</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-8 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-partner flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Users className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl text-gray-900 dark:text-foreground mb-4">
            Choose Your Partnership
          </h2>
          <p className="text-lg text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
            Join thousands of partners who have grown their business with TripAvail's platform
          </p>
        </motion.div>

        {/* Partner Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Hotel Manager Card */}
          <motion.div
            className="relative bg-white dark:bg-card rounded-3xl shadow-modern border border-gray-200/50 dark:border-border overflow-hidden group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            {/* Popular Badge */}
            <div className="absolute top-6 right-6 z-10">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full text-sm font-medium shadow-sm">
                <Star className="w-4 h-4" />
                500+ hotels partnered
              </div>
            </div>

            {/* Hero Image Section */}
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 opacity-90">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Building className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Title Section */}
              <div className="mb-6">
                <h3 className="text-2xl text-gray-900 dark:text-foreground mb-2">Hotel Manager</h3>
                <p className="text-rose-600 dark:text-rose-400 font-medium">Create and manage your experiences</p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2.5 flex-shrink-0"></div>
                  <span>Create and manage your experiences</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2.5 flex-shrink-0"></div>
                  <span>Real-time revenue tracking and analytics</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2.5 flex-shrink-0"></div>
                  <span>Professional property management tools</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2.5 flex-shrink-0"></div>
                  <span>24/7 customer support and assistance</span>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={() => onSelectPartnerMode('hotel_manager')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Tour Operator Card */}
          <motion.div
            className="relative bg-white dark:bg-card rounded-3xl shadow-modern border border-gray-200/50 dark:border-border overflow-hidden group"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            {/* Trending Badge */}
            <div className="absolute top-6 right-6 z-10">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full text-sm font-medium shadow-sm">
                <TrendingUpIcon className="w-4 h-4" />
                14K+ operators active
              </div>
            </div>

            {/* Hero Image Section */}
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-600 opacity-90">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Plane className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Title Section */}
              <div className="mb-6">
                <h3 className="text-2xl text-gray-900 dark:text-foreground mb-2">Tour Operator</h3>
                <p className="text-violet-600 dark:text-violet-400 font-medium">Create and manage your experiences</p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2.5 flex-shrink-0"></div>
                  <span>Create and manage your experiences</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2.5 flex-shrink-0"></div>
                  <span>Custom itineraries and group bookings</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2.5 flex-shrink-0"></div>
                  <span>Advanced tour management dashboard</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600 dark:text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2.5 flex-shrink-0"></div>
                  <span>Marketing tools and customer insights</span>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={() => onSelectPartnerMode('tour_operator')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="bg-white dark:bg-card rounded-3xl p-8 border border-gray-200/50 dark:border-border shadow-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl text-gray-900 dark:text-foreground mb-2">Join Our Growing Community</h3>
            <p className="text-gray-600 dark:text-muted-foreground">Trusted by thousands of partners worldwide</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-4xl font-bold bg-gradient-partner bg-clip-text text-transparent mb-2">12K+</div>
              <div className="text-sm text-gray-600 dark:text-muted-foreground">Active Partners</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-4xl font-bold bg-gradient-partner bg-clip-text text-transparent mb-2">150K+</div>
              <div className="text-sm text-gray-600 dark:text-muted-foreground">Bookings Monthly</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="text-4xl font-bold bg-gradient-partner bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-muted-foreground">Partner Satisfaction</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            Questions about partnership? {' '}
            <button className="text-primary hover:text-primary/80 underline transition-colors">
              Contact our partner team
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}