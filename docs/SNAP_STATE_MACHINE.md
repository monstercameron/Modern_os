# Snap State Machine - Implementation Guide

## Overview

The snap state machine provides clean, declarative snap zone detection and management. It makes snapping logic easy to understand and debug.

## Snap Zones (Half-Screen Areas)

The window snapping system now uses half-screen detection areas for larger, easier-to-trigger snap zones:

### Half-Screen Zones
- **LEFT** - Entire left half of screen (50% width, 100% height)
- **RIGHT** - Entire right half of screen (50% width, 100% height)
- **TOP** - Entire top half of screen (100% width, 50% height)
- **BOTTOM** - Entire bottom half of screen (100% width, 50% height)

### Quadrant Zones
- **TOP_LEFT** - Top-left quarter (50% width, 50% height)
- **TOP_RIGHT** - Top-right quarter (50% width, 50% height)
- **BOTTOM_LEFT** - Bottom-left quarter (50% width, 50% height)
- **BOTTOM_RIGHT** - Bottom-right quarter (50% width, 50% height)

## Architecture

### Detection Areas

Each snap zone covers **half the screen** in its dimension:

```
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│    TOP_LEFT (50%)       │    TOP_RIGHT (50%)      │  TOP (100%, 50%)
│                         │                         │
├─────────────────────────┼─────────────────────────┤
│                         │                         │
│   BOTTOM_LEFT (50%)     │   BOTTOM_RIGHT (50%)    │  BOTTOM (100%, 50%)
│                         │                         │
└─────────────────────────┴─────────────────────────┘
       LEFT (50%)                RIGHT (50%)
```

### Snap Bounds

When a window is snapped to a zone, it's resized to fit that zone's bounds. For example:
- Snap LEFT: x=0, y=0, w=50%, h=100%
- Snap TOP_LEFT: x=0, y=0, w=50%, h=50%

## Files

### `src/utils/snapZones.js` (Updated)
- `getSnapZones(width, height)` - Get all zone definitions
- `detectSnapZone(x, y, width, height)` - Detect which zone a point is in
- `getSnapBounds(zoneName, width, height)` - Get snap bounds for a zone

### `src/utils/snapStateMachine.js` (New)
- `SNAP_ZONES` - Snap zone constants
- `getSnapZoneBoundaries()` - Get boundaries for all zones
- `detectSnapZone()` - Detect snap zone at a point
- `detectEdgeSnapZone()` - Detect edge snap with threshold
- `isHalfScreenSnap()` - Check if zone is half-screen
- `isQuadrantSnap()` - Check if zone is quadrant
- `getSnapZoneDescription()` - Human-readable zone names

## Usage

### In SnapOverlay Component
```jsx
const { drag } = useWindowManager();

// Show predictive snap overlay when dragging
{drag.best && (
  <SnapOverlay zone={drag.best.zone} bounds={drag.best.bounds} />
)}
```

### In useWindowManager Hook
```javascript
const best = endDrag(p);
if (best && best.type === 'snap') {
  // Apply snap bounds from detected zone
  act(id, 'snapToBounds', best.payload);
}
```

## Benefits

✅ **Larger Detection Areas** - 50% of screen makes snapping easier
✅ **Clear Zones** - Half-screen zones are intuitive
✅ **Predictable** - User can see exactly where window will snap
✅ **Declarative** - Zone definitions are centralized
✅ **Flexible** - Easy to adjust zone sizes if needed

## Migration from Old System

The old system had small corner zones (300px) and perimeter zones. The new system:

1. Replaces small perimeter zones with full half-screen zones
2. Replaces corner zones with quadrant zones
3. Makes snap detection work anywhere in the zone, not just edges

### Before
```
Snap LEFT trigger: Only left 200px edge
Window snapped to: left 50%
```

### After
```
Snap LEFT trigger: Entire left 50% of screen
Window snapped to: left 50%
(Much easier to trigger!)
```

## Configuration

To adjust snap zone sizes, modify the perimeter boundaries in `getSnapZones()`:

```javascript
// To make zones smaller, reduce the perimeter size
// To make zones larger, increase the perimeter size
```

## Future Enhancements

- Add "sweet spot" indicators showing where to snap
- Add snap preview while dragging
- Add customizable snap zones
- Add snap animations
- Add undo/redo for snap actions

