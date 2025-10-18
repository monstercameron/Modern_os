/**
 * Window Snapping System
 * 
 * Defines 8 snap zones:
 * - 4 halves: left, right, top, bottom
 * - 4 quarters: top-left, top-right, bottom-left, bottom-right
 * 
 * Each zone has a perimeter that triggers predictive snapping
 * when a dragging window crosses into it.
 */

import { TB } from './constants.js';

// Snap zone identifiers
export const SNAP_ZONES = {
  NONE: 'none',
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
};

// Perimeter threshold in pixels from screen edge
// This defines how far in from the edge you need to drag to trigger snap
const PERIMETER_THRESHOLD = 150;

// Corner zone size (width and height from corner)
// Defines the quadrant snap zones
const CORNER_SIZE = 200;

/**
 * Get snap zone definitions based on screen dimensions
 * 
 * Layout:
 * - Corners (CORNER_SIZE x CORNER_SIZE): Quadrant snaps
 * - Edges (PERIMETER_THRESHOLD inset): Half snaps
 * - Center (remaining space): Floating window zone (no snap)
 * 
 * Quadrants are equal in size based on desktop area (screenHeight)
 * 
 * @param {number} screenWidth - Screen width in pixels
 * @param {number} screenHeight - Screen height in pixels (minus taskbar)
 * @returns {Object} Map of zone names to their perimeter boundaries
 */
export function getSnapZones(screenWidth, screenHeight) {
  const halfWidth = Math.floor(screenWidth / 2);
  const halfHeight = Math.floor(screenHeight / 2);
  
  return {
    // Left half - only triggers on left PERIMETER_THRESHOLD pixels
    [SNAP_ZONES.LEFT]: {
      perimeter: {
        x: 0,
        y: CORNER_SIZE,
        width: PERIMETER_THRESHOLD,
        height: screenHeight - (CORNER_SIZE * 2),
      },
      snapBounds: {
        x: 0,
        y: TB,
        w: halfWidth,
        h: screenHeight,
      },
    },
    
    // Right half - only triggers on right PERIMETER_THRESHOLD pixels
    [SNAP_ZONES.RIGHT]: {
      perimeter: {
        x: screenWidth - PERIMETER_THRESHOLD,
        y: CORNER_SIZE,
        width: PERIMETER_THRESHOLD,
        height: screenHeight - (CORNER_SIZE * 2),
      },
      snapBounds: {
        x: halfWidth,
        y: TB,
        w: screenWidth - halfWidth,
        h: screenHeight,
      },
    },
    
    // Top half - only triggers on top PERIMETER_THRESHOLD pixels
    [SNAP_ZONES.TOP]: {
      perimeter: {
        x: CORNER_SIZE,
        y: 0,
        width: screenWidth - (CORNER_SIZE * 2),
        height: PERIMETER_THRESHOLD,
      },
      snapBounds: {
        x: 0,
        y: TB,
        w: screenWidth,
        h: halfHeight,
      },
    },
    
    // Bottom half - only triggers on bottom PERIMETER_THRESHOLD pixels
    [SNAP_ZONES.BOTTOM]: {
      perimeter: {
        x: CORNER_SIZE,
        y: screenHeight - PERIMETER_THRESHOLD,
        width: screenWidth - (CORNER_SIZE * 2),
        height: PERIMETER_THRESHOLD,
      },
      snapBounds: {
        x: 0,
        y: TB + halfHeight,
        w: screenWidth,
        h: screenHeight - halfHeight,
      },
    },
    
    // Top-left quadrant - equal size
    [SNAP_ZONES.TOP_LEFT]: {
      perimeter: {
        x: 0,
        y: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
      },
      snapBounds: {
        x: 0,
        y: TB,
        w: halfWidth,
        h: halfHeight,
      },
    },
    
    // Top-right quadrant - equal size
    [SNAP_ZONES.TOP_RIGHT]: {
      perimeter: {
        x: screenWidth - CORNER_SIZE,
        y: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
      },
      snapBounds: {
        x: halfWidth,
        y: TB,
        w: screenWidth - halfWidth,
        h: halfHeight,
      },
    },
    
    // Bottom-left quadrant - equal size
    [SNAP_ZONES.BOTTOM_LEFT]: {
      perimeter: {
        x: 0,
        y: screenHeight - CORNER_SIZE,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
      },
      snapBounds: {
        x: 0,
        y: TB + halfHeight,
        w: halfWidth,
        h: screenHeight - halfHeight,
      },
    },
    
    // Bottom-right quadrant - equal size
    [SNAP_ZONES.BOTTOM_RIGHT]: {
      perimeter: {
        x: screenWidth - CORNER_SIZE,
        y: screenHeight - CORNER_SIZE,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
      },
      snapBounds: {
        x: halfWidth,
        y: TB + halfHeight,
        w: screenWidth - halfWidth,
        h: screenHeight - halfHeight,
      },
    },
  };
}

/**
 * Check if a point is inside a rectangle
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {Object} rect - Rectangle with x, y, width, height
 * @returns {boolean} True if point is inside rectangle
 */
function isPointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Detect which snap zone (if any) a window is currently in
 * @param {number} windowX - Window x coordinate
 * @param {number} windowY - Window y coordinate
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {string} Snap zone identifier or SNAP_ZONES.NONE
 */
export function detectSnapZone(windowX, windowY, screenWidth, screenHeight) {
  const zones = getSnapZones(screenWidth, screenHeight);
  
  // Check corner zones first (they have priority)
  const cornerZones = [
    SNAP_ZONES.TOP_LEFT,
    SNAP_ZONES.TOP_RIGHT,
    SNAP_ZONES.BOTTOM_LEFT,
    SNAP_ZONES.BOTTOM_RIGHT,
  ];
  
  for (const zoneName of cornerZones) {
    const zone = zones[zoneName];
    if (isPointInRect(windowX, windowY, zone.perimeter)) {
      return zoneName;
    }
  }
  
  // Check edge zones
  const edgeZones = [
    SNAP_ZONES.LEFT,
    SNAP_ZONES.RIGHT,
    SNAP_ZONES.TOP,
    SNAP_ZONES.BOTTOM,
  ];
  
  for (const zoneName of edgeZones) {
    const zone = zones[zoneName];
    if (isPointInRect(windowX, windowY, zone.perimeter)) {
      return zoneName;
    }
  }
  
  // No snap zone detected
  return SNAP_ZONES.NONE;
}

/**
 * Get the snap bounds for a specific zone
 * @param {string} zoneName - Snap zone identifier
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {Object|null} Snap bounds {x, y, w, h} or null if invalid zone
 */
export function getSnapBounds(zoneName, screenWidth, screenHeight) {
  if (zoneName === SNAP_ZONES.NONE) {
    return null;
  }
  
  const zones = getSnapZones(screenWidth, screenHeight);
  const zone = zones[zoneName];
  
  return zone ? zone.snapBounds : null;
}
