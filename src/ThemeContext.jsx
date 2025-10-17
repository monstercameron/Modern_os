import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Define theme objects - exported for use in other components
export const themes = {
  light: {
    accent: '#0078d4', // Microsoft blue - professional and recognizable
    background: '#f3f3f3', // Soft light gray - easier on eyes than pure white
    surface: '#ffffff', // Pure white for contrast on panels
    text: '#000000', // Pure black for maximum readability
    border: '#d1d1d1', // Medium gray for subtle borders
  },
  dark: {
    accent: '#60a5fa', // Lighter blue for dark backgrounds - better contrast
    background: '#1a1a1a', // Deep charcoal - not too dark, reduces eye strain
    surface: '#2d2d30', // Dark gray with warmth - distinguishable from background
    text: '#e0e0e0', // Off-white - softer than pure white on dark
    border: '#3e3e42', // Subtle border that's visible but not harsh
  }
};

// Utility to get CSS variable string for theme property
export const themeVar = (property) => `var(--theme-${property})`;

// Utility to create inline styles with theme variables
export const themeStyle = (...styles) => {
  return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
};

// Helper to create themed backgrounds
export const themedBg = (property = 'surface') => ({ backgroundColor: themeVar(property) });

// Helper to create themed text
export const themedText = (property = 'text') => ({ color: themeVar(property) });

// Helper to create themed borders
export const themedBorder = (property = 'border') => ({ borderColor: themeVar(property) });

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [customTheme, setCustomTheme] = useState(themes.dark);

  // Apply theme to CSS custom properties
  useEffect(() => {
    const theme = currentTheme === 'custom' ? customTheme : themes[currentTheme];
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
  }, [currentTheme, customTheme]);

  const setTheme = (themeName) => {
    if (themeName === 'custom') {
      console.warn('Use updateCustomTheme() to set custom themes');
      return;
    }
    if (!themes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }
    setCurrentTheme(themeName);
  };

  const updateCustomTheme = (updates) => {
    const newTheme = { ...customTheme, ...updates };
    setCustomTheme(newTheme);
    setCurrentTheme('custom');
  };

  const resetTheme = () => {
    setCurrentTheme('dark');
    setCustomTheme(themes.dark);
  };

  const toggleLightDark = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const applyPreset = (presetTheme) => {
    if (typeof presetTheme === 'string') {
      setTheme(presetTheme);
    } else if (typeof presetTheme === 'object') {
      updateCustomTheme(presetTheme);
    }
  };

  // Get a specific theme color by key
  const getColor = (key) => {
    const activeTheme = currentTheme === 'custom' ? customTheme : themes[currentTheme];
    return activeTheme[key];
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Current state
    currentTheme,
    theme: currentTheme === 'custom' ? customTheme : themes[currentTheme],
    
    // Theme setters
    setTheme,
    updateCustomTheme,
    resetTheme,
    applyPreset,
    
    // Toggles
    toggleLightDark,
    
    // Status flags
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark',
    isCustom: currentTheme === 'custom',
    
    // Utilities
    getColor,
    themes, // Access to all theme definitions
  }), [currentTheme, customTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}