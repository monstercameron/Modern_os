/**
 * Theme Engine
 *
 * A theme is a flat token set — colors, shape and elevation — that is written
 * to CSS custom properties on the document root. Everything downstream reads
 * the variables, so a theme change is one write and no re-render.
 *
 * Tokens are deliberately few. Anything an app needs to look right should be
 * expressible here; if it is not, the token set is missing something rather
 * than the app needing a hardcoded colour.
 */

/** @typedef {'none'|'soft'|'medium'|'strong'} ShadowLevel */

export const SHADOW_LEVELS = ['none', 'soft', 'medium', 'strong'];

const SHADOWS = {
  none: 'none',
  soft: '0 1px 2px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.12)',
  medium: '0 2px 6px rgba(0,0,0,.24), 0 8px 24px rgba(0,0,0,.20)',
  strong: '0 4px 12px rgba(0,0,0,.32), 0 16px 48px rgba(0,0,0,.32)',
};

/** The shape of every theme. Presets fill this in. */
export const DEFAULT_THEME = {
  name: 'Dark',
  mode: 'dark',
  colors: {
    accent: '#60a5fa',
    accentText: '#0b1220',
    background: '#1a1a1a',
    surface: '#2d2d30',
    surfaceAlt: '#232326',
    text: '#e0e0e0',
    textMuted: '#9a9aa2',
    border: '#3e3e42',
    danger: '#f43f5e',
    success: '#22c55e',
  },
  radius: 0,
  borderWidth: 1,
  shadow: 'medium',
  tileGap: 8,
  windowGap: 8,
};

/** Built-in themes. `custom` is produced by editing any of these. */
export const PRESETS = {
  dark: DEFAULT_THEME,

  light: {
    name: 'Light',
    mode: 'light',
    colors: {
      accent: '#0078d4',
      accentText: '#ffffff',
      background: '#f3f3f3',
      surface: '#ffffff',
      surfaceAlt: '#eaeaea',
      text: '#111111',
      textMuted: '#5b5b66',
      border: '#d1d1d1',
      danger: '#dc2626',
      success: '#16a34a',
    },
    radius: 0,
    borderWidth: 1,
    shadow: 'soft',
    tileGap: 8,
    windowGap: 8,
  },

  midnight: {
    name: 'Midnight Blue',
    mode: 'dark',
    colors: {
      accent: '#3b82f6',
      accentText: '#f8fafc',
      background: '#0b1220',
      surface: '#111c33',
      surfaceAlt: '#0e1729',
      text: '#dbe6f6',
      textMuted: '#8ea3c2',
      border: '#1e2f4d',
      danger: '#f87171',
      success: '#34d399',
    },
    radius: 4,
    borderWidth: 1,
    shadow: 'strong',
    tileGap: 8,
    windowGap: 10,
  },

  purpleHaze: {
    name: 'Purple Haze',
    mode: 'dark',
    colors: {
      accent: '#a855f7',
      accentText: '#faf5ff',
      background: '#171021',
      surface: '#241733',
      surfaceAlt: '#1d1229',
      text: '#ece3f7',
      textMuted: '#a996bd',
      border: '#3b2555',
      danger: '#fb7185',
      success: '#4ade80',
    },
    radius: 8,
    borderWidth: 2,
    shadow: 'strong',
    tileGap: 10,
    windowGap: 12,
  },

  forest: {
    name: 'Forest Green',
    mode: 'dark',
    colors: {
      accent: '#10b981',
      accentText: '#04211a',
      background: '#0d1714',
      surface: '#14251f',
      surfaceAlt: '#101d19',
      text: '#dcefe7',
      textMuted: '#8fb3a6',
      border: '#1f3a31',
      danger: '#f87171',
      success: '#34d399',
    },
    radius: 2,
    borderWidth: 1,
    shadow: 'medium',
    tileGap: 8,
    windowGap: 8,
  },

  sunset: {
    name: 'Sunset Orange',
    mode: 'dark',
    colors: {
      accent: '#f97316',
      accentText: '#1c0d02',
      background: '#1b1210',
      surface: '#2b1c15',
      surfaceAlt: '#221611',
      text: '#f6e5da',
      textMuted: '#c0a091',
      border: '#4a2c1d',
      danger: '#ef4444',
      success: '#84cc16',
    },
    radius: 6,
    borderWidth: 2,
    shadow: 'strong',
    tileGap: 12,
    windowGap: 12,
  },

  highContrast: {
    name: 'High Contrast',
    mode: 'dark',
    colors: {
      accent: '#ffff00',
      accentText: '#000000',
      background: '#000000',
      surface: '#0a0a0a',
      surfaceAlt: '#141414',
      text: '#ffffff',
      textMuted: '#c8c8c8',
      border: '#ffffff',
      danger: '#ff5555',
      success: '#55ff55',
    },
    radius: 0,
    borderWidth: 3,
    shadow: 'none',
    tileGap: 8,
    windowGap: 8,
  },
};

/** camelCase -> kebab-case for CSS variable names. */
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Fill in anything a partial theme leaves out. */
export function normalizeTheme(theme) {
  const base = PRESETS[theme?.mode === 'light' ? 'light' : 'dark'];
  return {
    ...base,
    ...theme,
    colors: { ...base.colors, ...(theme?.colors || {}) },
  };
}

/** Mix a colour toward white or black — used for hover and focus shades. */
export function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const to = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (v) => Math.round(v + (to - v) * t);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Every CSS variable a theme produces, including the values derived from it.
 * @returns {Record<string,string>}
 */
export function themeToCssVars(input) {
  const t = normalizeTheme(input);
  const vars = {};

  for (const [key, value] of Object.entries(t.colors)) {
    vars[`--theme-${kebab(key)}`] = value;
  }

  // Derived colours so components do not have to compute them.
  vars['--theme-accent-hover'] = shade(t.colors.accent, t.mode === 'light' ? -0.12 : 0.12);
  vars['--theme-accent-soft'] = `color-mix(in srgb, ${t.colors.accent} 18%, transparent)`;
  vars['--theme-overlay'] = t.mode === 'light' ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.55)';

  // Shape.
  vars['--theme-radius'] = `${t.radius}px`;
  vars['--theme-radius-sm'] = `${Math.max(0, Math.round(t.radius / 2))}px`;
  vars['--theme-border-width'] = `${t.borderWidth}px`;
  // A focused window thickens its border only when there is a border to
  // thicken; at 1px the emphasis comes from the accent colour alone.
  vars['--theme-border-width-focus'] = `${t.borderWidth > 1 ? t.borderWidth + 2 : t.borderWidth}px`;
  vars['--theme-tile-gap'] = `${t.tileGap}px`;
  vars['--theme-window-gap'] = `${t.windowGap}px`;

  // Elevation.
  vars['--theme-shadow'] = SHADOWS[t.shadow] ?? SHADOWS.medium;
  vars['--theme-shadow-level'] = t.shadow;

  return vars;
}

/** Write a theme to the document. Returns the normalized theme. */
export function applyTheme(input, root = typeof document !== 'undefined' ? document.documentElement : null) {
  const t = normalizeTheme(input);
  if (!root) return t;

  const vars = themeToCssVars(t);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  // Lets the browser theme scrollbars and form controls to match.
  root.style.colorScheme = t.mode;
  root.dataset.themeMode = t.mode;
  root.dataset.themeName = t.name;

  return t;
}

export default { PRESETS, DEFAULT_THEME, applyTheme, themeToCssVars, normalizeTheme, shade, SHADOW_LEVELS };
