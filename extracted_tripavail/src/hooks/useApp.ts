// Main App Hook - Global state management
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, AppState } from '../lib/types';
import { NAVIGATION_TABS, USER_ROLES } from '../lib/constants';
import { getFromLocalStorage, setToLocalStorage } from '../lib/utils';

export interface UseAppReturn {
  // State
  showSplash: boolean;
  menuOpen: boolean;
  activeTab: string;
  partnerMode: 'hotel_manager' | 'tour_operator' | null;
  currentView: string;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setShowSplash: (show: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setPartnerMode: (mode: 'hotel_manager' | 'tour_operator' | null) => void;
  setCurrentView: (view: string) => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  
  // Handlers
  handleSplashComplete: () => void;
  handlePartnerSelection: () => void;
  handleSelectPartnerMode: (mode: 'hotel_manager' | 'tour_operator') => void;
  handleSwitchToTravelerMode: () => void;
  handleBackToHome: () => void;
  handleServiceClick: (service: string) => void;
  
  // Computed
  isPartnerMode: boolean;
  isTravelerMode: boolean;
  currentRole: 'traveler' | 'hotel_manager' | 'tour_operator';
}

const STORAGE_KEYS = {
  USER: 'tripavail_user',
  PARTNER_MODE: 'tripavail_partner_mode',
  ACTIVE_TAB: 'tripavail_active_tab',
} as const;

export function useApp(): UseAppReturn {
  // Core state
  const [showSplash, setShowSplash] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState(NAVIGATION_TABS.HOME);
  const [partnerMode, setPartnerModeState] = useState<'hotel_manager' | 'tour_operator' | null>(null);
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted data on mount - only once
  useEffect(() => {
    let mounted = true;
    
    try {
      const savedUser = getFromLocalStorage<User | null>(STORAGE_KEYS.USER, null);
      const savedActiveTab = getFromLocalStorage<string>(STORAGE_KEYS.ACTIVE_TAB, NAVIGATION_TABS.HOME);
      
      if (mounted) {
        // Always start in Traveler mode - don't load saved partner mode
        // This ensures the app always opens in default Traveler state
        if (savedUser) setUser(savedUser);
        if (savedActiveTab) setActiveTabState(savedActiveTab);
      }
    } catch (error) {
      console.warn('Error loading saved state:', error);
    }
    
    return () => {
      mounted = false;
    };
  }, []);

  // Memoized persist functions to prevent unnecessary re-renders
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    try {
      setToLocalStorage(STORAGE_KEYS.ACTIVE_TAB, tab);
    } catch (error) {
      console.warn('Error saving active tab:', error);
    }
  }, []);

  const setPartnerMode = useCallback((mode: 'hotel_manager' | 'tour_operator' | null) => {
    setPartnerModeState(mode);
    try {
      setToLocalStorage(STORAGE_KEYS.PARTNER_MODE, mode);
    } catch (error) {
      console.warn('Error saving partner mode:', error);
    }
  }, []);

  // Memoized event handlers
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handlePartnerSelection = useCallback(() => {
    setCurrentView('partner-selection');
    setMenuOpen(false);
  }, []);

  const handleSelectPartnerMode = useCallback((mode: 'hotel_manager' | 'tour_operator') => {
    setPartnerMode(mode);
    setCurrentView('home');
  }, [setPartnerMode]);

  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
  }, []);

  const handleServiceClick = useCallback((service: string) => {
    switch (service) {
      case 'hotels':
        setActiveTab(NAVIGATION_TABS.HOTELS);
        break;
      case 'tours':
        setActiveTab(NAVIGATION_TABS.TOURS);
        break;
      case 'messages':
        setActiveTab(NAVIGATION_TABS.MESSAGES);
        break;
      default:
        break;
    }
  }, [setActiveTab]);

  const handleSwitchToTravelerMode = useCallback(() => {
    setPartnerMode(null);
    setCurrentView('home');
    setMenuOpen(false);
  }, [setPartnerMode]);

  // Memoized computed values
  const isPartnerMode = useMemo(() => partnerMode !== null, [partnerMode]);
  const isTravelerMode = useMemo(() => !isPartnerMode, [isPartnerMode]);
  const currentRole = useMemo(() => partnerMode || 'traveler', [partnerMode]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    showSplash,
    menuOpen,
    activeTab,
    partnerMode,
    currentView,
    user,
    isLoading,
    error,
    
    // Actions
    setShowSplash,
    setMenuOpen,
    setActiveTab,
    setPartnerMode,
    setCurrentView,
    setUser,
    setError,
    
    // Handlers
    handleSplashComplete,
    handlePartnerSelection,
    handleSelectPartnerMode,
    handleSwitchToTravelerMode,
    handleBackToHome,
    handleServiceClick,
    
    // Computed
    isPartnerMode,
    isTravelerMode,
    currentRole,
  };
}