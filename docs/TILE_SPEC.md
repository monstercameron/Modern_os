# Tile Specification

## Overview
Tiles are the primary interface elements on the Metro OS desktop. They provide quick access to apps and display live information through interactive widgets.

## Table of Contents
1. [Tile Sizes](#tile-sizes)
2. [Icon Types](#icon-types)
3. [Text Display](#text-display)
4. [Interactive Controls](#interactive-controls)
5. [Live Widgets](#live-widgets)
6. [Visibility States](#visibility-states)
7. [Grid Snapping](#grid-snapping)
8. [Animations](#animations)
9. [Implementation Examples](#implementation-examples)

---

## Tile Sizes

### Standard Sizes
Tiles follow a responsive grid system with standard size variants:

| Size | Dimensions | Tailwind Class | Use Case |
|------|------------|----------------|----------|
| **Small** | 1x1 | `col-span-1 row-span-1` | Single icon apps (Calculator, Settings) |
| **Wide** | 2x1 | `col-span-2 row-span-1` | Horizontal content (Browser, Music, News) |
| **Tall** | 1x2 | `col-span-1 row-span-2` | Vertical content (Text, Files) |
| **Large** | 2x2 | `col-span-2 row-span-2` | Rich content (Code, Photos) |
| **Extra Tall** | 1x4 | `col-span-1 row-span-4` | Extended vertical (Calendar, Tasks) |
| **Extra Wide** | 4x1 | `col-span-4 row-span-1` | Panoramic (Weather, Maps) |
| **Mega** | 2x4 | `col-span-2 row-span-4` | Dashboard (Activity Monitor) |

### Responsive Scaling Rules
- Minimum tile size: 80px × 80px
- Grid gap: 8px (Tailwind: `gap-2`)
- Tiles scale proportionally on viewport resize
- Text scales with tile size (10px-14px range)

---

## Icon Types

### 1. Lucide React Icons
**Default icon system** - Vector icons from lucide-react library
```javascript
import { Mail, Music, Calendar } from 'lucide-react';
<Mail className="opacity-90" size={24} />
```

**Properties:**
- Size: 20-32px (adjustable)
- Color: Inherits from parent (white on colored background)
- Opacity: 0.9 for subtle effect
- Stroke width: 2 (default)

### 2. Emoji Icons
**Unicode emojis** for expressive, colorful icons
```javascript
<span className="text-3xl">📧</span>
```

**Properties:**
- Size: text-2xl (24px) to text-4xl (36px)
- No color customization (native emoji colors)
- Use for: Weather conditions, notifications, reactions

### 3. Custom SVG Icons
**Brand logos and unique designs**
```javascript
<svg className="w-6 h-6" viewBox="0 0 24 24">...</svg>
```

**Properties:**
- Custom paths and shapes
- Full color control
- Use for: Brand identities, special apps

---

## Text Display

### Text Hierarchy

#### Primary Text (Title)
```javascript
<div className="font-semibold text-white">{app.title}</div>
```
- Font: 600 weight
- Size: 14px base
- Color: White (text-white)
- Max lines: 1 (truncate)

#### Secondary Text (Subtitle)
```javascript
<div className="text-white/90 text-xs">{subtitle}</div>
```
- Font: 400 weight
- Size: 12px (text-xs)
- Color: White 90% opacity
- Max lines: 2 (truncate)

#### Tertiary Text (Body)
```javascript
<div className="text-white/70 text-[10px]">{body}</div>
```
- Font: 400 weight
- Size: 10px
- Color: White 70% opacity
- Max lines: 3 (truncate)

### Character Limits
| Tile Size | Title Max | Subtitle Max | Body Max |
|-----------|-----------|--------------|----------|
| 1x1 | 12 chars | 20 chars | N/A |
| 2x1 | 20 chars | 40 chars | 80 chars |
| 1x2 | 12 chars | 30 chars | 100 chars |
| 2x2 | 30 chars | 60 chars | 150 chars |

### Text Truncation
```javascript
<div className="truncate">{longText}</div>
<div className="line-clamp-2">{multiLineText}</div>
```

---

## Interactive Controls

### 1. Buttons
**Action buttons within tiles**
```javascript
<button 
  onClick={(e) => {e.stopPropagation(); handleAction();}}
  className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium hover:bg-black/50"
>
  ✉️ Compose New
</button>
```

**Properties:**
- Background: `bg-black/30` (semi-transparent)
- Border: `border-white/30`
- Hover: `bg-black/50`
- Text: 10px, 500 weight
- Full width or auto
- Always use `e.stopPropagation()` to prevent tile click

### 2. Sliders
**Volume, brightness, progress controls**
```javascript
<input 
  type="range" 
  className="w-full h-1 bg-white/30 rounded-full"
  min="0" max="100" value={value}
  onChange={(e) => {e.stopPropagation(); setValue(e.target.value);}}
/>
```

### 3. Toggles/Switches
**On/off states**
```javascript
<button 
  onClick={(e) => {e.stopPropagation(); toggle();}}
  className={`px-2 py-1 rounded ${isOn ? 'bg-white/30' : 'bg-black/30'}`}
>
  {isOn ? '✓ On' : '○ Off'}
</button>
```

### 4. Badges
**Notification counts**
```javascript
{badge > 0 && (
  <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">
    {badge}
  </span>
)}
```

---

## Live Widgets

### 1. Clocks/Timers
**Real-time time display**
```javascript
<div className="text-2xl font-bold">{time}</div>
<div className="text-xs text-white/70">{date}</div>
```

### 2. Progress Bars
**Downloads, uploads, tasks**
```javascript
<div className="w-full bg-white/20 rounded-full h-1.5">
  <div 
    className="bg-white h-full rounded-full transition-all"
    style={{width: `${progress}%`}}
  />
</div>
```

### 3. Charts/Graphs
**Activity, analytics, stats**
```javascript
<div className="flex items-end gap-1 h-12">
  {data.map((val, i) => (
    <div 
      key={i}
      className="flex-1 bg-white/40 rounded-t"
      style={{height: `${val}%`}}
    />
  ))}
</div>
```

### 4. Counters/Stats
**Numbers, metrics**
```javascript
<div className="flex items-baseline gap-1">
  <span className="text-3xl font-bold">{count}</span>
  <span className="text-xs text-white/70">{unit}</span>
</div>
```

### 5. Status Indicators
**Online/offline, connected/disconnected**
```javascript
<div className="flex items-center gap-1">
  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
  <span className="text-xs">{status}</span>
</div>
```

---

## Visibility States

### 1. Default State
- Full color background
- Icon visible
- Title visible
- Hover effects enabled

### 2. Hover State
**Enhanced on hover**
```javascript
<motion.div
  whileHover={{ scale: 1.03 }}
  transition={{ duration: 0.12, ease: "easeOut" }}
>
```
- Scale: 1.03
- Shows additional controls/info
- Shine effect (optional)

### 3. Expanded State (Hover-revealed content)
```javascript
{hv && (
  <motion.div 
    initial={{opacity:0, y:4}} 
    animate={{opacity:1, y:0}}
  >
    {/* Additional content */}
  </motion.div>
)}
```

### 4. Collapsed State
- Minimal view
- Icon + title only
- No interactive controls visible

### 5. Hidden State
- `display: none` or `opacity: 0`
- Filtered from grid
- Can be toggled in settings

---

## Grid Snapping

### Grid System
- Base unit: 80px tile + 8px gap
- 6 columns by default (desktop)
- Auto rows: 96px height
- Gap: 8px (Tailwind: `gap-2`)

### Snap Rules
1. **Left Align**: Tiles snap to column boundaries
2. **Top Align**: Tiles snap to row boundaries
3. **No Overlap**: Tiles cannot overlap
4. **Fill Gaps**: Tiles flow to fill empty spaces
5. **Reflow**: Grid reflows on window resize

### Grid Classes
```javascript
className="grid grid-cols-6 auto-rows-[96px] gap-2"
```

### Responsive Breakpoints
| Breakpoint | Columns | Tile Base Size |
|------------|---------|----------------|
| sm (640px) | 4 | 70px |
| md (768px) | 5 | 75px |
| lg (1024px) | 6 | 80px |
| xl (1280px) | 8 | 85px |
| 2xl (1536px) | 10 | 90px |

---

## Animations

### Hover Animation
```javascript
whileHover={{ scale: 1.03 }}
transition={{ duration: 0.12, ease: "easeOut" }}
```

### Shine Effect
```javascript
<motion.span
  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 
             bg-gradient-to-r from-white/0 via-white/40 to-white/0"
  initial={{ x: "-120%" }}
  animate={{ x: hv ? "220%" : "-120%" }}
  transition={{ duration: 0.12, ease: "easeOut" }}
/>
```

### Content Reveal (on hover)
```javascript
<motion.div 
  initial={{opacity:0, y:4}} 
  animate={{opacity:1, y:0}}
  transition={{ duration: 0.15 }}
>
```

### Badge Pulse (notifications)
```javascript
<motion.span
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
>
```

### Spring Animation (future)
```javascript
transition={{ 
  type: 'spring', 
  stiffness: 400, 
  damping: 30, 
  mass: 0.8 
}}
```

---

## Implementation Examples

### Example 1: Simple Tile (Calculator)
```javascript
<motion.div
  onClick={onOpen}
  whileHover={{ scale: 1.03 }}
  className="bg-gray-600 p-3 flex flex-col col-span-1 row-span-1"
>
  <Calculator className="opacity-90" size={28} />
  <div className="font-semibold">Calculator</div>
</motion.div>
```

### Example 2: Email Tile with Badge
```javascript
<motion.div className="bg-red-600 p-3 col-span-1 row-span-1">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="font-semibold flex items-center gap-2">
        Email
        {badge > 0 && (
          <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {badge > 0 && (
        <div className="text-white/90 text-[10px] mt-1">
          <div className="font-medium truncate">📧 Re: Project Update</div>
          <div className="text-white/70">From: team@company.com</div>
        </div>
      )}
    </div>
    <Mail className="opacity-90" size={24} />
  </div>
  {hv && (
    <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
      <button className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px]">
        ✉️ Compose New
      </button>
    </motion.div>
  )}
</motion.div>
```

### Example 3: Music Tile with Controls
```javascript
<motion.div className="bg-purple-600 p-3 col-span-2 row-span-1">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="font-semibold">Music</div>
      <div className="text-xs text-white/80 truncate">Now Playing: {song}</div>
    </div>
    <Music size={24} />
  </div>
  
  {/* Progress bar */}
  <div className="mt-2 w-full bg-white/20 rounded-full h-1">
    <div className="bg-white h-full rounded-full" style={{width: `${progress}%`}} />
  </div>
  
  {/* Controls */}
  {hv && (
    <div className="flex gap-2 mt-2">
      <button onClick={prev}>⏮</button>
      <button onClick={toggle}>{playing ? '⏸' : '▶'}</button>
      <button onClick={next}>⏭</button>
    </div>
  )}
</motion.div>
```

### Example 4: Weather Tile with Widget
```javascript
<motion.div className="bg-sky-500 p-3 col-span-1 row-span-1">
  <Cloud className="opacity-90" size={24} />
  <div className="font-semibold">Weather</div>
  
  <div className="flex items-baseline gap-1 mt-2">
    <span className="text-3xl font-bold">72°</span>
    <span className="text-xs text-white/70">F</span>
  </div>
  
  <div className="text-xs text-white/80 mt-1">
    Partly Cloudy
  </div>
  
  {hv && (
    <div className="text-[10px] text-white/70 mt-2">
      🌡️ H: 78° L: 65°<br/>
      💨 Wind: 5 mph<br/>
      💧 Humidity: 45%
    </div>
  )}
</motion.div>
```

---

## Best Practices

### Do's ✓
- Use consistent icon sizes (24-28px)
- Keep text concise and readable
- Always stopPropagation on nested buttons
- Use semantic HTML elements
- Test hover states on all tiles
- Implement loading states for live data
- Use Tailwind's opacity utilities for layering

### Don'ts ✗
- Don't nest interactive elements without stopPropagation
- Don't use more than 3 text hierarchy levels
- Don't make tiles too cluttered
- Don't use heavy animations (keep under 200ms)
- Don't hard-code colors (use Tailwind classes)
- Don't ignore accessibility (add aria labels)

---

## Accessibility

### Keyboard Navigation
- Tiles should be focusable: `tabIndex={0}`
- Enter/Space should trigger onClick
- Arrow keys navigate between tiles

### Screen Readers
```javascript
<motion.div
  role="button"
  aria-label={`Open ${app.title}`}
  tabIndex={0}
>
```

### Color Contrast
- Ensure text-white has sufficient contrast on backgrounds
- Use opacity overlays for better readability
- Minimum contrast ratio: 4.5:1

---

## Future Enhancements
- [ ] Drag-and-drop tile reordering
- [ ] Custom tile colors/themes
- [ ] Tile groups/folders
- [ ] Tile animations on data updates
- [ ] Tile widget API
- [ ] Live tile backgrounds
- [ ] Tile search/filtering
- [ ] Tile export/import configurations

---

**Last Updated:** October 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete
