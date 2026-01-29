import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, BookOpen, Users, Building, Map } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { GuidedTour, TourConfig } from './GuidedTour';
import type { UserRole } from '../../lib/types';

interface TourManagerProps {
  userRole: UserRole;
  onTourComplete: (tourId: string) => void;
}

export const TourManager = ({ userRole, onTourComplete }: TourManagerProps) => {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [showTourMenu, setShowTourMenu] = useState(false);
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());

  // Define tours for different user roles
  const tours: Record<UserRole, TourConfig[]> = {
    traveler: [
      {
        id: 'traveler-welcome',
        title: 'Welcome to TripAvail',
        description: 'Let\'s explore how to find and book your perfect trip',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to TripAvail! 🎉',
            description: 'We\'re excited to help you discover amazing travel experiences. Let\'s take a quick tour to get you started.',
            target: 'body',
            position: 'center',
            content: (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#E11D48] rounded-full mx-auto flex items-center justify-center">
                  <Map className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-600">
                  This tour will show you the key features to help you plan your next adventure.
                </p>
              </div>
            ),
            skippable: true
          },
          {
            id: 'hamburger-menu',
            title: 'Navigation Menu',
            description: 'Access all app features through the hamburger menu. Click here to explore your profile, trips, and settings.',
            target: '[data-tour="hamburger-menu"]',
            position: 'bottom',
            action: 'click',
            highlight: true
          },
          {
            id: 'search-destinations',
            title: 'Find Destinations',
            description: 'Use the search feature to find hotels, tours, and activities in your desired location.',
            target: '[data-tour="search-bar"]',
            position: 'bottom',
            highlight: true
          },
          {
            id: 'bottom-navigation',
            title: 'Quick Navigation',
            description: 'Use the bottom navigation to quickly switch between Home, Tours, Messages, and Profile.',
            target: '[data-tour="bottom-nav"]',
            position: 'top',
            highlight: true
          },
          {
            id: 'partner-mode',
            title: 'Become a Partner',
            description: 'Ready to start your own travel business? Switch to partner mode to list hotels or create tour packages.',
            target: '[data-tour="partner-switch"]',
            position: 'top',
            content: (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#E11D48]" />
                  <span className="text-sm font-medium">Hotel Manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E11D48]" />
                  <span className="text-sm font-medium">Tour Operator</span>
                </div>
              </div>
            )
          }
        ],
        onComplete: () => {
          setCompletedTours(prev => new Set([...prev, 'traveler-welcome']));
        }
      }
    ],
    hotel_manager: [
      {
        id: 'hotel-manager-onboarding',
        title: 'Hotel Manager Guide',
        description: 'Learn how to manage your properties and grow your hospitality business',
        steps: [
          {
            id: 'welcome-hotel',
            title: 'Welcome, Hotel Manager! 🏨',
            description: 'Let\'s set up your hotel management portal and get you ready to welcome guests.',
            target: 'body',
            position: 'center',
            content: (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#E11D48] rounded-full mx-auto flex items-center justify-center">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-600">
                  This tour will guide you through listing your first property and managing bookings.
                </p>
              </div>
            ),
            skippable: true
          },
          {
            id: 'dashboard-overview',
            title: 'Your Dashboard',
            description: 'This is your central hub where you can see booking analytics, revenue, and property performance.',
            target: '[data-tour="dashboard-cards"]',
            position: 'bottom',
            highlight: true
          },
          {
            id: 'list-hotel-action',
            title: 'List Your First Hotel',
            description: 'Click here to start adding your first property. We\'ll guide you through the entire setup process.',
            target: '[data-tour="list-hotel-button"]',
            position: 'bottom',
            action: 'click',
            highlight: true
          },
          {
            id: 'verification-center',
            title: 'Verification Center',
            description: 'Complete your verification to build trust with guests and unlock all platform features.',
            target: '[data-tour="verification-link"]',
            position: 'right',
            highlight: true,
            content: (
              <div className="space-y-2">
                <p className="text-sm text-blue-600">
                  ✅ Identity verification<br/>
                  ✅ Business license<br/>
                  🔄 Property ownership<br/>
                  ⏳ Payment setup
                </p>
              </div>
            )
          },
          {
            id: 'calendar-management',
            title: 'Manage Availability',
            description: 'Set your room availability, pricing, and special rates using the calendar feature.',
            target: '[data-tour="calendar-link"]',
            position: 'right',
            highlight: true
          }
        ],
        onComplete: () => {
          setCompletedTours(prev => new Set([...prev, 'hotel-manager-onboarding']));
        }
      },
      {
        id: 'verification-walkthrough',
        title: 'Verification Process',
        description: 'Complete your verification with biometric and AI document scanning',
        steps: [
          {
            id: 'verification-intro',
            title: 'Enhanced Verification 🔒',
            description: 'Our new AI-powered verification system makes the process faster and more secure.',
            target: 'body',
            position: 'center',
            content: (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-medium text-blue-900">🤖 AI Document Scan</div>
                    <div className="text-blue-700">Instant verification</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-medium text-green-900">👤 Biometric Auth</div>
                    <div className="text-green-700">Face & fingerprint</div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'biometric-verification',
            title: 'Biometric Verification',
            description: 'Use face or fingerprint scanning for secure identity verification.',
            target: '[data-tour="biometric-scan-button"]',
            position: 'bottom',
            highlight: true
          },
          {
            id: 'document-scanner',
            title: 'AI Document Scanner',
            description: 'Our AI can automatically extract information from your documents and verify authenticity.',
            target: '[data-tour="ai-scanner-button"]',
            position: 'bottom',
            highlight: true
          }
        ]
      }
    ],
    tour_operator: [
      {
        id: 'tour-operator-setup',
        title: 'Tour Operator Hub',
        description: 'Create amazing experiences and manage your tour business',
        steps: [
          {
            id: 'welcome-tour-op',
            title: 'Welcome, Tour Operator! 🚌',
            description: 'Let\'s set up your tour operator hub and create your first amazing experience.',
            target: 'body',
            position: 'center',
            content: (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#E11D48] rounded-full mx-auto flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-600">
                  Learn how to create tours, manage bookings, and grow your business.
                </p>
              </div>
            ),
            skippable: true
          },
          {
            id: 'tour-dashboard',
            title: 'Tour Analytics',
            description: 'Monitor your tour performance, customer reviews, and revenue metrics.',
            target: '[data-tour="tour-dashboard"]',
            position: 'bottom',
            highlight: true
          },
          {
            id: 'create-tour',
            title: 'Create Your First Tour',
            description: 'Start building your tour package with our easy-to-use creation wizard.',
            target: '[data-tour="create-tour-button"]',
            position: 'bottom',
            action: 'click',
            highlight: true
          },
          {
            id: 'tour-calendar',
            title: 'Schedule Tours',
            description: 'Manage your tour schedule, set capacity limits, and handle group bookings.',
            target: '[data-tour="tour-calendar"]',
            position: 'right',
            highlight: true
          }
        ],
        onComplete: () => {
          setCompletedTours(prev => new Set([...prev, 'tour-operator-setup']));
        }
      }
    ]
  };

  // Check if user is new and should see welcome tour
  useEffect(() => {
    // Add a longer delay to prevent timing issues
    const timer = setTimeout(() => {
      try {
        const hasSeenWelcome = localStorage.getItem(`tour-completed-${userRole}-welcome`);
        if (!hasSeenWelcome) {
          const welcomeTour = tours[userRole]?.[0];
          if (welcomeTour) {
            setShowTourMenu(true);
          }
        }
      } catch (error) {
        console.warn('Error checking tour status:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [userRole]);

  const startTour = (tour: TourConfig) => {
    setActiveTour(tour);
    setShowTourMenu(false);
  };

  const handleTourComplete = (tourId: string) => {
    setActiveTour(null);
    setCompletedTours(prev => new Set([...prev, tourId]));
    localStorage.setItem(`tour-completed-${userRole}-${tourId}`, 'true');
    onTourComplete(tourId);
  };

  const handleTourSkip = () => {
    setActiveTour(null);
    setShowTourMenu(false);
  };

  const userTours = tours[userRole] || [];
  const availableTours = userTours.filter(tour => !completedTours.has(tour.id));

  return (
    <>
      {/* Tour Menu */}
      <AnimatePresence>
        {showTourMenu && availableTours.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[90]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#E11D48] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to TripAvail!</h2>
                <p className="text-gray-600">
                  Would you like to take a quick tour to learn about the key features?
                </p>
              </div>

              <div className="space-y-3">
                {availableTours.map((tour) => (
                  <Card
                    key={tour.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => startTour(tour)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{tour.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{tour.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {tour.steps.length} steps
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowTourMenu(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={() => startTour(availableTours[0])}
                  className="flex-1 bg-[#E11D48] hover:bg-[#BE185D]"
                >
                  Start Tour
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Button for Tour Access */}
      {!showTourMenu && availableTours.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-20 right-4 w-12 h-12 bg-[#E11D48] rounded-full shadow-lg flex items-center justify-center z-50 md:bottom-4"
          onClick={() => setShowTourMenu(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <BookOpen className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Active Tour */}
      {activeTour && (
        <GuidedTour
          tour={activeTour}
          isActive={true}
          onComplete={() => handleTourComplete(activeTour.id)}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
};