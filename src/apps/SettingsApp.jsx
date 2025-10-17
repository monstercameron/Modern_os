import React, { useState } from "react";
import { useTheme, themes } from "../ThemeContext.jsx";
import { Sun, Moon, RefreshCw } from "lucide-react";

export function SettingsApp() {
  const { currentTheme, theme, applyPreset, updateCustomTheme, toggleLightDark, resetTheme, isLight, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("Personalization");

  const sections = ["System", "Display", "Network", "Sound", "Personalization", "Apps", "Privacy"];

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
                    title="Reset to default dark theme"
                  >
                    <RefreshCw size={18} />
                    <span>Reset Theme</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                    <span className="text-sm text-slate-600">
                      {currentTheme === 'light' ? 'Light Mode' : currentTheme === 'dark' ? 'Dark Mode' : 'Custom Theme'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Colors</h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Accent Color"
                    value={theme.accent}
                    onChange={(value) => updateCustomTheme({ accent: value })}
                  />
                  <ColorPicker
                    label="Background"
                    value={theme.background}
                    onChange={(value) => updateCustomTheme({ background: value })}
                  />
                  <ColorPicker
                    label="Surface"
                    value={theme.surface}
                    onChange={(value) => updateCustomTheme({ surface: value })}
                  />
                  <ColorPicker
                    label="Text"
                    value={theme.text}
                    onChange={(value) => updateCustomTheme({ text: value })}
                  />
                  <ColorPicker
                    label="Borders"
                    value={theme.border}
                    onChange={(value) => updateCustomTheme({ border: value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Theme Presets</h3>
                <p className="text-xs text-slate-500 mb-3">Click any preset to instantly apply it</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Light", theme: 'light', description: "Clean & professional" },
                    { name: "Dark", theme: 'dark', description: "Default dark theme" },
                    { name: "Midnight Blue", colors: { accent: "#1e40af", background: "#0f1419", surface: "#1e293b", text: "#e2e8f0", border: "#475569" }, description: "Deep blue tones" },
                    { name: "Purple Haze", colors: { accent: "#a855f7", background: "#1a103d", surface: "#2d1b69", text: "#f3f4f6", border: "#6b46c1" }, description: "Rich purple" },
                    { name: "Forest Green", colors: { accent: "#10b981", background: "#064e3b", surface: "#065f46", text: "#d1fae5", border: "#047857" }, description: "Natural green" },
                    { name: "Sunset Orange", colors: { accent: "#f97316", background: "#431407", surface: "#7c2d12", text: "#fed7aa", border: "#ea580c" }, description: "Warm orange" },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset.theme || preset.colors)}
                      className="p-3 border border-slate-300 hover:border-slate-400 text-left rounded transition-all hover:shadow-md group relative"
                      title={preset.description}
                    >
                      <div className="font-medium mb-1">{preset.name}</div>
                      {preset.description && (
                        <div className="text-xs text-slate-500 mb-2">{preset.description}</div>
                      )}
                      <div className="flex gap-1 mt-2">
                        {preset.theme ? (
                          <>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: themes[preset.theme].accent }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: themes[preset.theme].surface }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: themes[preset.theme].background }}></div>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.accent }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.surface }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.colors.background }}></div>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
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
            className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
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
    </div>
  );
}