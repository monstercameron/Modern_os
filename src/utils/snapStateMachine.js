/**
 * Snap State Machine
 * 
 * Manages snap zone detection and snap state transitions.
 * Provides clean, declarative snap logic.
 */

import { SN } from './constants.js';

// Snap zone positions
export const SNAP_ZONES = {
  FULL: 'full',           // Entire screen
  LEFT: 'left',           // Left half
  RIGHT: 'right',         // Right half
  TOP: 'top',             // Top half
  BOTTOM: 'bottom',       // Bottom half
  TOP_LEFT: 'top_left',   // Top-left quadrant
  TOP_RIGHT: 'top_right', // Top-right quadrant
  BOTTOM_LEFT: 'bottom_left',   // Bottom-left quadrant
  BOTTOM_RIGHT: 'bottom_right', // Bottom-right quadrant
};

/**
 * Calculate snap zone boundaries
 * Returns rectangles for each snap zone (half the screen area)
 * 
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {object} Map of zone names to boundary rectangles
 */
export function getSnapZoneBoundaries(screenWidth, screenHeight) {
  const halfWidth = screenWidth / 2;
  const halfHeight = screenHeight / 2;
  
  return {
    [SNAP_ZONES.FULL]: {
      x: 0,
      y: 0,
      w: screenWidth,
      h: screenHeight,
      name: 'Full Screen'
    },
    [SNAP_ZONES.LEFT]: {
      x: 0,
      y: 0,
      w: halfWidth,
      h: screenHeight,
      name: 'Left Half'
    },
    [SNAP_ZONES.RIGHT]: {
      x: halfWidth,
      y: 0,
      w: halfWidth,
      h: screenHeight,
      name: 'Right Half'
    },
    [SNAP_ZONES.TOP]: {
      x: 0,
      y: 0,
      w: screenWidth,
      h: halfHeight,
      name: 'Top Half'
    },
    [SNAP_ZONES.BOTTOM]: {
      x: 0,
      y: halfHeight,
      w: screenWidth,
      h: halfHeight,
      name: 'Bottom Half'
    },
    [SNAP_ZONES.TOP_LEFT]: {
      x: 0,
      y: 0,
      w: halfWidth,
      h: halfHeight,
      name: 'Top-Left Quadrant'
    },
    [SNAP_ZONES.TOP_RIGHT]: {
      x: halfWidth,
      y: 0,
      w: halfWidth,
      h: halfHeight,
      name: 'Top-Right Quadrant'
    },
    [SNAP_ZONES.BOTTOM_LEFT]: {
      x: 0,
      y: halfHeight,
      w: halfWidth,
      h: halfHeight,
      name: 'Bottom-Left Quadrant'
    },
    [SNAP_ZONES.BOTTOM_RIGHT]: {
      x: halfWidth,
      y: halfHeight,
      w: halfWidth,
      h: halfHeight,
      name: 'Bottom-Right Quadrant'
    },
  };
}

/**
 * Detect which snap zone a point is in
 * Uses half-screen snap zones for easier snapping
 * 
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {string|null} Snap zone name or null if no snap zone
 */
export function detectSnapZone(x, y, screenWidth, screenHeight) {
  const halfWidth = screenWidth / 2;
  const halfHeight = screenHeight / 2;
  
  // Check quadrants first (more specific)
  if (x < halfWidth && y < halfHeight) return SNAP_ZONES.TOP_LEFT;
  if (x >= halfWidth && y < halfHeight) return SNAP_ZONES.TOP_RIGHT;
  if (x < halfWidth && y >= halfHeight) return SNAP_ZONES.BOTTOM_LEFT;
  if (x >= halfWidth && y >= halfHeight) return SNAP_ZONES.BOTTOM_RIGHT;
  
  return null;
}

/**
 * Detect edge snap zones (left/right/top/bottom)
 * Used for half-screen snapping
 * 
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @param {number} threshold - Distance from edge to trigger snap (default 10px)
 * @returns {string|null} Snap zone name or null if not at edge
 */
export function detectEdgeSnapZone(x, y, screenWidth, screenHeight, threshold = 10) {
  const atLeft = x < threshold;
  const atRight = x > screenWidth - threshold;
  const atTop = y < threshold;
  const atBottom = y > screenHeight - threshold;
  
  // Corners first
  if (atLeft && atTop) return SNAP_ZONES.TOP_LEFT;
  if (atRight && atTop) return SNAP_ZONES.TOP_RIGHT;
  if (atLeft && atBottom) return SNAP_ZONES.BOTTOM_LEFT;
  if (atRight && atBottom) return SNAP_ZONES.BOTTOM_RIGHT;
  
  // Then edges
  if (atLeft) return SNAP_ZONES.LEFT;
  if (atRight) return SNAP_ZONES.RIGHT;
  if (atTop) return SNAP_ZONES.TOP;
  if (atBottom) return SNAP_ZONES.BOTTOM;
  
  return null;
}

/**
 * Get snap bounds for a specific snap zone
 * 
 * @param {string} zone - Snap zone name
 * @param {number} screenWidth - Screen width
 * @param {number} screenHeight - Screen height
 * @returns {object} Bounds { x, y, w, h }
 */
export function getSnapBounds(zone, screenWidth, screenHeight) {
  const boundaries = getSnapZoneBoundaries(screenWidth, screenHeight);
  return boundaries[zone] || null;
}

/**
 * Map snap zone to SN enum value
 * 
 * @param {string} zone - Snap zone name
 * @returns {number} SN enum value
 */
export function snapZoneToSN(zone) {
  switch (zone) {
    case SNAP_ZONES.FULL: return SN.FULL;
    case SNAP_ZONES.LEFT: return SN.LEFT;
    case SNAP_ZONES.RIGHT: return SN.RIGHT;
    case SNAP_ZONES.TOP: return SN.TOP;
    case SNAP_ZONES.BOTTOM: return SN.BOTTOM;
    case SNAP_ZONES.TOP_LEFT: return SN.QUAD;
    case SNAP_ZONES.TOP_RIGHT: return SN.QUAD;
    case SNAP_ZONES.BOTTOM_LEFT: return SN.QUAD;
    case SNAP_ZONES.BOTTOM_RIGHT: return SN.QUAD;
    default: return SN.NONE;
  }
}

/**
 * Map SN enum value to snap zone
 * Note: QUAD zones are ambiguous, returns first one
 * 
 * @param {number} snValue - SN enum value
 * @returns {string} Snap zone name
 */
export function snToSnapZone(snValue) {
  switch (snValue) {
    case SN.FULL: return SNAP_ZONES.FULL;
    case SN.LEFT: return SNAP_ZONES.LEFT;
    case SN.RIGHT: return SNAP_ZONES.RIGHT;
    case SN.TOP: return SNAP_ZONES.TOP;
    case SN.BOTTOM: return SNAP_ZONES.BOTTOM;
    case SN.QUAD: return SNAP_ZONES.TOP_LEFT; // Default quad
    default: return null;
  }
}

/**
 * Check if a snap zone is a half-screen snap
 * 
 * @param {string} zone - Snap zone name
 * @returns {boolean}
 */
export function isHalfScreenSnap(zone) {
  return [
    SNAP_ZONES.LEFT,
    SNAP_ZONES.RIGHT,
    SNAP_ZONES.TOP,
    SNAP_ZONES.BOTTOM
  ].includes(zone);
}

/**
 * Check if a snap zone is a quadrant snap
 * 
 * @param {string} zone - Snap zone name
 * @returns {boolean}
 */
export function isQuadrantSnap(zone) {
  return [
    SNAP_ZONES.TOP_LEFT,
    SNAP_ZONES.TOP_RIGHT,
    SNAP_ZONES.BOTTOM_LEFT,
    SNAP_ZONES.BOTTOM_RIGHT
  ].includes(zone);
}

/**
 * Get human-readable description of snap zone
 * 
 * @param {string} zone - Snap zone name
 * @returns {string}
 */
export function getSnapZoneDescription(zone) {
  const boundaries = getSnapZoneBoundaries(0, 0); // Size doesn't matter for description
  return boundaries[zone]?.name || 'Unknown';
}

export default {
  SNAP_ZONES,
  getSnapZoneBoundaries,
  detectSnapZone,
  detectEdgeSnapZone,
  getSnapBounds,
  snapZoneToSN,
  snToSnapZone,
  isHalfScreenSnap,
  isQuadrantSnap,
  getSnapZoneDescription,
};
