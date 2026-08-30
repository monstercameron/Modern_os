import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PRESETS,
  DEFAULT_THEME,
  applyTheme,
  normalizeTheme,
  SHADOW_LEVELS,
  MOTION_LEVELS,
  MOTION_EFFECTS,
} from './services/theme.js';
import { read, write } from './services/persistence.js';
import { dispatch, actions } from './kernel/index.js';

/**
 * Theme state for React.
 *
 * The engine in services/theme.js owns the token schema and the CSS variable
 * write; this provider owns which theme is current and persists it.
 */

/**
 * Legacy shape kept for callers that only ever wanted the five colours.
 * New code should read the full theme object or the CSS variables.
 */
export const themes = {
  light: PRESETS.light.colors,
  dark: PRESETS.dark.colors,
};

export const themeVar = (property) => `var(--theme-${property})`;
export const themeStyle = (...styles) => styles.reduce((acc, s) => ({ ...acc, ...s }), {});
export const themedBg = (property = 'surface') => ({ backgroundColor: themeVar(property) });
export const themedText = (property = 'text') => ({ color: themeVar(property) });
export const themedBorder = (property = 'border') => ({ borderColor: themeVar(property) });

const ThemeContext = createContext(null);

const STORAGE_SLICE = 'theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = read(STORAGE_SLICE, null);
    return normalizeTheme(saved || DEFAULT_THEME);
  });

  // One write per change; every consumer reads CSS variables.
  useEffect(() => {
    applyTheme(theme);
    write(STORAGE_SLICE, theme);
    // The window gap is a theme token, so tiled windows need new rectangles.
    dispatch(actions.retileAll());
  }, [theme]);

  /** Replace the theme wholesale (a preset, or an imported one). */
  const setTheme = useCallback((next) => {
    if (typeof next === 'string') {
      const preset = PRESETS[next];
      if (!preset) {
        console.warn(`[theme] unknown preset "${next}"`);
        return;
      }
      setThemeState(normalizeTheme(preset));
      return;
    }
    setThemeState(normalizeTheme(next));
  }, []);

  /** Patch part of the theme — colors merge, everything else replaces. */
  const updateTheme = useCallback((patch) => {
    setThemeState((prev) =>
      normalizeTheme({
        ...prev,
        ...patch,
        name: patch.name ?? (prev.name.endsWith('(edited)') ? prev.name : `${prev.name} (edited)`),
        colors: { ...prev.colors, ...(patch.colors || {}) },
      })
    );
  }, []);

  /** Set one colour token. */
  const setColor = useCallback((key, value) => {
    updateTheme({ colors: { [key]: value } });
  }, [updateTheme]);

  const resetTheme = useCallback(() => setThemeState(normalizeTheme(DEFAULT_THEME)), []);

  const toggleLightDark = useCallback(() => {
    setThemeState((prev) => normalizeTheme(prev.mode === 'light' ? PRESETS.dark : PRESETS.light));
  }, []);

  const getColor = useCallback((key) => theme.colors[key], [theme]);

  const value = useMemo(() => ({
    theme,
    currentTheme: theme.mode,
    presets: PRESETS,
    shadowLevels: SHADOW_LEVELS,
    motionLevels: MOTION_LEVELS,
    motionEffects: MOTION_EFFECTS,

    setTheme,
    updateTheme,
    setColor,
    resetTheme,
    toggleLightDark,

    // Kept for existing callers.
    applyPreset: setTheme,
    updateCustomTheme: updateTheme,
    isLight: theme.mode === 'light',
    isDark: theme.mode === 'dark',
    getColor,
    themes,
  }), [theme, setTheme, updateTheme, setColor, resetTheme, toggleLightDark, getColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
