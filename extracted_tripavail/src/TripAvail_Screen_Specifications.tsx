import React, { useState } from 'react';

// TripAvail App - Complete Screen Specifications & Wireframes
// For Developer Reference - All 120+ Screens Documented

const ScreenSpec = ({ title, role, description, components, layout, interactions, notes }) => (
  <div className="border-2 border-gray-300 p-4 mb-6 bg-white">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{role}</span>
    </div>
    
    <div className="text-sm text-gray-600 mb-3">{description}</div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Layout Wireframe */}
      <div className="border border-gray-200 p-3">
        <div className="text-xs font-semibold mb-2">LAYOUT WIREFRAME</div>
        <div className="space-y-2">
          {layout.map((section, i) => (
            <div key={i} className={`border border-gray-300 p-2 bg-gray-50 ${section.height}`}>
              <div className="text-xs text-gray-600">{section.name}</div>
              {section.elements && (
                <div className="mt-1 space-y-1">
                  {section.elements.map((elem, j) => (
                    <div key={j} className="text-xs bg-white p-1 border border-gray-200">
                      {elem}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Components & Specs */}
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold mb-1">KEY COMPONENTS</div>
          <div className="text-xs space-y-1">
            {components.map((comp, i) => (
              <div key={i} className="flex justify-between">
                <span>{comp.name}</span>
                <span className="text-gray-500">{comp.type}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-semibold mb-1">INTERACTIONS</div>
          <div className="text-xs space-y-1">
            {interactions.map((action, i) => (
              <div key={i} className="text-gray-700">• {action}</div>
            ))}
          </div>
        </div>
        
        {notes && (
          <div>
            <div className="text-xs font-semibold mb-1">DEVELOPER NOTES</div>
            <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
              {notes}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function TripAvailScreenSpecs() {
  const [selectedRole, setSelectedRole] = useState('traveler');
  const [selectedScreen, setSelectedScreen] = useState(null);

  const travelerScreens = [
    {
      title: "Traveler Home Screen",
      role: "TRAVELER",
      description: "Main landing screen for travelers with search, destinations, and recommendations",
      components: [
        { name: "SearchBox", type: "Custom Input" },
        { name: "PremiumImageSlider", type: "Carousel" },
        { name: "DestinationCard", type: "Card Grid" },
        { name: "QuickActions", type: "Button Group" },
        { name: "RecentTrips", type: "Horizontal Scroll" }
      ],
      layout: [
        { 
          name: "Header Section", 
          height: "h-16",
          elements: ["Search Bar", "Location Selector", "Filter Button"]
        },
        { 
          name: "Hero Slider", 
          height: "h-32",
          elements: ["Featured Destinations", "Auto-rotate Images", "Page Indicators"]
        },
        { 
          name: "Quick Actions", 
          height: "h-20",
          elements: ["Book Hotel", "Find Tours", "Plan Trip", "Saved Items"]
        },
        { 
          name: "Popular Destinations", 
          height: "h-40",
          elements: ["Destination Grid", "Price Tags", "Rating Stars", "Quick Book"]
        },
        { 
          name: "Recent Activity", 
          height: "h-24",
          elements: ["Recent Searches", "Viewed Hotels", "Saved Tours"]
        }
      ],
      interactions: [
        "Search triggers hotel/tour filtering",
        "Destination cards navigate to detail view", 
        "Quick actions open respective flows",
        "Swipe gestures on slider"
      ],
      notes: "Use Unsplash for destination images. Implement search debouncing. Cache recent searches."
    },

    {
      title: "Traveler Dashboard",
      role: "TRAVELER", 
      description: "Personal dashboard showing trips, bookings, and travel stats",
      components: [
        { name: "TripStatsCards", type: "Metric Cards" },
        { name: "UpcomingTrips", type: "Timeline" },
        { name: "BookingStatus", type: "Status Cards" },
        { name: "TravelInsights", type: "Chart Widget" },
        { name: "RecommendationEngine", type: "AI Cards" }
      ],
      layout: [
        { 
          name: "Welcome Header", 
          height: "h-16",
          elements: ["Greeting", "Profile Avatar", "Notification Bell"]
        },
        { 
          name: "Stats Overview", 
          height: "h-24",
          elements: ["Total Trips", "Countries Visited", "Money Saved", "Upcoming"]
        },
        { 
          name: "Upcoming Trips", 
          height: "h-32",
          elements: ["Trip Cards", "Countdown Timer", "Weather Info", "Checklist"]
        },
        { 
          name: "Quick Insights", 
          height: "h-28",
          elements: ["Travel Patterns", "Spending Chart", "Favorite Destinations"]
        },
        { 
          name: "Recommendations", 
          height: "h-36",
          elements: ["AI Suggestions", "Trending Destinations", "Seasonal Offers"]
        }
      ],
      interactions: [
        "Trip cards expand to show details",
        "Charts are interactive with tooltips",
        "Recommendations navigate to booking flow",
        "Swipe to dismiss cards"
      ],
      notes: "Implement pull-to-refresh. Use motion animations for stat counters. Cache dashboard data."
    },

    {
      title: "My Trips Screen", 
      role: "TRAVELER",
      description: "Comprehensive trip management with past, current, and upcoming trips",
      components: [
        { name: "TripFilter", type: "Tab Navigation" },
        { name: "TripCard", type: "Expandable Card" },
        { name: "TripTimeline", type: "Vertical Timeline" },
        { name: "TripActions", type: "Action Sheet" },
        { name: "ShareTrip", type: "Social Share" }
      ],
      layout: [
        { 
          name: "Filter Tabs", 
          height: "h-12",
          elements: ["Upcoming", "Current", "Past", "Cancelled"]
        },
        { 
          name: "Trip List", 
          height: "h-auto",
          elements: ["Trip Cards", "Date Range", "Booking Status", "Total Cost"]
        },
        { 
          name: "Trip Details Modal", 
          height: "h-full",
          elements: ["Itinerary", "Bookings", "Documents", "Maps", "Sharing"]
        }
      ],
      interactions: [
        "Filter tabs change trip list",
        "Trip cards expand to show details",
        "Long press for action menu",
        "Swipe for quick actions"
      ],
      notes: "Implement lazy loading for trip history. Add offline access for current trips."
    },

    {
      title: "Wishlist Screen",
      role: "TRAVELER", 
      description: "Saved hotels, tours, and destinations with smart organization",
      components: [
        { name: "WishlistFilter", type: "Chip Filter" },
        { name: "SavedItemCard", type: "Image Card" },
        { name: "PriceAlerts", type: "Alert Cards" },
        { name: "WishlistActions", type: "FAB Menu" },
        { name: "ShareWishlist", type: "Share Sheet" }
      ],
      layout: [
        { 
          name: "Filter Chips", 
          height: "h-12", 
          elements: ["All", "Hotels", "Tours", "Destinations", "Price Alerts"]
        },
        { 
          name: "Saved Items Grid", 
          height: "h-auto",
          elements: ["Item Cards", "Price Badge", "Availability", "Quick Book"]
        },
        { 
          name: "Price Alert Section", 
          height: "h-24",
          elements: ["Active Alerts", "Price Changes", "Deal Notifications"]
        }
      ],
      interactions: [
        "Filter chips change grid view",
        "Cards show price alerts",
        "Swipe to remove items",
        "Quick book from wishlist"
      ],
      notes: "Implement real-time price tracking. Use optimistic updates for wishlist changes."
    }
  ];

  const hotelManagerScreens = [
    {
      title: "Hotel Manager Dashboard",
      role: "HOTEL_MANAGER",
      description: "Business dashboard with metrics, bookings, and property management",
      components: [
        { name: "MetricsCards", type: "KPI Cards" },
        { name: "BookingChart", type: "Line Chart" },
        { name: "PropertyStatus", type: "Status Grid" },
        { name: "QuickActions", type: "Action Cards" },
        { name: "RecentActivity", type: "Activity Feed" }
      ],
      layout: [
        { 
          name: "Business Metrics", 
          height: "h-24",
          elements: ["Revenue", "Occupancy", "Bookings", "Rating"]
        },
        { 
          name: "Performance Chart", 
          height: "h-32",
          elements: ["Booking Trends", "Revenue Graph", "Occupancy Rate"]
        },
        { 
          name: "Quick Actions", 
          height: "h-20",
          elements: ["List Hotel", "Create Package", "Calendar", "Verification"]
        },
        { 
          name: "Property Overview", 
          height: "h-28",
          elements: ["Active Properties", "Package Status", "Availability"]
        },
        { 
          name: "Recent Activity", 
          height: "h-24",
          elements: ["New Bookings", "Reviews", "Messages", "Updates"]
        }
      ],
      interactions: [
        "Metrics cards drill down to details",
        "Charts are interactive",
        "Quick actions navigate to flows",
        "Activity feed shows real-time updates"
      ],
      notes: "Use Recharts for analytics. Implement real-time booking updates. Cache business metrics."
    },

    {
      title: "Hotel Listing Flow",
      role: "HOTEL_MANAGER",
      description: "Complete 9-step hotel onboarding with animated icons and progress tracking",
      components: [
        { name: "ProgressTracker", type: "Stepper" },
        { name: "AnimatedIcons", type: "Lottie/SVG" },
        { name: "StepContent", type: "Dynamic Form" },
        { name: "NavigationControls", type: "Button Group" },
        { name: "CompletionCelebration", type: "Animation" }
      ],
      layout: [
        { 
          name: "Progress Header", 
          height: "h-16",
          elements: ["Step Counter", "Progress Bar", "Exit Button"]
        },
        { 
          name: "Step Content", 
          height: "h-auto",
          elements: ["Animated Icon", "Form Fields", "Validation", "Helper Text"]
        },
        { 
          name: "Navigation Footer", 
          height: "h-16",
          elements: ["Back Button", "Next/Submit Button", "Save Draft"]
        }
      ],
      interactions: [
        "Swipe navigation between steps",
        "Form validation before proceeding",
        "Auto-save draft functionality",
        "Celebration animation on completion"
      ],
      notes: "Steps: Welcome→Info→Location→Rooms→Amenities→Services→Policies→Review→Success. Use motion/react for animations."
    },

    {
      title: "Package Creation Flow (10 Steps)",
      role: "HOTEL_MANAGER", 
      description: "Comprehensive package listing with auto-suggestions and calendar integration",
      components: [
        { name: "PackageWizard", type: "Multi-Step Form" },
        { name: "AutoSuggestions", type: "AI Assistant" },
        { name: "MediaUploader", type: "Drag & Drop" },
        { name: "CalendarPicker", type: "Date Range" },
        { name: "PricingCalculator", type: "Dynamic Calculator" }
      ],
      layout: [
        { 
          name: "Wizard Header", 
          height: "h-16",
          elements: ["Step Progress", "Package Title", "Save Draft"]
        },
        { 
          name: "Step Content Area", 
          height: "h-auto",
          elements: ["Dynamic Content", "AI Suggestions", "Form Controls"]
        },
        { 
          name: "Preview Panel", 
          height: "h-32",
          elements: ["Live Preview", "Price Calculator", "Validation Status"]
        },
        { 
          name: "Navigation Controls", 
          height: "h-16",
          elements: ["Previous", "Next", "Skip", "Publish"]
        }
      ],
      interactions: [
        "AI suggests content based on input",
        "Live preview updates in real-time",
        "Validation prevents progression",
        "Calendar integration for availability"
      ],
      notes: "Steps: 0-Basics→1-Selection→2-Description→3-Highlights→4-Perks→5-Exclusions→6-Media→7-Pricing→8-Policy→9-Calendar→10-Confirm"
    },

    {
      title: "Calendar Management",
      role: "HOTEL_MANAGER",
      description: "Availability calendar with pricing controls and booking management", 
      components: [
        { name: "CalendarGrid", type: "Custom Calendar" },
        { name: "PricingControls", type: "Input Controls" },
        { name: "BookingOverlay", type: "Modal" },
        { name: "BulkActions", type: "Action Bar" },
        { name: "AvailabilityToggle", type: "Switch" }
      ],
      layout: [
        { 
          name: "Calendar Header", 
          height: "h-16",
          elements: ["Month Navigation", "View Toggle", "Bulk Actions"]
        },
        { 
          name: "Calendar Grid", 
          height: "h-auto",
          elements: ["Date Cells", "Booking Status", "Price Display", "Availability"]
        },
        { 
          name: "Selection Panel", 
          height: "h-24",
          elements: ["Date Range", "Pricing Input", "Availability Toggle", "Apply"]
        }
      ],
      interactions: [
        "Click dates to select ranges",
        "Drag to select multiple dates", 
        "Modal shows booking details",
        "Bulk pricing updates"
      ],
      notes: "Use react-big-calendar or custom implementation. Real-time booking updates. Color-coded availability."
    }
  ];

  const tourOperatorScreens = [
    {
      title: "Tour Operator Dashboard", 
      role: "TOUR_OPERATOR",
      description: "Tour business management with analytics and tour creation tools",
      components: [
        { name: "TourMetrics", type: "Analytics Cards" },
        { name: "BookingChart", type: "Chart.js" },
        { name: "TourStatus", type: "Status Cards" },
        { name: "CustomerFeedback", type: "Review Cards" },
        { name: "SeasonalInsights", type: "Data Visualization" }
      ],
      layout: [
        { 
          name: "Business Overview", 
          height: "h-24",
          elements: ["Tour Count", "Total Bookings", "Revenue", "Rating"]
        },
        { 
          name: "Performance Analytics", 
          height: "h-32", 
          elements: ["Booking Trends", "Popular Tours", "Seasonal Data"]
        },
        { 
          name: "Tour Management", 
          height: "h-28",
          elements: ["Active Tours", "Draft Tours", "Seasonal Status", "Quick Create"]
        },
        { 
          name: "Customer Insights", 
          height: "h-24",
          elements: ["Recent Reviews", "Customer Messages", "Feedback Trends"]
        }
      ],
      interactions: [
        "Analytics cards show detailed metrics",
        "Charts are interactive with drill-down",
        "Quick create opens tour wizard",
        "Review cards link to full reviews"
      ],
      notes: "Focus on seasonal tour business. Implement tour popularity analytics. Use Recharts for visualizations."
    },

    {
      title: "Tour Creation Wizard",
      role: "TOUR_OPERATOR",
      description: "7-step tour creation with itinerary builder and media management",
      components: [
        { name: "TourWizard", type: "Step Form" },
        { name: "ItineraryBuilder", type: "Drag & Drop" },
        { name: "MediaGallery", type: "Image Manager" },
        { name: "PricingMatrix", type: "Calculator" },
        { name: "PolicyBuilder", type: "Template System" }
      ],
      layout: [
        { 
          name: "Wizard Progress", 
          height: "h-16",
          elements: ["Step Indicator", "Tour Title", "Save Progress"]
        },
        { 
          name: "Content Area", 
          height: "h-auto", 
          elements: ["Step-specific Content", "Form Fields", "Media Upload", "Preview"]
        },
        { 
          name: "Action Footer", 
          height: "h-16",
          elements: ["Back", "Save Draft", "Next", "Publish"]
        }
      ],
      interactions: [
        "Drag & drop itinerary items",
        "Real-time tour preview",
        "Auto-save functionality",
        "Template-based policies"
      ],
      notes: "Steps: Basics→Itinerary→Media→Pricing→Policies→Calendar→Confirmation. Use react-beautiful-dnd for itinerary."
    }
  ];

  const sharedScreens = [
    {
      title: "Partner Selection Screen",
      role: "SHARED",
      description: "3D diorama selection between Hotel Manager and Tour Operator modes",
      components: [
        { name: "3DDioramas", type: "3D Animation" },
        { name: "ModeCards", type: "Interactive Cards" },
        { name: "ComparisonTable", type: "Feature Matrix" },
        { name: "RoleAnimation", type: "Lottie" },
        { name: "ContinueButton", type: "CTA Button" }
      ],
      layout: [
        { 
          name: "Header Section", 
          height: "h-16",
          elements: ["Title", "Subtitle", "Progress Indicator"]
        },
        { 
          name: "3D Dioramas", 
          height: "h-40",
          elements: ["Hotel Scene", "Tour Scene", "Interactive Elements"]
        },
        { 
          name: "Mode Selection", 
          height: "h-32",
          elements: ["Hotel Manager Card", "Tour Operator Card", "Feature Lists"]
        },
        { 
          name: "Action Footer", 
          height: "h-16",
          elements: ["Back to Home", "Continue Button"]
        }
      ],
      interactions: [
        "3D scenes rotate on interaction",
        "Cards highlight on selection", 
        "Smooth transitions between modes",
        "Haptic feedback on selection"
      ],
      notes: "Use Airbnb-style 3D dioramas. Implement with Three.js or CSS 3D transforms. Focus on premium feel."
    },

    {
      title: "Verification Screen",
      role: "SHARED", 
      description: "Multi-step verification with document scanning and biometric verification",
      components: [
        { name: "VerificationSteps", type: "Progress Stepper" },
        { name: "DocumentScanner", type: "Camera Interface" },
        { name: "BiometricCapture", type: "Face Recognition" },
        { name: "StatusTracker", type: "Real-time Status" },
        { name: "CompletionAnimation", type: "Success Animation" }
      ],
      layout: [
        { 
          name: "Progress Header", 
          height: "h-16",
          elements: ["Verification Steps", "Current Status", "Help Button"]
        },
        { 
          name: "Verification Content", 
          height: "h-auto",
          elements: ["Step Instructions", "Camera View", "Document Preview", "Status"]
        },
        { 
          name: "Action Controls", 
          height: "h-20",
          elements: ["Capture Button", "Retake", "Next Step", "Skip"]
        }
      ],
      interactions: [
        "Camera capture for documents",
        "Real-time document validation",
        "Biometric face scanning",
        "Status updates in real-time"
      ],
      notes: "Steps: Identity→Business→Bank→Biometric→Review→Approval. Use device camera APIs. Implement AI document scanning."
    },

    {
      title: "Bookings Management",
      role: "SHARED",
      description: "Universal booking management for all user roles with status tracking",
      components: [
        { name: "BookingFilter", type: "Filter Tabs" },
        { name: "BookingCard", type: "Status Card" },
        { name: "BookingDetails", type: "Expandable Panel" },
        { name: "StatusUpdates", type: "Timeline" },
        { name: "ActionMenu", type: "Context Menu" }
      ],
      layout: [
        { 
          name: "Filter Tabs", 
          height: "h-12",
          elements: ["All", "Pending", "Confirmed", "Cancelled", "Completed"]
        },
        { 
          name: "Booking List", 
          height: "h-auto",
          elements: ["Booking Cards", "Status Badge", "Customer Info", "Actions"]
        },
        { 
          name: "Detail Panel", 
          height: "h-32",
          elements: ["Booking Timeline", "Customer Details", "Payment Status", "Actions"]
        }
      ],
      interactions: [
        "Filter tabs change booking view",
        "Cards expand to show details",
        "Timeline shows booking history", 
        "Quick actions for common tasks"
      ],
      notes: "Role-specific booking data. Real-time status updates. Notification integration. Export functionality."
    }
  ];

  const allScreens = {
    traveler: travelerScreens,
    hotel_manager: hotelManagerScreens, 
    tour_operator: tourOperatorScreens,
    shared: sharedScreens
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TripAvail App - Screen Specifications</h1>
        <p className="text-gray-600">Complete wireframes and developer specifications for all 120+ screens</p>
        
        {/* Role Selector */}
        <div className="flex gap-2 mt-4">
          {Object.keys(allScreens).map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRole === role 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {role.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Specifications */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {selectedRole.replace('_', ' ').toUpperCase()} SCREENS
        </h2>
        
        {allScreens[selectedRole]?.map((screen, index) => (
          <ScreenSpec key={index} {...screen} />
        ))}
      </div>

      {/* Developer Guidelines */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-3">🛠️ Developer Implementation Guidelines</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Styling:</strong> Use Tailwind V4 classes. Follow the design system in globals.css</p>
          <p><strong>Colors:</strong> Primary: #E11D48 (TripAvail rose 600), Secondary: #ff5a5f (TripAvail red)</p>
          <p><strong>Icons:</strong> Use Lucide React for icons, animated SVGs for special elements</p>
          <p><strong>Animations:</strong> Use motion/react for smooth transitions and micro-interactions</p>
          <p><strong>Images:</strong> Use unsplash_tool for placeholder images, ImageWithFallback component</p>
          <p><strong>Forms:</strong> Implement validation with react-hook-form and zod</p>
          <p><strong>State:</strong> Use React hooks, context for global state</p>
          <p><strong>Navigation:</strong> Follow existing ScreenManager pattern</p>
          <p><strong>Responsive:</strong> Mobile-first design, use Tailwind responsive utilities</p>
          <p><strong>Performance:</strong> Implement lazy loading, optimize images, use React.memo</p>
        </div>
      </div>

      {/* Technical Stack */}
      <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-bold text-green-900 mb-3">⚡ Technical Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong className="text-green-800">Frontend:</strong>
            <ul className="text-green-700 mt-1 space-y-1">
              <li>• React 18+</li>
              <li>• TypeScript</li>
              <li>• Tailwind V4</li>
              <li>• Motion/React</li>
            </ul>
          </div>
          <div>
            <strong className="text-green-800">UI Components:</strong>
            <ul className="text-green-700 mt-1 space-y-1">
              <li>• Shadcn/ui</li>
              <li>• Lucide Icons</li>
              <li>• Recharts</li>
              <li>• React Hook Form</li>
            </ul>
          </div>
          <div>
            <strong className="text-green-800">Features:</strong>
            <ul className="text-green-700 mt-1 space-y-1">
              <li>• Camera APIs</li>
              <li>• Geolocation</li>
              <li>• Push Notifications</li>
              <li>• Offline Support</li>
            </ul>
          </div>
          <div>
            <strong className="text-green-800">Backend:</strong>
            <ul className="text-green-700 mt-1 space-y-1">
              <li>• Supabase (optional)</li>
              <li>• Real-time updates</li>
              <li>• File uploads</li>
              <li>• Authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}