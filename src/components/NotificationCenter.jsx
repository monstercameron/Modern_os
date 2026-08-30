import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, BellOff, Check, ChevronDown, Settings2,
  Mail, MessageSquare, Calendar, Music, Download, ShieldAlert, Info,
  Wifi, WifiOff, Bluetooth, Volume2, VolumeX, Sun, Moon, Battery,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useTheme } from '../ThemeContext.jsx';
import { useMotion } from '../hooks/useMotion.js';
import keymap, { SCOPES } from '../services/keymap.js';
import MediaControls from './MediaControls.jsx';
import eventBus from '../utils/eventBus.js';
import { TB } from '../utils/constants.js';

/**
 * The notification centre.
 *
 * A panel, not a takeover. It used to be a full-screen sheet with a 20px blur
 * over everything, which meant four notifications cost you the entire desktop —
 * and on a tiling desktop that is the layout you were in the middle of reading.
 * It now slides in from the taskbar's status cluster, the width of a column,
 * and leaves your work visible beside it.
 *
 * Notifications group by app so twelve of them read as three sources rather
 * than a wall, each one can be dismissed on its own, and times are real and
 * tick while the panel is open.
 */

/** Lucide stand-ins for the apps that post notifications. */
const APP_ICONS = {
  Email: Mail,
  Messages: MessageSquare,
  Calendar,
  Music,
  Downloads: Download,
  Security: ShieldAlert,
};
const iconFor = (app) => APP_ICONS[app] || Info;

/** "2m", "3h", "yesterday" — short enough to sit beside a title. */
function relativeTime(at, now) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) return 'now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d`;
}

const seed = () => {
  const now = Date.now();
  const min = 60 * 1000;
  return [
    { id: 1, app: 'Email', title: 'New message from Sarah', message: 'Re: Project Update — please review the latest changes before Thursday.', at: now - 2 * min, unread: true },
    { id: 2, app: 'Messages', title: 'Team standup', message: 'Alex: “Let’s sync at 3pm”', at: now - 15 * min, unread: true },
    { id: 3, app: 'Messages', title: 'Priya', message: 'Sent you the layout notes.', at: now - 22 * min, unread: true },
    { id: 4, app: 'Calendar', title: 'Team meeting', message: 'Starts in 30 minutes · Room 2', at: now - 30 * min, unread: false },
    { id: 5, app: 'Downloads', title: 'modern-os-0.4.tar.gz', message: 'Finished · 48.2 MB', at: now - 95 * min, unread: false },
    { id: 6, app: 'Music', title: 'Now playing', message: 'Summer Vibes — Artist Name', at: now - 3 * 60 * min, unread: false },
  ];
};

export function NotificationCenter({ isOpen, onClose }) {
  const motionSettings = useMotion();
  const [notifications, setNotifications] = useState(seed);
  const [collapsed, setCollapsed] = useState({});
  const [now, setNow] = useState(() => Date.now());

  /*
   * Escape goes through the keymap rather than a raw window listener. The
   * panel owns the keyboard while it is up, so its own close chord resolves
   * ahead of the desktop's — and the binding disappears with the panel instead
   * of lingering as a listener that fires whenever isOpen happens to be true.
   */
  useEffect(() => {
    if (!isOpen) return undefined;
    const offScope = keymap.pushScope(SCOPES.MODAL);
    const offBind = keymap.bind('escape', onClose, {
      scope: SCOPES.MODAL,
      description: 'Close the notification centre',
      owner: 'notifications',
    });
    return () => { offBind(); offScope(); };
  }, [isOpen, onClose]);

  // Times are only worth re-rendering while someone is looking at them.
  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [isOpen]);

  useEffect(() => {
    const offs = [
      eventBus.subscribe(eventBus.TOPICS.NOTIFICATION_NEW, (data) => {
        setNotifications((prev) => [{ id: Date.now(), at: Date.now(), unread: true, ...data }, ...prev]);
      }),
      eventBus.subscribe(eventBus.TOPICS.NOTIFICATION_READ, (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
      }),
      eventBus.subscribe(eventBus.TOPICS.NOTIFICATION_CLEAR, (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }),
      eventBus.subscribe(eventBus.TOPICS.NOTIFICATION_CLEAR_ALL, () => setNotifications([])),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const unread = notifications.filter((n) => n.unread).length;

  /** Newest first, grouped by app, groups ordered by their newest member. */
  const groups = useMemo(() => {
    const byApp = new Map();
    for (const n of [...notifications].sort((a, b) => b.at - a.at)) {
      if (!byApp.has(n.app)) byApp.set(n.app, []);
      byApp.get(n.app).push(n);
    }
    return [...byApp.entries()].map(([app, items]) => ({ app, items }));
  }, [notifications]);

  const dismiss = useCallback((id) => setNotifications((p) => p.filter((n) => n.id !== id)), []);
  const markRead = useCallback((id) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n))), []);
  const dismissApp = useCallback((app) => setNotifications((p) => p.filter((n) => n.app !== app)), []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/*
            A scrim, not a blur wall. It catches the outside click and takes the
            desktop back a step without hiding what you were doing.
          */}
          <motion.div
            className="fixed inset-0 z-[1790]"
            style={{ top: TB, backgroundColor: 'var(--theme-overlay)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionSettings.tween('fast')}
            onClick={onClose}
          />

          <motion.aside
            data-notification-center
            role="dialog"
            aria-label="Notifications and quick settings"
            className="fixed right-0 z-[1800] flex flex-col border-l w-full sm:w-[400px]"
            style={{
              top: TB,
              bottom: 0,
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              boxShadow: 'var(--theme-shadow)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionSettings.spring('normal')}
          >
            {/* ---- header ---- */}
            <header
              className="flex items-center gap-2 px-4 h-12 border-b shrink-0"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)' }}
            >
              <Bell size={15} style={{ color: 'var(--theme-text)' }} />
              <h2 className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                Notifications
              </h2>
              {unread > 0 && (
                <span
                  className="px-1.5 py-px text-[10px] font-semibold tabular-nums"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)',
                    borderRadius: 'var(--theme-radius-sm)',
                  }}
                >
                  {unread}
                </span>
              )}
              <div className="flex-1" />
              {notifications.length > 0 && (
                <>
                  <IconButton
                    label="Mark all as read"
                    onClick={() => setNotifications((p) => p.map((n) => ({ ...n, unread: false })))}
                    disabled={unread === 0}
                  >
                    <Check size={14} />
                  </IconButton>
                  <IconButton label="Clear all" onClick={() => setNotifications([])}>
                    <X size={14} />
                  </IconButton>
                </>
              )}
            </header>

            {/* ---- notifications ---- */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="h-full grid place-items-center px-8 text-center">
                  <div>
                    <BellOff size={28} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--theme-text-muted)' }} />
                    <div className="text-[13px] font-medium" style={{ color: 'var(--theme-text)' }}>
                      Nothing new
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      Notifications from your apps land here.
                    </div>
                  </div>
                </div>
              ) : (
                groups.map(({ app, items }) => {
                  const Icon = iconFor(app);
                  const isCollapsed = collapsed[app];
                  const groupUnread = items.filter((n) => n.unread).length;
                  return (
                    <section key={app} className="border-b" style={{ borderColor: 'var(--theme-border)' }}>
                      <div className="group/head flex items-center gap-2 px-4 h-9">
                        <button
                          onClick={() => setCollapsed((c) => ({ ...c, [app]: !c[app] }))}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          aria-expanded={!isCollapsed}
                        >
                          <Icon size={13} style={{ color: groupUnread ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--theme-text-muted)' }}>
                            {app}
                          </span>
                          <span className="text-[10px] tabular-nums" style={{ color: 'var(--theme-text-muted)' }}>
                            {items.length}
                          </span>
                          <motion.span
                            animate={{ rotate: isCollapsed ? -90 : 0 }}
                            transition={motionSettings.tween('fast')}
                            style={{ color: 'var(--theme-text-muted)', lineHeight: 0 }}
                          >
                            <ChevronDown size={12} />
                          </motion.span>
                        </button>
                        <button
                          onClick={() => dismissApp(app)}
                          aria-label={`Clear all from ${app}`}
                          className="opacity-0 group-hover/head:opacity-100 focus:opacity-100 text-[10px] px-1.5 py-0.5 transition-opacity"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          Clear
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={motionSettings.tween('fast')}
                            className="overflow-hidden"
                          >
                            {items.map((n) => (
                              <NotificationRow
                                key={n.id}
                                n={n}
                                now={now}
                                onRead={markRead}
                                onDismiss={dismiss}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  );
                })
              )}
            </div>

            {/* ---- media + quick settings ---- */}
            <div className="shrink-0 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <MediaControls />
              <QuickSettingsStrip onClose={onClose} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** A single notification. Dismiss appears on hover, and on focus for the keyboard. */
function NotificationRow({ n, now, onRead, onDismiss }) {
  return (
    <div
      className="group/row relative flex gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--theme-surface-alt)]"
      style={{ backgroundColor: n.unread ? 'var(--theme-accent-soft)' : 'transparent' }}
      onClick={() => n.unread && onRead(n.id)}
    >
      {/* The unread mark is an edge, not a dot: it survives a dense list. */}
      {n.unread && (
        <span className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: 'var(--theme-accent)' }} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-medium truncate" style={{ color: 'var(--theme-text)' }}>
            {n.title}
          </span>
          <span className="ml-auto text-[10px] tabular-nums shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
            {relativeTime(n.at, now)}
          </span>
        </div>
        <p className="text-[12px] leading-snug line-clamp-2 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
          {n.message}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        aria-label={`Dismiss: ${n.title}`}
        className="self-start opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity p-0.5"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function IconButton({ children, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="p-1.5 transition-opacity disabled:opacity-30 hover:bg-[var(--theme-surface)]"
      style={{ color: 'var(--theme-text-muted)', borderRadius: 'var(--theme-radius-sm)' }}
    >
      {children}
    </button>
  );
}

/**
 * Quick settings, compressed.
 *
 * These were four large cards and two boxed sliders taking half the screen.
 * They are controls you flick on the way past, so they get one row of square
 * toggles and two inline sliders, and the space goes to the notifications.
 */
function QuickSettingsStrip({ onClose }) {
  const { settings, updateSetting } = useSettings();
  const { currentTheme, setTheme } = useTheme();

  const dark = currentTheme === 'dark';
  const toggles = [
    { key: 'wifi', icon: settings.system.wifi ? Wifi : WifiOff, label: 'Wi-Fi', on: settings.system.wifi,
      act: () => updateSetting('system.wifi', !settings.system.wifi) },
    { key: 'bt', icon: Bluetooth, label: 'Bluetooth', on: settings.system.bluetooth,
      act: () => updateSetting('system.bluetooth', !settings.system.bluetooth) },
    { key: 'theme', icon: dark ? Moon : Sun, label: dark ? 'Dark' : 'Light', on: dark,
      act: () => { const next = dark ? 'light' : 'dark'; setTheme(next); updateSetting('theme.mode', next); } },
    { key: 'dnd', icon: settings.notifications.doNotDisturb ? BellOff : Bell, label: 'Do not disturb',
      on: settings.notifications.doNotDisturb,
      act: () => updateSetting('notifications.doNotDisturb', !settings.notifications.doNotDisturb) },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {toggles.map((t) => (
          <button
            key={t.key}
            onClick={t.act}
            aria-pressed={t.on}
            title={t.label}
            className="flex flex-col items-center justify-center gap-1 py-2 border transition-colors"
            style={{
              backgroundColor: t.on ? 'var(--theme-accent)' : 'var(--theme-surface-alt)',
              borderColor: t.on ? 'var(--theme-accent)' : 'var(--theme-border)',
              color: t.on ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
              borderRadius: 'var(--theme-radius-sm)',
            }}
          >
            <t.icon size={15} />
            <span className="text-[9px] font-medium leading-none truncate max-w-full px-1">{t.label}</span>
          </button>
        ))}
      </div>

      <Slider
        icon={settings.system.volume === 0 ? VolumeX : Volume2}
        label="Volume"
        value={settings.system.volume}
        onChange={(v) => updateSetting('system.volume', v)}
      />
      <Slider
        icon={Sun}
        label="Brightness"
        value={settings.system.brightness}
        onChange={(v) => updateSetting('system.brightness', v)}
      />

      <div className="flex items-center gap-2 pt-0.5">
        <Battery size={13} style={{ color: 'var(--theme-text-muted)' }} />
        <div className="flex-1 h-1 overflow-hidden" style={{ backgroundColor: 'var(--theme-border)', borderRadius: 'var(--theme-radius-sm)' }}>
          <div className="h-full" style={{ width: '87%', backgroundColor: 'var(--theme-success, var(--theme-accent))' }} />
        </div>
        <span className="text-[10px] tabular-nums" style={{ color: 'var(--theme-text-muted)' }}>87%</span>
        <button
          onClick={() => { eventBus.publish(eventBus.TOPICS.APP_LAUNCH, { appId: 'settings' }); onClose(); }}
          className="flex items-center gap-1 text-[11px] px-1.5 py-1"
          style={{ color: 'var(--theme-text-muted)' }}
          title="Open Settings"
        >
          <Settings2 size={13} />
        </button>
      </div>
    </div>
  );
}

function Slider({ icon: Icon, label, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5">
      <Icon size={13} className="shrink-0" style={{ color: 'var(--theme-text-muted)' }} />
      <span className="sr-only">{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1 appearance-none cursor-pointer"
        style={{
          borderRadius: 'var(--theme-radius-sm)',
          background: `linear-gradient(to right, var(--theme-accent) ${value}%, var(--theme-border) ${value}%)`,
        }}
      />
      <span className="text-[10px] tabular-nums w-7 text-right" style={{ color: 'var(--theme-text-muted)' }}>
        {value}
      </span>
    </label>
  );
}

export default NotificationCenter;
