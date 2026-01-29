import { useState, useEffect } from 'react';

export function useDarkMode() {
  // Initialize with system preference or saved preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tripavail-dark-mode');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Save to localStorage whenever dark mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripavail-dark-mode', JSON.stringify(isDarkMode));
      
      // Apply/remove dark class to html element
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't manually set preference
        const saved = localStorage.getItem('tripavail-dark-mode');
        if (saved === null) {
          setIsDarkMode(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return {
    isDarkMode,
    toggleDarkMode
  };
}