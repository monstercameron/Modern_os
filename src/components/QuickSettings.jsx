import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff,
  Bluetooth, 
  Volume2, 
  VolumeX,
  Sun,
  Moon,
  BellOff,
  Bell,
  Monitor,
  X
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings.jsx';
import { useTheme } from '../ThemeContext.jsx';

/**
 * Quick Settings Panel
 * Appears when clicking system tray icons
 * Shows toggles and sliders for system settings
 */
export function QuickSettings({ onClose }) {
  const { settings, updateSetting } = useSettings();
  const { currentTheme, setTheme } = useTheme();

  const springConfig = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

  // Toggle handlers
  const toggleWifi = () => {
    updateSetting('system.wifi', !settings.system.wifi);
  };

  const toggleBluetooth = () => {
    updateSetting('system.bluetooth', !settings.system.bluetooth);
  };

  const toggleDarkMode = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateSetting('theme.mode', newTheme);
  };

  const toggleDoNotDisturb = () => {
    updateSetting('notifications.doNotDisturb', !settings.notifications.doNotDisturb);
  };

  // Slider handlers
  const handleVolumeChange = (e) => {
    updateSetting('system.volume', parseInt(e.target.value));
  };

  const handleBrightnessChange = (e) => {
    updateSetting('system.brightness', parseInt(e.target.value));
  };

  // Quick settings toggle button component
  const QuickToggle = ({ icon: Icon, label, active, onClick, activeColor = 'var(--theme-accent)' }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      className="flex flex-col items-center justify-center p-4 rounded-lg border"
      style={{
        backgroundColor: active ? activeColor : 'var(--theme-surface)',
        borderColor: active ? activeColor : 'var(--theme-border)',
        color: active ? 'white' : 'var(--theme-text)',
        cursor: 'pointer'
      }}
    >
      <Icon size={24} strokeWidth={2} />
      <span className="text-xs font-medium mt-2">{label}</span>
    </motion.button>
  );

  // Slider component
  const QuickSlider = ({ icon: Icon, label, value, onChange, max = 100 }) => (
    <div 
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums">{value}%</span>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="absolute top-12 right-3 z-[1700] w-80 rounded-lg shadow-2xl border"
      style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <h3 
          className="text-sm font-semibold"
          style={{ color: 'var(--theme-text)' }}
        >
          Quick Settings
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10"
          style={{ color: 'var(--theme-text)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Toggles Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-3">
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
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-3 border-t"
        style={{ 
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-background)'
        }}
      >
        <button
          className="w-full py-2 px-4 rounded text-sm font-medium"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'white'
          }}
          onClick={onClose}
        >
          All Settings
        </button>
      </div>
    </motion.div>
  );
}
