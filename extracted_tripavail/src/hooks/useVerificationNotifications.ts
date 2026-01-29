import { useEffect, useState } from 'react';

export interface VerificationNotification {
  id: string;
  type: 'reminder' | 'success' | 'milestone' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    callback: () => void;
  };
  duration?: number;
  priority: 'low' | 'medium' | 'high';
}

interface UseVerificationNotificationsProps {
  completedSteps: number;
  totalSteps: number;
  lastActivity?: Date;
  onShowNotification: (notification: VerificationNotification) => void;
}

export const useVerificationNotifications = ({
  completedSteps,
  totalSteps,
  lastActivity,
  onShowNotification
}: UseVerificationNotificationsProps) => {
  const [notifiedMilestones, setNotifiedMilestones] = useState<Set<number>>(new Set());
  const [hasShownReminder, setHasShownReminder] = useState(false);

  // Calculate progress percentage
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Show milestone celebrations
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    
    milestones.forEach(milestone => {
      if (progressPercentage >= milestone && !notifiedMilestones.has(milestone)) {
        const notification: VerificationNotification = {
          id: `milestone-${milestone}`,
          type: 'milestone',
          title: getMilestoneTitle(milestone),
          message: getMilestoneMessage(milestone),
          priority: 'high',
          duration: 5000
        };

        // Delay milestone notifications slightly for better UX
        setTimeout(() => {
          onShowNotification(notification);
          setNotifiedMilestones(prev => new Set([...prev, milestone]));
        }, 1000);
      }
    });
  }, [progressPercentage, notifiedMilestones, onShowNotification]);

  // Show reminder notifications
  useEffect(() => {
    if (hasShownReminder || !lastActivity) return;

    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Show reminder if user hasn't been active for 2+ days and verification is incomplete
    if (daysSinceLastActivity >= 2 && progressPercentage < 100 && progressPercentage > 0) {
      const notification: VerificationNotification = {
        id: 'verification-reminder',
        type: 'reminder',
        title: 'Complete your verification',
        message: `You're ${Math.round(progressPercentage)}% done! Finish verification to unlock all features.`,
        action: {
          label: 'Continue',
          callback: () => {
            // This will be handled by the parent component
          }
        },
        priority: 'medium',
        duration: 8000
      };

      setTimeout(() => {
        onShowNotification(notification);
        setHasShownReminder(true);
      }, 3000);
    }
  }, [lastActivity, progressPercentage, hasShownReminder, onShowNotification]);

  // Show completion success
  useEffect(() => {
    if (progressPercentage === 100 && !notifiedMilestones.has(100)) {
      const notification: VerificationNotification = {
        id: 'verification-complete',
        type: 'success',
        title: 'Verification Complete! 🎉',
        message: 'Your hotel is now ready to start accepting bookings.',
        action: {
          label: 'View Dashboard',
          callback: () => {
            // This will be handled by the parent component
          }
        },
        priority: 'high',
        duration: 10000
      };

      setTimeout(() => {
        onShowNotification(notification);
      }, 2000);
    }
  }, [progressPercentage, notifiedMilestones, onShowNotification]);

  return {
    progressPercentage,
    notifiedMilestones
  };
};

const getMilestoneTitle = (milestone: number): string => {
  switch (milestone) {
    case 25:
      return 'Great start! 🚀';
    case 50:
      return 'Halfway there! 💪';
    case 75:
      return 'Almost done! ⭐';
    case 100:
      return 'Verification Complete! 🎉';
    default:
      return 'Progress Update';
  }
};

const getMilestoneMessage = (milestone: number): string => {
  switch (milestone) {
    case 25:
      return "You've completed the first steps. Keep going to unlock all features!";
    case 50:
      return "You're making excellent progress. Your guests will appreciate the extra security.";
    case 75:
      return "Just a few more steps and you'll be fully verified!";
    case 100:
      return "Congratulations! Your hotel is now fully verified and ready to welcome guests.";
    default:
      return "Keep up the great work!";
  }
};