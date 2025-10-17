import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Settings Context
 * Global settings registry with localStorage persistence
 */
const SettingsContext = createContext(null);

/**
 * Default settings structure
 */
const DEFAULT_SETTINGS = {
  theme: {
    mode: 'dark',
    accentColor: 'blue',
    fontSize: 'medium',
  },
  layout: {
    tileSize: 'medium',
    gridColumns: 6,
    showLabels: true,
    compactMode: false,
  },
  notifications: {
    enabled: true,
    sound: true,
    showPreviews: true,
    doNotDisturb: false,
  },
  system: {
    wifi: true,
    bluetooth: false,
    volume: 75,
    brightness: 80,
  },
  apps: {
    positions: {}, // { appId: { x, y } }
    tileSizes: {}, // { appId: '1x1' | '2x1' | etc }
    favorites: [], // [appId, appId, ...]
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    largeText: false,
  },
};

const STORAGE_KEY = 'metro_os_settings';

/**
 * Settings Provider Component
 * Wraps the app and provides settings context
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // Initialize from localStorage or use defaults
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return mergeDeep(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  /**
   * Update a setting value
   * Supports nested paths like 'theme.mode' or 'system.volume'
   */
  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
      
      return newSettings;
    });
  };

  /**
   * Get a setting value by path
   */
  const getSetting = (path) => {
    const keys = path.split('.');
    let current = settings;
    
    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  };

  /**
   * Update multiple settings at once
   */
  const updateSettings = (updates) => {
    setSettings(prev => mergeDeep(prev, updates));
  };

  /**
   * Reset all settings to defaults
   */
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear settings from localStorage:', error);
    }
  };

  /**
   * Reset a specific section to defaults
   */
  const resetSection = (section) => {
    if (DEFAULT_SETTINGS[section]) {
      updateSettings({ [section]: DEFAULT_SETTINGS[section] });
    }
  };

  /**
   * Export settings as JSON
   */
  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  /**
   * Import settings from JSON
   */
  const importSettings = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      const merged = mergeDeep(DEFAULT_SETTINGS, imported);
      setSettings(merged);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const value = {
    settings,
    updateSetting,
    getSetting,
    updateSettings,
    resetSettings,
    resetSection,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * useSettings Hook
 * Access settings from any component
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

/**
 * Deep merge utility for settings
 */
function mergeDeep(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Keyboard shortcut hook for settings reset
 */
export function useSettingsShortcuts() {
  const { resetSettings } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+R - Emergency settings reset
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const confirmed = window.confirm(
          'Reset all settings to defaults?\n\nThis action cannot be undone.'
        );
        if (confirmed) {
          resetSettings();
          window.location.reload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetSettings]);
}
