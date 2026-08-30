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
/** @typedef {'full'|'reduced'|'none'} MotionLevel */

export const SHADOW_LEVELS = ['none', 'soft', 'medium', 'strong'];

/**
 * How much movement the desktop is allowed.
 * - full     everything animates
 * - reduced  position and opacity only; no scale, tilt, gloss or flourish
 * - none     instant, nothing animates
 */
export const MOTION_LEVELS = ['full', 'reduced', 'none'];

/** Individual effects that can be switched off without dropping a whole level. */
export const MOTION_EFFECTS = {
  windowTransitions: 'Window movement and resize',
  launcher: 'Start screen open and close',
  tileHover: 'Tile tilt and gloss on hover',
  tileContent: 'Live tile content changes',
  badges: 'Badge pulses',
};

/** Base durations in ms at speed 1. Everything else scales off these. */
const BASE_DURATION = { instant: 90, fast: 160, normal: 240, slow: 380 };

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
  motion: {
    /** @type {MotionLevel} */
    level: 'full',
    /** Multiplier on every duration. 0.5 is twice as fast, 2 is half speed. */
    speed: 1,
    effects: {
      windowTransitions: true,
      launcher: true,
      tileHover: true,
      tileContent: true,
      badges: true,
    },
  },
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
  const motion = { ...DEFAULT_THEME.motion, ...(base.motion || {}), ...(theme?.motion || {}) };
  return {
    ...base,
    ...theme,
    colors: { ...base.colors, ...(theme?.colors || {}) },
    motion: {
      ...motion,
      level: MOTION_LEVELS.includes(motion.level) ? motion.level : 'full',
      speed: Math.min(3, Math.max(0.25, Number(motion.speed) || 1)),
      effects: {
        ...DEFAULT_THEME.motion.effects,
        ...(base.motion?.effects || {}),
        ...(theme?.motion?.effects || {}),
      },
    },
  };
}

/**
 * Resolve the motion settings into something components can act on.
 * The OS-level "reduce motion" preference is a floor: a user who asked their
 * system for less movement gets it regardless of the theme.
 */
export function resolveMotion(theme, { respectSystem = true } = {}) {
  const m = normalizeTheme(theme).motion;
  const systemReduced =
    respectSystem &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const level = systemReduced && m.level === 'full' ? 'reduced' : m.level;
  const speed = level === 'none' ? 0 : m.speed;

  const scale = (ms) => (level === 'none' ? 0 : Math.round(ms * m.speed));

  return {
    level,
    speed,
    systemReduced,
    /** Nothing moves at all. */
    disabled: level === 'none',
    /** Decorative movement (scale, tilt, gloss, flourish) is off. */
    plain: level !== 'full',
    effects: m.effects,
    duration: {
      instant: scale(BASE_DURATION.instant),
      fast: scale(BASE_DURATION.fast),
      normal: scale(BASE_DURATION.normal),
      slow: scale(BASE_DURATION.slow),
    },
    /** Is this specific effect allowed right now? */
    allows(effect) {
      if (level === 'none') return false;
      if (m.effects[effect] === false) return false;
      // Decorative effects are the ones "reduced" drops.
      if (level === 'reduced' && (effect === 'tileHover' || effect === 'tileContent')) return false;
      return true;
    },
    /**
     * A framer-motion transition honouring the current settings.
     * @param {'instant'|'fast'|'normal'|'slow'} speedName
     */
    spring(speedName = 'normal') {
      if (level === 'none') return { duration: 0 };
      const ms = scale(BASE_DURATION[speedName] ?? BASE_DURATION.normal);
      return {
        type: 'spring',
        stiffness: Math.round(400 / m.speed),
        damping: 30,
        mass: 0.8,
        // Keeps a hard cap so a slow speed cannot feel broken.
        restDelta: 0.5,
        duration: ms / 1000,
      };
    },
    tween(speedName = 'normal') {
      const ms = scale(BASE_DURATION[speedName] ?? BASE_DURATION.normal);
      return { duration: ms / 1000, ease: 'easeOut' };
    },
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

  // Motion. CSS transitions read these; framer-motion reads resolveMotion().
  const motion = resolveMotion(t);
  vars['--motion-level'] = motion.level;
  vars['--motion-speed'] = String(motion.speed);
  vars['--motion-instant'] = `${motion.duration.instant}ms`;
  vars['--motion-fast'] = `${motion.duration.fast}ms`;
  vars['--motion-normal'] = `${motion.duration.normal}ms`;
  vars['--motion-slow'] = `${motion.duration.slow}ms`;

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
  // Lets CSS switch on the motion level without a media query.
  root.dataset.motion = resolveMotion(t).level;

  return t;
}

export default {
  PRESETS, DEFAULT_THEME, applyTheme, themeToCssVars, normalizeTheme, shade,
  resolveMotion, SHADOW_LEVELS, MOTION_LEVELS, MOTION_EFFECTS,
};
