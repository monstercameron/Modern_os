import React, { createContext, useContext, useMemo } from 'react';
import { AppConsole } from './AppConsole.jsx';

/**
 * The shell every app renders inside.
 *
 * Gives an app three things it should not have to build itself: a themed,
 * responsive layout; a container-query breakpoint it can lay out against; and
 * the `~` console, so every app has the same way to be driven by text.
 *
 * Apps read only theme tokens — no fixed colours — which is what makes them
 * follow the theme rather than needing the compatibility bridge in index.css.
 */

const AppContext = createContext({ appId: null, size: 'md' });
export const useApp = () => useContext(AppContext);

/**
 * @param {object}   props
 * @param {string}   props.appId       - id from config/apps.js
 * @param {string}   props.title
 * @param {string}   [props.subtitle]
 * @param {React.ReactNode} [props.toolbar]  - right-aligned header controls
 * @param {React.ReactNode} [props.sidebar]  - collapses below the md breakpoint
 * @param {object}   [props.console]   - { intro, suggestions, handler }
 */
export function AppFrame({
  appId,
  title,
  subtitle,
  toolbar,
  sidebar,
  children,
  console: consoleConfig,
}) {
  const value = useMemo(() => ({ appId, title }), [appId, title]);

  return (
    <AppContext.Provider value={value}>
      <div
        data-app-frame={appId}
        className="w-full h-full flex flex-col overflow-hidden text-[13px]"
        style={{
          // @container lets the layout respond to the window, not the viewport,
          // which is what a tiled window actually needs.
          containerType: 'inline-size',
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-text)',
        }}
      >
        <header
          className="flex items-center gap-3 px-3 py-2 shrink-0 border-b"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate leading-tight">{title}</div>
            {subtitle && (
              <div className="text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                {subtitle}
              </div>
            )}
          </div>
          {toolbar && <div className="flex items-center gap-1.5 shrink-0">{toolbar}</div>}
        </header>

        <div className="flex-1 min-h-0 flex app-body">
          {sidebar && (
            <aside
              className="app-sidebar shrink-0 overflow-y-auto border-r"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)' }}
            >
              {sidebar}
            </aside>
          )}
          <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
        </div>

        <AppConsole appId={appId} appTitle={title} {...(consoleConfig || {})} />
      </div>
    </AppContext.Provider>
  );
}

/* ---------------------------------------------------------------- pieces */

/** A scroll region with consistent padding. */
export function Pane({ children, className = '', padded = true }) {
  return <div className={`${padded ? 'p-3' : ''} ${className}`}>{children}</div>;
}

/** Section heading inside an app. */
export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
        {children}
      </h3>
      {action}
    </div>
  );
}

/** A themed button. Variants: default, accent, ghost, danger. */
export function Button({ variant = 'default', active = false, className = '', style, ...rest }) {
  const base = 'px-2.5 py-1.5 text-[12px] font-medium transition-colors border inline-flex items-center gap-1.5 disabled:opacity-50';
  const variants = {
    default: {
      backgroundColor: active ? 'var(--theme-accent)' : 'var(--theme-surface)',
      color: active ? 'var(--theme-accent-text)' : 'var(--theme-text)',
      borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
    },
    accent: {
      backgroundColor: 'var(--theme-accent)',
      color: 'var(--theme-accent-text)',
      borderColor: 'var(--theme-accent)',
    },
    ghost: { backgroundColor: 'transparent', color: 'var(--theme-text)', borderColor: 'transparent' },
    danger: { backgroundColor: 'transparent', color: 'var(--theme-danger)', borderColor: 'var(--theme-danger)' },
  };
  return (
    <button
      className={`${base} ${className}`}
      style={{ borderRadius: 'var(--theme-radius-sm)', ...variants[variant], ...style }}
      {...rest}
    />
  );
}

/** A bordered surface used for cards, rows and panels. */
export function Card({ children, className = '', accent = false, style, ...rest }) {
  return (
    <div
      className={`border ${className}`}
      style={{
        borderColor: accent ? 'var(--theme-accent)' : 'var(--theme-border)',
        backgroundColor: 'var(--theme-surface)',
        borderRadius: 'var(--theme-radius-sm)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Muted secondary text. */
export const Muted = ({ children, className = '' }) => (
  <span className={className} style={{ color: 'var(--theme-text-muted)' }}>{children}</span>
);

/** A labelled statistic. */
export function Stat({ label, value, hint }) {
  return (
    <Card className="p-2.5 min-w-0">
      <div className="text-[10px] uppercase tracking-wider truncate" style={{ color: 'var(--theme-text-muted)' }}>
        {label}
      </div>
      <div className="text-lg font-semibold leading-tight truncate">{value}</div>
      {hint && <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{hint}</div>}
    </Card>
  );
}

/** A horizontal progress meter. */
export function Meter({ value, max = 100, tone = 'accent' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'danger' ? 'var(--theme-danger)'
    : tone === 'success' ? 'var(--theme-success)'
    : 'var(--theme-accent)';
  return (
    <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}>
      <div className="h-full transition-[width]" style={{ width: `${pct}%`, backgroundColor: color, transitionDuration: 'var(--motion-normal)' }} />
    </div>
  );
}

/** A selectable row in a list. */
export function Row({ selected = false, className = '', style, ...rest }) {
  return (
    <div
      className={`px-3 py-2 cursor-pointer border-l-2 transition-colors ${className}`}
      style={{
        borderLeftColor: selected ? 'var(--theme-accent)' : 'transparent',
        backgroundColor: selected ? 'var(--theme-accent-soft)' : 'transparent',
        transitionDuration: 'var(--motion-fast)',
        ...style,
      }}
      {...rest}
    />
  );
}

/** A themed text input. */
export function Input({ className = '', style, ...rest }) {
  return (
    <input
      className={`px-2 py-1.5 text-[12px] border w-full outline-none ${className}`}
      style={{
        backgroundColor: 'var(--theme-surface-alt)',
        color: 'var(--theme-text)',
        borderColor: 'var(--theme-border)',
        borderRadius: 'var(--theme-radius-sm)',
        ...style,
      }}
      {...rest}
    />
  );
}

/** Small status pill. */
export function Tag({ children, tone = 'default' }) {
  const tones = {
    default: { bg: 'var(--theme-surface-alt)', fg: 'var(--theme-text-muted)' },
    accent: { bg: 'var(--theme-accent-soft)', fg: 'var(--theme-accent)' },
    success: { bg: 'var(--theme-surface-alt)', fg: 'var(--theme-success)' },
    danger: { bg: 'var(--theme-surface-alt)', fg: 'var(--theme-danger)' },
  };
  const t = tones[tone] || tones.default;
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.fg, borderRadius: 'var(--theme-radius-sm)' }}
    >
      {children}
    </span>
  );
}

/** An empty state that tells the reader what to do next. */
export function Empty({ title, hint, action }) {
  return (
    <div className="h-full grid place-items-center p-6 text-center">
      <div>
        <div className="font-medium mb-1">{title}</div>
        {hint && <div className="text-[12px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>{hint}</div>}
        {action}
      </div>
    </div>
  );
}

export default AppFrame;
