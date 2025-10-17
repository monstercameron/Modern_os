import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  BellOff, 
  Trash2, 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Monitor, 
  Battery 
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useTheme } from '../ThemeContext.jsx';

/**
 * Notification Center Overlay
 * Takes over entire work area below taskbar with Gaussian blur backdrop
 * Two-column layout: Notifications (left) and Quick Settings (right)
 * Dismisses on outside click or Escape key
 */
export function NotificationCenter({ isOpen, onClose }) {
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      app: 'Email',
      icon: '📧',
      title: 'New message from Sarah',
      message: 'Re: Project Update - Please review the latest changes...',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      app: 'Messages',
      icon: '💬',
      title: 'Team Standup',
      message: 'Alex: "Let\'s sync up at 3pm"',
      time: '15 min ago',
      unread: true
    },
    {
      id: 3,
      app: 'Calendar',
      icon: '📅',
      title: 'Upcoming meeting',
      message: 'Team Meeting starts in 30 minutes',
      time: '30 min ago',
      unread: false
    },
    {
      id: 4,
      app: 'Music',
      icon: '🎵',
      title: 'Now Playing',
      message: 'Summer Vibes - Artist Name',
      time: '1 hour ago',
      unread: false
    },
  ];

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springConfig}
          className="fixed inset-0 z-[1800]"
          style={{ 
            top: '40px', // Below taskbar
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ ...springConfig, delay: 0.05 }}
            className="h-full grid grid-cols-2 gap-6 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column: Notifications */}
            <div className="flex flex-col h-full">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...springConfig, delay: 0.1 }}
                className="rounded-lg shadow-2xl border overflow-hidden flex flex-col h-full"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                {/* Header */}
                <div 
                  className="flex items-center justify-between px-6 py-4 border-b"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={20} style={{ color: 'var(--theme-text)' }} />
                    <h2 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      Notifications
                    </h2>
                    <span 
                      className="px-2 py-0.5 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: 'var(--theme-accent)',
                        color: 'white'
                      }}
                    >
                      {notifications.filter(n => n.unread).length}
                    </span>
                  </div>
                  <button
                    className="p-2 rounded hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--theme-text)' }}
                    title="Clear all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div 
                      className="flex flex-col items-center justify-center h-full text-center px-6"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      <BellOff size={48} className="mb-4 opacity-30" />
                      <p className="text-lg font-medium">No notifications</p>
                      <p className="text-sm mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                      {notifications.map((notif, index) => (
                        <motion.div
                          key={notif.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ ...springConfig, delay: 0.15 + index * 0.05 }}
                          className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                          style={{
                            backgroundColor: notif.unread ? 'rgba(var(--theme-accent-rgb, 59, 130, 246), 0.05)' : 'transparent'
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="text-2xl flex-shrink-0">{notif.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-semibold text-sm"
                                    style={{ color: 'var(--theme-text)' }}
                                  >
                                    {notif.app}
                                  </span>
                                  {notif.unread && (
                                    <span 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: 'var(--theme-accent)' }}
                                    />
                                  )}
                                </div>
                                <span 
                                  className="text-xs flex-shrink-0"
                                  style={{ color: 'var(--theme-text-secondary)' }}
                                >
                                  {notif.time}
                                </span>
                              </div>
                              <p 
                                className="text-sm font-medium mb-1"
                                style={{ color: 'var(--theme-text)' }}
                              >
                                {notif.title}
                              </p>
                              <p 
                                className="text-sm line-clamp-2"
                                style={{ color: 'var(--theme-text-secondary)' }}
                              >
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div 
                  className="px-6 py-3 border-t"
                  style={{ 
                    borderColor: 'var(--theme-border)',
                    backgroundColor: 'var(--theme-background)'
                  }}
                >
                  <button
                    className="w-full py-2 px-4 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'white'
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Quick Settings */}
            <div className="flex flex-col h-full">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...springConfig, delay: 0.15 }}
                className="rounded-lg shadow-2xl border overflow-hidden flex flex-col h-full"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                {/* Quick Settings Content */}
                <QuickSettingsPanel />
              </motion.div>
            </div>
          </motion.div>

          {/* Close hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div 
              className="px-4 py-2 rounded-full text-sm font-medium shadow-lg"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white'
              }}
            >
              Press <kbd className="px-2 py-1 bg-white/20 rounded">Esc</kbd> or click outside to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Quick Settings Panel (embedded version for notification center)
 */
function QuickSettingsPanel() {
  const { settings, updateSetting } = useSettings();
  const { currentTheme, setTheme } = useTheme();
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

  // Toggle handlers
  const toggleWifi = () => updateSetting('system.wifi', !settings.system.wifi);
  const toggleBluetooth = () => updateSetting('system.bluetooth', !settings.system.bluetooth);
  const toggleDarkMode = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateSetting('theme.mode', newTheme);
  };
  const toggleDoNotDisturb = () => updateSetting('notifications.doNotDisturb', !settings.notifications.doNotDisturb);

  // Slider handlers
  const handleVolumeChange = (e) => updateSetting('system.volume', parseInt(e.target.value));
  const handleBrightnessChange = (e) => updateSetting('system.brightness', parseInt(e.target.value));

  return (
    <>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <h2 
          className="text-lg font-semibold"
          style={{ color: 'var(--theme-text)' }}
        >
          Quick Settings
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Toggles Grid */}
        <div className="grid grid-cols-2 gap-4">
          <QuickToggle
            icon={settings.system.wifi ? Wifi : WifiOff}
            label="Wi-Fi"
            active={settings.system.wifi}
            onClick={toggleWifi}
          />
          <QuickToggle
            icon={Bluetooth}
            label="Bluetooth"
            active={settings.system.bluetooth}
            onClick={toggleBluetooth}
          />
          <QuickToggle
            icon={currentTheme === 'dark' ? Moon : Sun}
            label={currentTheme === 'dark' ? 'Dark' : 'Light'}
            active={currentTheme === 'dark'}
            onClick={toggleDarkMode}
          />
          <QuickToggle
            icon={settings.notifications.doNotDisturb ? BellOff : Bell}
            label="Do Not Disturb"
            active={settings.notifications.doNotDisturb}
            onClick={toggleDoNotDisturb}
          />
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <QuickSlider
            icon={settings.system.volume === 0 ? VolumeX : Volume2}
            label="Volume"
            value={settings.system.volume}
            onChange={handleVolumeChange}
          />
          <QuickSlider
            icon={Monitor}
            label="Brightness"
            value={settings.system.brightness}
            onChange={handleBrightnessChange}
          />
        </div>

        {/* Battery Info */}
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-background)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Battery size={18} style={{ color: 'var(--theme-text)' }} />
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--theme-text)' }}
              >
                Battery
              </span>
            </div>
            <span 
              className="text-sm font-semibold"
              style={{ color: 'var(--theme-text)' }}
            >
              87%
            </span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--theme-border)' }}
          >
            <div 
              className="h-full rounded-full"
              style={{ 
                width: '87%',
                backgroundColor: 'var(--theme-accent)'
              }}
            />
          </div>
          <p 
            className="text-xs mt-2"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            About 4 hours remaining
          </p>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-3 border-t"
        style={{ 
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-background)'
        }}
      >
        <button
          className="w-full py-2 px-4 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'white'
          }}
        >
          Open Settings App
        </button>
      </div>
    </>
  );
}

// Helper components (copied from QuickSettings.jsx for self-contained component)
const QuickToggle = ({ icon: Icon, label, active, onClick }) => {
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      className="flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer"
      style={{
        backgroundColor: active ? 'var(--theme-accent)' : 'var(--theme-background)',
        borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
        color: active ? 'white' : 'var(--theme-text)'
      }}
    >
      <Icon size={24} strokeWidth={2} />
      <span className="text-xs font-medium mt-2">{label}</span>
    </motion.button>
  );
};

const QuickSlider = ({ icon: Icon, label, value, onChange, max = 100 }) => (
  <div 
    className="p-4 rounded-lg border"
    style={{
      backgroundColor: 'var(--theme-background)',
      borderColor: 'var(--theme-border)'
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: 'var(--theme-text)' }} />
        <span 
          className="text-sm font-medium"
          style={{ color: 'var(--theme-text)' }}
        >
          {label}
        </span>
      </div>
      <span 
        className="text-sm font-semibold tabular-nums"
        style={{ color: 'var(--theme-text)' }}
      >
        {value}%
      </span>
    </div>
    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={onChange}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, var(--theme-accent) 0%, var(--theme-accent) ${value}%, var(--theme-border) ${value}%, var(--theme-border) 100%)`
      }}
    />
  </div>
);
