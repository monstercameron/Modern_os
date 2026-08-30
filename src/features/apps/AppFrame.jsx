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

/**
 * Give an app the frame's container behaviour and its `~` console without
 * imposing the header.
 *
 * Settings, Task Manager and the tile configurator predate AppFrame and draw
 * their own chrome; wrapping them in the full frame would give them two
 * headers. This adds the parts that are not visual — the container query
 * context and the console — and leaves their layout alone.
 */
export function withConsole(Component, { appId, title, console: consoleConfig }) {
  const Wrapped = (props) => (
    <div
      data-app-frame={appId}
      data-app-surface
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ containerType: 'inline-size', backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)' }}
    >
      <div className="flex-1 min-h-0 overflow-auto">
        <Component {...props} />
      </div>
      <AppConsole appId={appId} appTitle={title} {...(consoleConfig || {})} />
    </div>
  );
  Wrapped.displayName = `withConsole(${Component.displayName || Component.name || appId})`;
  return Wrapped;
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
      role="button"
      tabIndex={0}
      className={`px-3 py-2 cursor-pointer border-l-2 transition-colors app-row ${className}`}
      style={{
        borderLeftColor: selected ? 'var(--theme-accent)' : 'transparent',
        backgroundColor: selected ? 'var(--theme-accent-soft)' : 'transparent',
        transitionDuration: 'var(--motion-fast)',
        ...style,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rest.onClick?.(e); }
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

/** A person's avatar chip. */
export function Avatar({ person, size = 24 }) {
  return (
    <span
      className="grid place-items-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: person.color,
        borderRadius: 'var(--theme-radius-sm)',
      }}
      title={person.name}
    >
      {person.initials}
    </span>
  );
}

/** Mutually exclusive options rendered as one control. */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex p-0.5 ${className}`}
      style={{ backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}
      role="tablist"
    >
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const active = val === value;
        return (
          <button
            key={val}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(val)}
            className="px-2 py-1 text-[11px] font-medium capitalize transition-colors"
            style={{
              backgroundColor: active ? 'var(--theme-accent)' : 'transparent',
              color: active ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
              borderRadius: 'var(--theme-radius-sm)',
              transitionDuration: 'var(--motion-fast)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** An on/off switch. */
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors"
      style={{
        width: 30, height: 17,
        backgroundColor: checked ? 'var(--theme-accent)' : 'var(--theme-border)',
        borderRadius: 999,
        transitionDuration: 'var(--motion-fast)',
      }}
    >
      <span
        className="absolute top-[2px] transition-[left]"
        style={{
          left: checked ? 15 : 2,
          width: 13, height: 13,
          backgroundColor: '#fff',
          borderRadius: 999,
          transitionDuration: 'var(--motion-fast)',
        }}
      />
    </button>
  );
}

/** A label/value pair used in detail panes. */
export function Field({ label, children }) {
  return (
    <div className="flex items-baseline gap-3 px-3 py-2 text-[12px]">
      <Muted className="w-20 shrink-0">{label}</Muted>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </div>
  );
}

/** A compact line chart. Values are plotted to fit whatever range they span. */
export function Sparkline({ values, height = 40, tone = 'accent', fill = true }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  const w = 100;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    height - ((v - min) / span) * (height - 4) - 2,
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  const color = tone === 'danger' ? 'var(--theme-danger)'
    : tone === 'success' ? 'var(--theme-success)'
    : 'var(--theme-accent)';

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden="true">
      {fill && <path d={area} fill={color} opacity="0.14" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A keyboard hint. */
export const Kbd = ({ children }) => (
  <kbd
    className="px-1 py-0.5 text-[10px] font-mono"
    style={{
      backgroundColor: 'var(--theme-surface-alt)',
      color: 'var(--theme-text-muted)',
      border: '1px solid var(--theme-border)',
      borderRadius: 'var(--theme-radius-sm)',
    }}
  >
    {children}
  </kbd>
);

/** A centred panel over the app, for compose windows and confirmations. */
export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center p-4" style={{ backgroundColor: 'var(--theme-overlay)' }}>
      <div
        className="w-full max-w-md border overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          borderRadius: 'var(--theme-radius)',
          boxShadow: 'var(--theme-shadow)',
        }}
      >
        <div className="flex items-center px-3 py-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="text-[12px] font-semibold">{title}</span>
          <button onClick={onClose} aria-label="Close" className="ml-auto text-[14px] leading-none opacity-70">×</button>
        </div>
        <div className="p-3">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-3 py-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
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
