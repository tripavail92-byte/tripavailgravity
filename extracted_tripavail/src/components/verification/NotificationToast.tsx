import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCircle, AlertTriangle, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import type { VerificationNotification } from '../../hooks/useVerificationNotifications';

interface NotificationToastProps {
  notification: VerificationNotification;
  isVisible: boolean;
  onDismiss: () => void;
  onActionClick?: () => void;
}

export const NotificationToast = ({ 
  notification, 
  isVisible, 
  onDismiss, 
  onActionClick 
}: NotificationToastProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#5FAD43]" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-[#F59E0B]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#EF4444]" />;
      case 'reminder':
      default:
        return <Bell className="w-5 h-5 text-[#3B82F6]" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-[#5FAD43]';
      case 'milestone':
        return 'border-l-[#F59E0B]';
      case 'warning':
        return 'border-l-[#EF4444]';
      case 'reminder':
      default:
        return 'border-l-[#3B82F6]';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50';
      case 'milestone':
        return 'bg-amber-50';
      case 'warning':
        return 'bg-red-50';
      case 'reminder':
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className={`fixed top-20 right-4 z-50 w-80 max-w-sm rounded-lg shadow-lg border-l-4 ${getBorderColor()} ${getBackgroundColor()} bg-white`}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getIcon()}
                <h4 className="font-semibold text-gray-900">
                  {notification.title}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="p-1 h-6 w-6 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-700 mb-3">
              {notification.message}
            </p>

            {/* Action Button */}
            {notification.action && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    notification.action!.callback();
                    onActionClick?.();
                    onDismiss();
                  }}
                  className="bg-[#5FAD43] hover:bg-[#4A9538] text-white px-4 py-2"
                >
                  {notification.action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Auto-dismiss progress bar */}
          {notification.duration && (
            <motion.div
              className="h-1 bg-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className={`h-full ${
                  notification.type === 'success' ? 'bg-[#5FAD43]' :
                  notification.type === 'milestone' ? 'bg-[#F59E0B]' :
                  notification.type === 'warning' ? 'bg-[#EF4444]' :
                  'bg-[#3B82F6]'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ 
                  duration: notification.duration / 1000,
                  ease: "linear"
                }}
                onAnimationComplete={onDismiss}
              />
            </motion.div>
          )}

          {/* Celebration particles for milestone notifications */}
          {notification.type === 'milestone' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-[#F59E0B] rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          )}

          {/* Success celebration for completion */}
          {notification.type === 'success' && notification.title.includes('Complete') && (
            <div className="absolute -top-2 -right-2 pointer-events-none">
              <motion.div
                className="w-8 h-8 bg-[#5FAD43] rounded-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="text-white text-sm">🎉</span>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};