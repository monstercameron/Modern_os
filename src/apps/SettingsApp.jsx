import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { dispatch, actions, useKernel, select } from "../kernel/index.js";
import { useSettings } from "../hooks/useSettings.jsx";
import { Sun, Moon, RefreshCw, Download, Upload, Trash2, AlertTriangle } from "lucide-react";


/** Colour tokens exposed in Settings, in the order they are shown. */
const COLOR_TOKENS = [
  ['accent', 'Accent Color'],
  ['accentText', 'Accent Text'],
  ['background', 'Background'],
  ['surface', 'Surface'],
  ['surfaceAlt', 'Surface (alt)'],
  ['text', 'Text'],
  ['textMuted', 'Muted Text'],
  ['border', 'Borders'],
];

/** A labelled slider for the numeric shape tokens. */
function RangeSetting({ label, value, min, max, onChange, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-slate-500 tabular-nums">{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export function SettingsApp() {
  const { theme, presets, shadowLevels, setTheme, updateTheme, setColor, toggleLightDark, resetTheme, isLight } = useTheme();
  const focusFollowsMouse = useKernel(select.focusFollowsMouse);
  const { settings, updateSetting, resetSettings, resetSection, exportSettings, importSettings } = useSettings();
  const [activeSection, setActiveSection] = useState("Personalization");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sections = ["System", "Display", "Network", "Sound", "Personalization", "Apps", "Privacy", "Data & Storage"];

  const handleExportSettings = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metro-os-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = importSettings(event.target.result);
          if (success) {
            alert('Settings imported successfully!');
          } else {
            alert('Failed to import settings. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetAllSettings = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    alert('All settings have been reset to defaults.');
  };

  const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-slate-300 cursor-pointer"
        />
        <span className="text-xs text-slate-500 font-mono">{value}</span>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "Personalization":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Theme Customization</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Light / Dark Mode</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={toggleLightDark}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 transition-colors rounded"
                  >
                    {isLight ? <Moon size={18} /> : <Sun size={18} />}
                    <span>{isLight ? 'Switch to Dark' : 'Switch to Light'}</span>
                  </button>
                  <button
                    onClick={resetTheme}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 transition-colors rounded"
                    title="Reset to the default dark theme"
                  >
                    <RefreshCw size={18} />
                    <span>Reset Theme</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                    <span className="text-sm text-slate-600">{theme.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Colors</h3>
                <div className="space-y-3">
                  {COLOR_TOKENS.map(([key, label]) => (
                    <ColorPicker
                      key={key}
                      label={label}
                      value={theme.colors[key]}
                      onChange={(value) => setColor(key, value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Shape &amp; Depth</h3>
                <div className="space-y-4">
                  <RangeSetting
                    label="Corner radius"
                    value={theme.radius}
                    min={0}
                    max={24}
                    onChange={(v) => updateTheme({ radius: v })}
                  />
                  <RangeSetting
                    label="Border width"
                    value={theme.borderWidth}
                    min={0}
                    max={6}
                    hint="A focused window thickens its border only above 1px"
                    onChange={(v) => updateTheme({ borderWidth: v })}
                  />
                  <RangeSetting
                    label="Tile gap"
                    value={theme.tileGap}
                    min={0}
                    max={24}
                    onChange={(v) => updateTheme({ tileGap: v })}
                  />
                  <RangeSetting
                    label="Window gap"
                    value={theme.windowGap}
                    min={0}
                    max={32}
                    hint="Space between tiled windows"
                    onChange={(v) => updateTheme({ windowGap: v })}
                  />
                  <div>
                    <div className="text-sm font-medium mb-2">Shadow</div>
                    <div className="flex gap-2 flex-wrap">
                      {shadowLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => updateTheme({ shadow: level })}
                          className="px-3 py-1.5 text-sm border rounded capitalize transition-colors"
                          style={{
                            borderColor: theme.shadow === level ? 'var(--theme-accent)' : 'var(--theme-border)',
                            backgroundColor: theme.shadow === level ? 'var(--theme-accent)' : 'transparent',
                            color: theme.shadow === level ? 'var(--theme-accent-text)' : 'var(--theme-text)',
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Behaviour</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusFollowsMouse}
                    onChange={(e) => dispatch(actions.setPref('focusFollowsMouse', e.target.checked))}
                  />
                  <span className="text-sm">Focus follows mouse</span>
                </label>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Theme Presets</h3>
                <p className="text-xs text-slate-500 mb-3">Click any preset to apply it</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(presets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className="p-3 border border-slate-300 hover:border-slate-400 text-left transition-all hover:shadow-md"
                      style={{ borderRadius: preset.radius + 'px' }}
                      data-preset={key}
                    >
                      <div className="font-medium mb-1">{preset.name}</div>
                      <div className="text-xs text-slate-500 mb-2">
                        {preset.radius}px radius &middot; {preset.borderWidth}px border &middot; {preset.shadow} shadow
                      </div>
                      <div className="flex gap-1 mt-2">
                        <div className="w-4 h-4" style={{ backgroundColor: preset.colors.accent }}></div>
                        <div className="w-4 h-4" style={{ backgroundColor: preset.colors.surface }}></div>
                        <div className="w-4 h-4" style={{ backgroundColor: preset.colors.background }}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "System":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">System Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Quick Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span>Wi-Fi</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.wifi}
                        onChange={(e) => updateSetting('system.wifi', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span>Bluetooth</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.bluetooth}
                        onChange={(e) => updateSetting('system.bluetooth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="py-2">
                    <div className="flex justify-between mb-2">
                      <span>Volume</span>
                      <span className="text-sm text-slate-500">{settings.system.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.system.volume}
                      onChange={(e) => updateSetting('system.volume', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="py-2">
                    <div className="flex justify-between mb-2">
                      <span>Brightness</span>
                      <span className="text-sm text-slate-500">{settings.system.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.system.brightness}
                      onChange={(e) => updateSetting('system.brightness', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "Display":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Display Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Layout</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span>Show Labels</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.layout.showLabels}
                        onChange={(e) => updateSetting('layout.showLabels', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span>Compact Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.layout.compactMode}
                        onChange={(e) => updateSetting('layout.compactMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "Data & Storage":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Data & Storage</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Settings Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleExportSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download size={18} />
                    Export Settings
                  </button>
                  
                  <button
                    onClick={handleImportSettings}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    <Upload size={18} />
                    Import Settings
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-lg font-medium mb-3 text-red-600">Danger Zone</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Reset all settings to their default values. This action cannot be undone.
                </p>
                <button
                  onClick={handleResetAllSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Reset All Settings
                </button>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                    <div>
                      <strong>Keyboard shortcut:</strong> Press <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">Shift</kbd> + <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">R</kbd> for emergency reset
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-lg font-medium mb-3">Current Settings</h3>
                <pre className="p-4 bg-slate-100 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(settings, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-slate-600">
            <h2 className="text-xl font-semibold mb-4">{activeSection}</h2>
            <p>Settings for {activeSection.toLowerCase()} will be implemented here.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full grid grid-cols-12">
      <div className="col-span-4 border-r border-slate-300 p-4 space-y-1">
        {sections.map(s => (
          <div
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-2 cursor-pointer flex items-center justify-between rounded ${
              activeSection === s ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
            }`}
          >
            <span>{s}</span>
            <span className="text-slate-400">›</span>
          </div>
        ))}
      </div>
      <div className="col-span-8 p-6 overflow-auto">
        {renderContent()}
      </div>
      
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-lg font-semibold mb-2">Reset All Settings?</h3>
                <p className="text-sm text-slate-600">
                  This will reset all settings to their default values, including:
                </p>
                <ul className="text-sm text-slate-600 mt-2 list-disc list-inside">
                  <li>Theme and appearance</li>
                  <li>Layout preferences</li>
                  <li>System settings</li>
                  <li>Notification preferences</li>
                  <li>App configurations</li>
                </ul>
                <p className="text-sm text-red-600 font-medium mt-3">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}