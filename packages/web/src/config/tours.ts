import { TourConfig } from '../components/ui/GuidedTour'

export const travellerTour: TourConfig = {
  id: 'traveller-onboarding',
  version: '1.0.0',
  title: 'Welcome to TripAvail!',
  description: 'Let us show you around so you can start booking your next adventure.',
  steps: [
    {
      id: 'step-search',
      title: 'Find Your Next Trip',
      description:
        'Use the search bar to find hotels, tours, and experiences in your desired destination.',
      target: '[data-tour="search-bar"]',
      position: 'bottom',
      highlight: true,
    },
    {
      id: 'step-profile',
      title: 'Manage Your Profile',
      description: 'Access your account settings, preferences, and view your bookings here.',
      target: '[data-tour="profile-menu"]',
      position: 'left',
      highlight: true,
    },
    {
      id: 'step-partner',
      title: 'Become a Partner',
      description:
        'Want to earn with TripAvail? You can permanently switch your account to become a Hotel Manager or Tour Operator.',
      target: '[data-tour="partner-switch"]',
      position: 'left',
      highlight: true,
    },
  ],
}

export const hotelManagerTour: TourConfig = {
  id: 'hotel-manager-onboarding',
  version: '1.0.0',
  title: 'Welcome to your Partner Dashboard',
  description: 'Here you can manage your properties and bookings.',
  steps: [
    {
      id: 'step-dashboard-stats',
      title: 'At a Glance',
      description: 'View your key metrics, revenue, and upcoming bookings at a glance.',
      target: '[data-tour="dashboard-stats"]',
      position: 'bottom',
      highlight: true,
    },
    {
      id: 'step-add-property',
      title: 'Add a Property',
      description: 'Click here to start listing your beautiful properties for travellers to book.',
      target: '[data-tour="add-property"]',
      position: 'left',
      highlight: true,
    },
  ],
}

export const tourOperatorTour: TourConfig = {
  id: 'tour-operator-onboarding',
  version: '1.0.0',
  title: 'Welcome to your Partner Dashboard',
  description: 'Here you can manage your tours and bookings.',
  steps: [
    {
      id: 'step-dashboard-stats',
      title: 'At a Glance',
      description: 'View your key metrics, revenue, and upcoming bookings at a glance.',
      target: '[data-tour="dashboard-stats"]',
      position: 'bottom',
      highlight: true,
    },
    {
      id: 'step-add-tour',
      title: 'Create a Tour',
      description: 'Click here to create amazing tour packages for travellers to book.',
      target: '[data-tour="add-tour"]',
      position: 'left',
      highlight: true,
    },
  ],
}
