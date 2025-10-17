import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Mail, Music, Clock, Cloud, Activity, 
  Play, Pause, Plus, Minus, Check, X 
} from 'lucide-react';

/**
 * Tile Configurator App
 * Demonstrates all tile features with live configuration
 */
export function TileConfiguratorApp() {
  const [activeSection, setActiveSection] = useState('sizes');
  const [config, setConfig] = useState({
    size: '1x1',
    iconType: 'lucide',
    showBadge: true,
    showControls: true,
    showWidget: false,
    animationType: 'scale',
    badgeCount: 3,
  });

  const sections = [
    { id: 'sizes', label: 'Size Variants' },
    { id: 'icons', label: 'Icon Types' },
    { id: 'text', label: 'Text Layouts' },
    { id: 'controls', label: 'Controls' },
    { id: 'widgets', label: 'Live Widgets' },
    { id: 'animations', label: 'Animations' },
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Sidebar */}
      <div className="w-48 bg-black/20 p-4 border-r border-white/10">
        <h2 className="text-sm font-bold mb-4 text-white/70">SECTIONS</h2>
        <div className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <h2 className="text-sm font-bold mb-4 text-white/70">ABOUT</h2>
          <p className="text-xs text-white/50">
            Interactive demonstration of Metro OS tile system features and capabilities.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeSection === 'sizes' && <SizeVariants config={config} setConfig={setConfig} />}
          {activeSection === 'icons' && <IconTypes config={config} setConfig={setConfig} />}
          {activeSection === 'text' && <TextLayouts config={config} setConfig={setConfig} />}
          {activeSection === 'controls' && <ControlsDemo config={config} setConfig={setConfig} />}
          {activeSection === 'widgets' && <LiveWidgets config={config} setConfig={setConfig} />}
          {activeSection === 'animations' && <AnimationsDemo config={config} setConfig={setConfig} />}
        </div>
      </div>
    </div>
  );
}

// Size Variants Section
function SizeVariants({ config, setConfig }) {
  const sizes = [
    { id: '1x1', cols: 1, rows: 1, label: 'Small (1×1)' },
    { id: '2x1', cols: 2, rows: 1, label: 'Wide (2×1)' },
    { id: '1x2', cols: 1, rows: 2, label: 'Tall (1×2)' },
    { id: '2x2', cols: 2, rows: 2, label: 'Large (2×2)' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Size Variants</h1>
      <p className="text-white/60 mb-6">Tiles come in standard sizes that snap to a responsive grid.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {sizes.map(size => (
          <button
            key={size.id}
            onClick={() => setConfig({ ...config, size: size.id })}
            className={`p-4 rounded border-2 transition-colors ${
              config.size === size.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-sm font-medium">{size.label}</div>
            <div className="text-xs text-white/50 mt-1">{size.cols}×{size.rows}</div>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="bg-black/30 p-8 rounded-lg">
        <h3 className="text-sm font-bold text-white/70 mb-4">PREVIEW</h3>
        <div className="grid grid-cols-4 auto-rows-[96px] gap-2 max-w-4xl">
          <TilePreview config={config} />
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-6 p-4 bg-white/5 rounded">
        <h4 className="font-semibold mb-2">Specifications</h4>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• Base tile size: 80px × 80px</li>
          <li>• Grid gap: 8px</li>
          <li>• Responsive: Scales with viewport</li>
          <li>• Tailwind class: <code className="text-blue-400">col-span-{config.size.split('x')[0]} row-span-{config.size.split('x')[1]}</code></li>
        </ul>
      </div>
    </div>
  );
}

// Icon Types Section
function IconTypes({ config, setConfig }) {
  const iconTypes = [
    { id: 'lucide', label: 'Lucide React', example: Mail },
    { id: 'emoji', label: 'Emoji', example: '📧' },
    { id: 'svg', label: 'Custom SVG', example: 'SVG' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Icon Types</h1>
      <p className="text-white/60 mb-6">Three icon systems for different use cases.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {iconTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setConfig({ ...config, iconType: type.id })}
            className={`p-6 rounded border-2 transition-colors ${
              config.iconType === type.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-3xl mb-2">
              {typeof type.example === 'string' ? type.example : <type.example size={32} />}
            </div>
            <div className="text-sm font-medium">{type.label}</div>
          </button>
        ))}
      </div>

      {/* Examples */}
      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded">
          <h4 className="font-semibold mb-2">1. Lucide React Icons</h4>
          <p className="text-sm text-white/70 mb-3">Vector icons, customizable size and color</p>
          <div className="flex gap-4">
            <Mail size={24} className="opacity-90" />
            <Music size={28} className="opacity-90" />
            <Clock size={32} className="opacity-90" />
          </div>
          <code className="text-xs text-blue-400 mt-2 block">
            {'<Mail className="opacity-90" size={24} />'}
          </code>
        </div>

        <div className="p-4 bg-white/5 rounded">
          <h4 className="font-semibold mb-2">2. Emoji Icons</h4>
          <p className="text-sm text-white/70 mb-3">Unicode emojis, colorful and expressive</p>
          <div className="flex gap-4 text-3xl">
            📧 🎵 🕐 ☁️ 📊
          </div>
          <code className="text-xs text-blue-400 mt-2 block">
            {'<span className="text-3xl">📧</span>'}
          </code>
        </div>

        <div className="p-4 bg-white/5 rounded">
          <h4 className="font-semibold mb-2">3. Custom SVG</h4>
          <p className="text-sm text-white/70 mb-3">Full control over paths and styling</p>
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
          </svg>
          <code className="text-xs text-blue-400 mt-2 block">
            {'<svg className="w-6 h-6" viewBox="0 0 24 24">...</svg>'}
          </code>
        </div>
      </div>
    </div>
  );
}

// Text Layouts Section
function TextLayouts({ config, setConfig }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Text Layouts</h1>
      <p className="text-white/60 mb-6">Hierarchical text display with character limits.</p>

      <div className="space-y-6">
        {/* Primary Text */}
        <div className="p-6 bg-white/5 rounded">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Primary Text (Title)</h4>
            <span className="text-xs text-white/50">14px • 600 weight</span>
          </div>
          <div className="font-semibold text-white mb-2">Application Title</div>
          <code className="text-xs text-blue-400">
            {'<div className="font-semibold text-white">{title}</div>'}
          </code>
          <p className="text-xs text-white/60 mt-2">Max 12 chars (1×1) to 30 chars (2×2)</p>
        </div>

        {/* Secondary Text */}
        <div className="p-6 bg-white/5 rounded">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Secondary Text (Subtitle)</h4>
            <span className="text-xs text-white/50">12px • 400 weight</span>
          </div>
          <div className="text-white/90 text-xs mb-2">Subtitle or description text</div>
          <code className="text-xs text-blue-400">
            {'<div className="text-white/90 text-xs">{subtitle}</div>'}
          </code>
          <p className="text-xs text-white/60 mt-2">Max 20-60 chars depending on tile size</p>
        </div>

        {/* Tertiary Text */}
        <div className="p-6 bg-white/5 rounded">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Tertiary Text (Body)</h4>
            <span className="text-xs text-white/50">10px • 400 weight</span>
          </div>
          <div className="text-white/70 text-[10px] mb-2">Additional details or body text content</div>
          <code className="text-xs text-blue-400">
            {'<div className="text-white/70 text-[10px]">{body}</div>'}
          </code>
          <p className="text-xs text-white/60 mt-2">Used for metadata, timestamps, etc.</p>
        </div>

        {/* Truncation Examples */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Text Truncation</h4>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/60 mb-1">Single line truncate:</div>
              <div className="truncate bg-black/30 p-2 rounded max-w-xs">
                This is a very long text that will be truncated with ellipsis
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60 mb-1">Two line clamp:</div>
              <div className="line-clamp-2 bg-black/30 p-2 rounded max-w-xs">
                This is a longer text that will be shown on two lines maximum before being truncated with ellipsis at the end
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Controls Demo Section
function ControlsDemo({ config, setConfig }) {
  const [sliderValue, setSliderValue] = useState(50);
  const [toggle, setToggle] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Interactive Controls</h1>
      <p className="text-white/60 mb-6">Buttons, sliders, toggles, and badges for tile interaction.</p>

      <div className="space-y-6">
        {/* Buttons */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Action Buttons</h4>
          <div className="space-y-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 bg-black/30 border border-white/30 text-sm font-medium hover:bg-black/50 transition-colors rounded"
            >
              ✉️ Compose New
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 bg-black/30 border border-white/30 text-sm font-medium hover:bg-black/50 transition-colors rounded"
            >
              💬 Quick Reply
            </button>
          </div>
          <code className="text-xs text-blue-400 mt-3 block">
            {'onClick={(e) => {e.stopPropagation(); action()}}'}
          </code>
          <p className="text-xs text-white/60 mt-2">Always use stopPropagation() to prevent tile click</p>
        </div>

        {/* Sliders */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Sliders</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Volume</span>
                <span className="text-white/60">{sliderValue}%</span>
              </div>
              <input 
                type="range" 
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                min="0" 
                max="100" 
                value={sliderValue}
                onChange={(e) => {e.stopPropagation(); setSliderValue(e.target.value);}}
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Toggles / Switches</h4>
          <button 
            onClick={(e) => {e.stopPropagation(); setToggle(!toggle);}}
            className={`px-4 py-2 rounded transition-colors ${
              toggle ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            {toggle ? '✓ Enabled' : '○ Disabled'}
          </button>
        </div>

        {/* Badges */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Notification Badges</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Messages</span>
              <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full font-medium">
                5
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Email</span>
              <span className="text-xs bg-white/30 px-2 py-0.5 rounded font-medium">
                12
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live Widgets Section
function LiveWidgets({ config, setConfig }) {
  const [time, setTime] = useState(new Date());
  const [progress, setProgress] = useState(65);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Live Widgets</h1>
      <p className="text-white/60 mb-6">Real-time data display and interactive visualizations.</p>

      <div className="space-y-6">
        {/* Clock */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Clock / Timer</h4>
          <div className="text-4xl font-bold">{time.toLocaleTimeString()}</div>
          <div className="text-sm text-white/60 mt-1">{time.toLocaleDateString()}</div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Progress Bar</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Download</span>
                <span className="text-white/60">{progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{width: `${progress}%`}}
                />
              </div>
            </div>
            <button 
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="px-3 py-1 bg-white/10 rounded text-sm"
            >
              + 10%
            </button>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Mini Chart</h4>
          <div className="flex items-end gap-1 h-20">
            {[40, 60, 45, 80, 70, 90, 65].map((val, i) => (
              <div 
                key={i}
                className="flex-1 bg-blue-500/60 rounded-t transition-all hover:bg-blue-500"
                style={{height: `${val}%`}}
              />
            ))}
          </div>
        </div>

        {/* Counter */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Counter / Stats</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">24</span>
            <span className="text-lg text-white/60">tasks</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Status Indicators</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-sm">Away</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-sm">Offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Animations Demo Section
function AnimationsDemo({ config, setConfig }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Animations</h1>
      <p className="text-white/60 mb-6">Smooth, performant animations for tile interactions.</p>

      <div className="space-y-6">
        {/* Hover Scale */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Hover Scale</h4>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="w-32 h-32 bg-blue-600 rounded flex items-center justify-center cursor-pointer"
          >
            <Mail size={32} />
          </motion.div>
          <code className="text-xs text-blue-400 mt-3 block">
            whileHover=&#123;&#123; scale: 1.03 &#125;&#125;
          </code>
        </div>

        {/* Shine Effect */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Shine Effect</h4>
          <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="relative w-64 h-32 bg-purple-600 rounded overflow-hidden cursor-pointer flex items-center justify-center"
          >
            <Music size={32} />
            <motion.span
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
              initial={{ x: "-120%" }}
              animate={{ x: isHovered ? "220%" : "-120%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </motion.div>
        </div>

        {/* Content Reveal */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Content Reveal (on hover)</h4>
          <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-64 p-4 bg-red-600 rounded cursor-pointer"
          >
            <div className="font-semibold">Email</div>
            {isHovered && (
              <motion.div
                initial={{opacity:0, y:4}}
                animate={{opacity:1, y:0}}
                transition={{ duration: 0.15 }}
              >
                <button className="mt-2 w-full px-2 py-1 bg-black/30 border border-white/30 text-xs">
                  ✉️ Compose
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Badge Pulse */}
        <div className="p-6 bg-white/5 rounded">
          <h4 className="font-semibold mb-4">Badge Pulse</h4>
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-xs bg-red-600 px-2 py-0.5 rounded-full font-medium"
            >
              3
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tile Preview Component
function TilePreview({ config }) {
  const [hv, setHv] = useState(false);
  
  const sizeClasses = {
    '1x1': 'col-span-1 row-span-1',
    '2x1': 'col-span-2 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x2': 'col-span-2 row-span-2',
  };

  return (
    <motion.div
      onHoverStart={() => setHv(true)}
      onHoverEnd={() => setHv(false)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`relative ${sizeClasses[config.size]} bg-blue-600 p-3 flex flex-col rounded cursor-pointer overflow-hidden`}
    >
      {/* Shine effect */}
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
        initial={{ x: "-120%" }}
        animate={{ x: hv ? "220%" : "-120%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            Preview
            {config.showBadge && (
              <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">
                {config.badgeCount}
              </span>
            )}
          </div>
          <div className="text-white/80 text-xs mt-1">
            {config.size} tile
          </div>
        </div>
        {config.iconType === 'lucide' && <Mail className="opacity-90" size={24} />}
        {config.iconType === 'emoji' && <span className="text-2xl">📧</span>}
      </div>

      {hv && config.showControls && (
        <motion.div
          initial={{opacity:0, y:4}}
          animate={{opacity:1, y:0}}
          className="mt-auto"
        >
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium"
          >
            Action
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
