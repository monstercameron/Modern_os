/**
 * Window State Machine
 * 
 * Defines all possible window states and valid state transitions.
 * This makes window state management clean, predictable, and easy to reason about.
 * 
 * Window States:
 * - NORMAL: Windowed, not maximized, not snapped
 * - MAXIMIZED: Fullscreen/maximized state (sn === SN.FULL)
 * - SNAPPED_LEFT: Snapped to left half (sn === SN.LEFT)
 * - SNAPPED_RIGHT: Snapped to right half (sn === SN.RIGHT)
 * - SNAPPED_TOP: Snapped to top half (sn === SN.TOP)
 * - SNAPPED_BOTTOM: Snapped to bottom half (sn === SN.BOTTOM)
 * - SNAPPED_QUAD: Snapped to quadrant (sn === SN.QUAD)
 * - MINIMIZED: Hidden/minimized
 * - CLOSED: Window removed
 */

import { SN } from './constants.js';

// Window display state
export const WINDOW_DISPLAY_STATE = {
  VISIBLE: 'visible',
  MINIMIZED: 'minimized',
  CLOSED: 'closed'
};

// Window snap states
export const WINDOW_SNAP_STATE = {
  NONE: 'none',
  FULL: 'full',
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  QUAD: 'quad'
};

/**
 * State machine definition
 * Maps current state + action -> next state
 */
const stateTransitions = {
  // From VISIBLE state
  [WINDOW_DISPLAY_STATE.VISIBLE]: {
    minimize: WINDOW_DISPLAY_STATE.MINIMIZED,
    close: WINDOW_DISPLAY_STATE.CLOSED,
    // Display state doesn't change on snap/resize/drag
    maximize: WINDOW_DISPLAY_STATE.VISIBLE,
    snap: WINDOW_DISPLAY_STATE.VISIBLE,
    drag: WINDOW_DISPLAY_STATE.VISIBLE,
    resize: WINDOW_DISPLAY_STATE.VISIBLE,
  },
  // From MINIMIZED state
  [WINDOW_DISPLAY_STATE.MINIMIZED]: {
    restore: WINDOW_DISPLAY_STATE.VISIBLE,
    close: WINDOW_DISPLAY_STATE.CLOSED,
  },
  // From CLOSED state
  [WINDOW_DISPLAY_STATE.CLOSED]: {
    // No transitions from closed state
  }
};

/**
 * Snap state transitions
 * Maps current snap state + action -> next snap state
 */
const snapTransitions = {
  [WINDOW_SNAP_STATE.NONE]: {
    maximize: WINDOW_SNAP_STATE.FULL,
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
    snap_quad_0: WINDOW_SNAP_STATE.QUAD,
    snap_quad_1: WINDOW_SNAP_STATE.QUAD,
    snap_quad_2: WINDOW_SNAP_STATE.QUAD,
    snap_quad_3: WINDOW_SNAP_STATE.QUAD,
  },
  [WINDOW_SNAP_STATE.FULL]: {
    unmaximize: WINDOW_SNAP_STATE.NONE,
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
  },
  [WINDOW_SNAP_STATE.LEFT]: {
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
    maximize: WINDOW_SNAP_STATE.FULL,
    unsnap: WINDOW_SNAP_STATE.NONE,
  },
  [WINDOW_SNAP_STATE.RIGHT]: {
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
    maximize: WINDOW_SNAP_STATE.FULL,
    unsnap: WINDOW_SNAP_STATE.NONE,
  },
  [WINDOW_SNAP_STATE.TOP]: {
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
    maximize: WINDOW_SNAP_STATE.FULL,
    unsnap: WINDOW_SNAP_STATE.NONE,
  },
  [WINDOW_SNAP_STATE.BOTTOM]: {
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    maximize: WINDOW_SNAP_STATE.FULL,
    unsnap: WINDOW_SNAP_STATE.NONE,
  },
  [WINDOW_SNAP_STATE.QUAD]: {
    snap_left: WINDOW_SNAP_STATE.LEFT,
    snap_right: WINDOW_SNAP_STATE.RIGHT,
    snap_top: WINDOW_SNAP_STATE.TOP,
    snap_bottom: WINDOW_SNAP_STATE.BOTTOM,
    maximize: WINDOW_SNAP_STATE.FULL,
    unsnap: WINDOW_SNAP_STATE.NONE,
  },
};

/**
 * Validate if a state transition is allowed
 * 
 * @param {string} currentState - Current display state
 * @param {string} action - Action being attempted
 * @returns {boolean} Whether the transition is valid
 */
export function isValidTransition(currentState, action) {
  const allowedActions = stateTransitions[currentState];
  return allowedActions && action in allowedActions;
}

/**
 * Get the next state after an action
 * 
 * @param {string} currentState - Current display state
 * @param {string} action - Action being attempted
 * @returns {string|null} Next state or null if invalid
 */
export function getNextDisplayState(currentState, action) {
  const allowedActions = stateTransitions[currentState];
  if (!allowedActions) return null;
  return allowedActions[action] || null;
}

/**
 * Get the next snap state after an action
 * 
 * @param {string} currentSnapState - Current snap state
 * @param {string} action - Action being attempted
 * @returns {string|null} Next snap state or null if invalid
 */
export function getNextSnapState(currentSnapState, action) {
  const allowedActions = snapTransitions[currentSnapState];
  if (!allowedActions) return null;
  return allowedActions[action] || null;
}

/**
 * Map internal snap state enum to state machine snap state
 * 
 * @param {number} snValue - SN enum value
 * @returns {string} Snap state name
 */
export function snapEnumToState(snValue) {
  switch (snValue) {
    case SN.NONE: return WINDOW_SNAP_STATE.NONE;
    case SN.FULL: return WINDOW_SNAP_STATE.FULL;
    case SN.LEFT: return WINDOW_SNAP_STATE.LEFT;
    case SN.RIGHT: return WINDOW_SNAP_STATE.RIGHT;
    case SN.TOP: return WINDOW_SNAP_STATE.TOP;
    case SN.BOTTOM: return WINDOW_SNAP_STATE.BOTTOM;
    case SN.QUAD: return WINDOW_SNAP_STATE.QUAD;
    default: return WINDOW_SNAP_STATE.NONE;
  }
}

/**
 * Map state machine snap state back to internal snap state enum
 * 
 * @param {string} snapState - Snap state name
 * @returns {number} SN enum value
 */
export function snapStateToEnum(snapState) {
  switch (snapState) {
    case WINDOW_SNAP_STATE.NONE: return SN.NONE;
    case WINDOW_SNAP_STATE.FULL: return SN.FULL;
    case WINDOW_SNAP_STATE.LEFT: return SN.LEFT;
    case WINDOW_SNAP_STATE.RIGHT: return SN.RIGHT;
    case WINDOW_SNAP_STATE.TOP: return SN.TOP;
    case WINDOW_SNAP_STATE.BOTTOM: return SN.BOTTOM;
    case WINDOW_SNAP_STATE.QUAD: return SN.QUAD;
    default: return SN.NONE;
  }
}

/**
 * Map display state enum to state machine display state
 * 
 * @param {boolean} minimized - Whether window is minimized
 * @returns {string} Display state name
 */
export function displayEnumToState(minimized) {
  return minimized ? WINDOW_DISPLAY_STATE.MINIMIZED : WINDOW_DISPLAY_STATE.VISIBLE;
}

/**
 * Resolve which action to take based on window state
 * 
 * @param {string} currentDisplayState - Current display state
 * @param {string} currentSnapState - Current snap state
 * @param {string} userAction - User action (e.g., 'toggle_max', 'minimize')
 * @returns {object} Resolved action details { displayAction, snapAction }
 */
export function resolveAction(currentDisplayState, currentSnapState, userAction) {
  const result = {
    displayAction: null,
    snapAction: null,
    valid: false,
    reason: ''
  };

  switch (userAction) {
    case 'minimize':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.VISIBLE) {
        result.displayAction = 'minimize';
        result.valid = true;
      } else {
        result.reason = `Cannot minimize from ${currentDisplayState}`;
      }
      break;

    case 'restore':
    case 'unminimize':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.MINIMIZED) {
        result.displayAction = 'restore';
        result.valid = true;
      } else {
        result.reason = `Cannot restore from ${currentDisplayState}`;
      }
      break;

    case 'maximize':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.VISIBLE) {
        result.snapAction = 'maximize';
        result.valid = true;
      } else if (currentDisplayState === WINDOW_DISPLAY_STATE.MINIMIZED) {
        result.displayAction = 'restore';
        result.snapAction = 'maximize';
        result.valid = true;
      } else {
        result.reason = `Cannot maximize from ${currentDisplayState}`;
      }
      break;

    case 'unmaximize':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.VISIBLE && currentSnapState === WINDOW_SNAP_STATE.FULL) {
        result.snapAction = 'unmaximize';
        result.valid = true;
      } else {
        result.reason = `Cannot unmaximize from ${currentSnapState}`;
      }
      break;

    case 'toggle_maximize':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.VISIBLE) {
        result.snapAction = currentSnapState === WINDOW_SNAP_STATE.FULL ? 'unmaximize' : 'maximize';
        result.valid = true;
      } else if (currentDisplayState === WINDOW_DISPLAY_STATE.MINIMIZED) {
        result.displayAction = 'restore';
        result.snapAction = 'maximize';
        result.valid = true;
      } else {
        result.reason = `Cannot toggle maximize from ${currentDisplayState}`;
      }
      break;

    case 'close':
      if (currentDisplayState !== WINDOW_DISPLAY_STATE.CLOSED) {
        result.displayAction = 'close';
        result.valid = true;
      } else {
        result.reason = 'Cannot close already closed window';
      }
      break;

    case 'snap_left':
    case 'snap_right':
    case 'snap_top':
    case 'snap_bottom':
      if (currentDisplayState === WINDOW_DISPLAY_STATE.VISIBLE) {
        result.snapAction = userAction;
        result.valid = true;
      } else if (currentDisplayState === WINDOW_DISPLAY_STATE.MINIMIZED) {
        result.displayAction = 'restore';
        result.snapAction = userAction;
        result.valid = true;
      } else {
        result.reason = `Cannot snap from ${currentDisplayState}`;
      }
      break;

    default:
      result.reason = `Unknown action: ${userAction}`;
  }

  return result;
}

/**
 * Check if window should be visible
 * 
 * @param {string} displayState - Display state
 * @returns {boolean}
 */
export function isWindowVisible(displayState) {
  return displayState === WINDOW_DISPLAY_STATE.VISIBLE;
}

/**
 * Check if window is maximized
 * 
 * @param {string} snapState - Snap state
 * @returns {boolean}
 */
export function isWindowMaximized(snapState) {
  return snapState === WINDOW_SNAP_STATE.FULL;
}

/**
 * Get human-readable description of window state
 * 
 * @param {string} displayState - Display state
 * @param {string} snapState - Snap state
 * @returns {string}
 */
export function getWindowStateDescription(displayState, snapState) {
  if (displayState === WINDOW_DISPLAY_STATE.CLOSED) {
    return 'Closed';
  }
  if (displayState === WINDOW_DISPLAY_STATE.MINIMIZED) {
    return 'Minimized';
  }
  
  switch (snapState) {
    case WINDOW_SNAP_STATE.FULL: return 'Maximized';
    case WINDOW_SNAP_STATE.LEFT: return 'Snapped Left';
    case WINDOW_SNAP_STATE.RIGHT: return 'Snapped Right';
    case WINDOW_SNAP_STATE.TOP: return 'Snapped Top';
    case WINDOW_SNAP_STATE.BOTTOM: return 'Snapped Bottom';
    case WINDOW_SNAP_STATE.QUAD: return 'Snapped Quadrant';
    default: return 'Normal';
  }
}

export default {
  WINDOW_DISPLAY_STATE,
  WINDOW_SNAP_STATE,
  isValidTransition,
  getNextDisplayState,
  getNextSnapState,
  snapEnumToState,
  snapStateToEnum,
  displayEnumToState,
  resolveAction,
  isWindowVisible,
  isWindowMaximized,
  getWindowStateDescription,
};
