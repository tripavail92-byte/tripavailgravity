import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface PartnerModeSwitchProps {
  isPartnerMode: boolean;
  onSwitchToTraveler: () => void;
  onBecomePartner: () => void;
  animationDelay?: number;
}

export function PartnerModeSwitch({ 
  isPartnerMode, 
  onSwitchToTraveler, 
  onBecomePartner, 
  animationDelay = 0.5 
}: PartnerModeSwitchProps) {
  if (isPartnerMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay }}
      >
        <div className="border-t border-gray-200 dark:border-border pt-4">
          <motion.button
            onClick={onSwitchToTraveler}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-foreground">Switch to Traveler Mode</h3>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Browse and book trips as a traveler</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      <div className="border-t border-gray-200 dark:border-border pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-3">Partner with us</h4>
        <motion.button
          onClick={onBecomePartner}
          className="w-full p-3 bg-gradient-to-r from-[#DB2777] to-[#7C3AED] rounded-2xl border border-gray-200 dark:border-border hover:from-[#BE185D] hover:to-[#6D28D9] transition-all text-left shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <h3 className="font-semibold text-white mb-1">Become a Partner</h3>
          <p className="text-sm text-white/90">Join TripAvail and grow your business</p>
        </motion.button>
      </div>
    </motion.div>
  );
}