/**
 * Context Menu State Machine
 * 
 * Manages context menu visibility, positioning, and behavior based on context type.
 * Implements a finite state machine with states: IDLE, VISIBLE, HIDDEN
 * 
 * Usage:
 *   import { createContextMenuState, getMenuItems, transitionState } from './utils/contextMenuStateMachine';
 *   
 *   const state = createContextMenuState('window');
 *   const items = getMenuItems(state);
 *   const newState = transitionState(state, 'SHOW', { x: 100, y: 200 });
 */

import { debug, info } from './errorHandler.js';

// Context menu states
export const CONTEXT_MENU_STATES = {
  IDLE: 'IDLE',           // No menu visible
  VISIBLE: 'VISIBLE',     // Menu is being displayed
  HIDDEN: 'HIDDEN',       // Menu was just hidden (for animations)
};

// Context types
export const CONTEXT_TYPES = {
  DESKTOP: 'desktop',           // Right-click on desktop background
  TASKBAR: 'taskbar',           // Right-click on taskbar background
  TASKBAR_ITEM: 'taskbar-item', // Right-click on taskbar window button
  TILE: 'tile',                 // Right-click on a tile
  WINDOW: 'window',             // Right-click on window titlebar
};

// Menu item actions
export const MENU_ACTIONS = {
  // Desktop context
  REFRESH: 'refresh',
  NEW_FOLDER: 'newFolder',
  SETTINGS: 'settings',
  
  // Taskbar context
  CLOSE_ALL: 'closeAll',
  TILE_VIEW: 'tileView',
  CASCADE_WINDOWS: 'cascadeWindows',
  
  // Window context
  MINIMIZE: 'minimize',
  MAXIMIZE: 'maximize',
  RESTORE: 'restore',
  CLOSE: 'close',
  SNAP_LEFT: 'snapLeft',
  SNAP_RIGHT: 'snapRight',
  SNAP_TOP: 'snapTop',
  SNAP_BOTTOM: 'snapBottom',
  MOVE: 'move',
  RESIZE: 'resize',
  
  // Taskbar item context
  ACTIVATE: 'activate',
  UNMINIMIZE: 'unminimize',
  
  // Tile context
  OPEN: 'open',
  PIN: 'pin',
  UNPIN: 'unpin',
  PROPERTIES: 'properties',
  UNINSTALL: 'uninstall',
  RESIZE_TILE: 'resizeTile',
};

/**
 * Define menu items for each context
 */
const CONTEXT_MENU_DEFINITIONS = {
  [CONTEXT_TYPES.DESKTOP]: [
    { id: 'refresh', label: 'Refresh', action: MENU_ACTIONS.REFRESH, icon: '🔄' },
    { id: 'separator-1', type: 'separator' },
    { id: 'newFolder', label: 'New Folder', action: MENU_ACTIONS.NEW_FOLDER, icon: '📁' },
    { id: 'separator-2', type: 'separator' },
    { id: 'settings', label: 'Settings', action: MENU_ACTIONS.SETTINGS, icon: '⚙️' },
  ],
  
  [CONTEXT_TYPES.TASKBAR]: [
    { id: 'closeAll', label: 'Close All Windows', action: MENU_ACTIONS.CLOSE_ALL, icon: '✕' },
    { id: 'separator-1', type: 'separator' },
    { id: 'tileView', label: 'Tile Windows Horizontally', action: MENU_ACTIONS.TILE_VIEW, icon: '⊞' },
    { id: 'cascade', label: 'Cascade Windows', action: MENU_ACTIONS.CASCADE_WINDOWS, icon: '↘️' },
    { id: 'separator-2', type: 'separator' },
    { id: 'settings', label: 'Taskbar Settings', action: MENU_ACTIONS.SETTINGS, icon: '⚙️' },
  ],
  
  [CONTEXT_TYPES.TASKBAR_ITEM]: [
    { id: 'minimize', label: 'Minimize', action: MENU_ACTIONS.MINIMIZE, icon: '−' },
    { id: 'maximize', label: 'Maximize', action: MENU_ACTIONS.MAXIMIZE, icon: '□' },
    { id: 'separator-1', type: 'separator' },
    { id: 'close', label: 'Close', action: MENU_ACTIONS.CLOSE, icon: '✕' },
  ],
  
  [CONTEXT_TYPES.WINDOW]: [
    { id: 'minimize', label: 'Minimize', action: MENU_ACTIONS.MINIMIZE, icon: '−', condition: 'notMinimized' },
    { id: 'maximize', label: 'Maximize', action: MENU_ACTIONS.MAXIMIZE, icon: '□', condition: 'notMaximized' },
    { id: 'restore', label: 'Restore', action: MENU_ACTIONS.RESTORE, icon: '🔻', condition: 'maximized' },
    { id: 'separator-1', type: 'separator' },
    { id: 'snapLeft', label: 'Snap Left', action: MENU_ACTIONS.SNAP_LEFT, icon: '◀' },
    { id: 'snapRight', label: 'Snap Right', action: MENU_ACTIONS.SNAP_RIGHT, icon: '▶' },
    { id: 'snapTop', label: 'Snap Top', action: MENU_ACTIONS.SNAP_TOP, icon: '▲' },
    { id: 'snapBottom', label: 'Snap Bottom', action: MENU_ACTIONS.SNAP_BOTTOM, icon: '▼' },
    { id: 'separator-2', type: 'separator' },
    { id: 'move', label: 'Move', action: MENU_ACTIONS.MOVE, icon: '✥', condition: 'notFullscreen' },
    { id: 'resize', label: 'Resize', action: MENU_ACTIONS.RESIZE, icon: '⤡', condition: 'notFullscreen' },
    { id: 'separator-3', type: 'separator' },
    { id: 'close', label: 'Close', action: MENU_ACTIONS.CLOSE, icon: '✕' },
  ],
  
  [CONTEXT_TYPES.TILE]: [
    { id: 'open', label: 'Open', action: MENU_ACTIONS.OPEN, icon: '▶' },
    { id: 'separator-1', type: 'separator' },
    { id: 'pin', label: 'Pin to Start', action: MENU_ACTIONS.PIN, icon: '📌' },
    { id: 'separator-2', type: 'separator' },
    { id: 'resize', label: 'Resize Tile', action: MENU_ACTIONS.RESIZE_TILE, icon: '⤡' },
    { id: 'properties', label: 'Properties', action: MENU_ACTIONS.PROPERTIES, icon: '✎' },
    { id: 'separator-3', type: 'separator' },
    { id: 'uninstall', label: 'Uninstall', action: MENU_ACTIONS.UNINSTALL, icon: '🗑️' },
  ],
};

/**
 * Create initial context menu state
 * @param {string} contextType - One of CONTEXT_TYPES
 * @param {Object} metadata - Additional metadata (windowId, appId, etc)
 * @returns {Object} Initial state object
 */
export function createContextMenuState(contextType, metadata = {}) {
  if (!Object.values(CONTEXT_TYPES).includes(contextType)) {
    console.warn(`Unknown context type: ${contextType}`);
  }
  
  return {
    state: CONTEXT_MENU_STATES.IDLE,
    contextType,
    x: 0,
    y: 0,
    metadata,
    selectedItemIndex: -1,
    timestamp: null,
  };
}

/**
 * Get menu items for a given context state
 * Filters items based on conditions if provided
 * 
 * @param {Object} contextState - Current context state
 * @returns {Array} Array of menu items
 */
export function getMenuItems(contextState) {
  const definitions = CONTEXT_MENU_DEFINITIONS[contextState.contextType] || [];
  
  return definitions.filter(item => {
    // If no condition, include the item
    if (!item.condition) return true;
    
    // Check conditions based on metadata
    const { condition } = item;
    const { isMinimized, isMaximized, isFullscreen } = contextState.metadata;
    
    switch (condition) {
      case 'notMinimized':
        return !isMinimized;
      case 'minimized':
        return isMinimized;
      case 'notMaximized':
        return !isMaximized;
      case 'maximized':
        return isMaximized;
      case 'notFullscreen':
        return !isFullscreen;
      default:
        return true;
    }
  });
}

/**
 * Transition state based on action
 * 
 * @param {Object} currentState - Current context state
 * @param {string} action - Transition action (SHOW, HIDE, CLOSE, SELECT)
 * @param {Object} data - Data for the transition (e.g., { x, y })
 * @returns {Object} New state
 */
export function transitionState(currentState, action, data = {}) {
  const newState = { ...currentState };
  
  switch (action) {
    case 'SHOW':
      newState.state = CONTEXT_MENU_STATES.VISIBLE;
      newState.x = data.x ?? currentState.x;
      newState.y = data.y ?? currentState.y;
      newState.selectedItemIndex = -1;
      newState.timestamp = Date.now();
      debug(`Context menu SHOW at (${newState.x}, ${newState.y})`, 'ContextMenuSM');
      break;
      
    case 'HIDE':
      newState.state = CONTEXT_MENU_STATES.HIDDEN;
      newState.selectedItemIndex = -1;
      debug(`Context menu HIDE`, 'ContextMenuSM');
      break;
      
    case 'CLOSE':
      newState.state = CONTEXT_MENU_STATES.IDLE;
      newState.selectedItemIndex = -1;
      debug(`Context menu CLOSE`, 'ContextMenuSM');
      break;
      
    case 'SELECT':
      newState.selectedItemIndex = data.index ?? -1;
      debug(`Context menu SELECT item index ${newState.selectedItemIndex}`, 'ContextMenuSM');
      break;
      
    case 'SELECT_NEXT':
      const items = getMenuItems(currentState);
      const nonSeparatorItems = items.filter(item => item.type !== 'separator');
      if (nonSeparatorItems.length > 0) {
        const currentIdx = currentState.selectedItemIndex;
        const nextIdx = currentIdx + 1;
        newState.selectedItemIndex = nextIdx < nonSeparatorItems.length ? nextIdx : 0;
      }
      debug(`Context menu SELECT_NEXT, now at ${newState.selectedItemIndex}`, 'ContextMenuSM');
      break;
      
    case 'SELECT_PREV':
      const itemsPrev = getMenuItems(currentState);
      const nonSeparatorItemsPrev = itemsPrev.filter(item => item.type !== 'separator');
      if (nonSeparatorItemsPrev.length > 0) {
        const currentIdxPrev = currentState.selectedItemIndex;
        const prevIdx = currentIdxPrev - 1;
        newState.selectedItemIndex = prevIdx >= 0 ? prevIdx : nonSeparatorItemsPrev.length - 1;
      }
      debug(`Context menu SELECT_PREV, now at ${newState.selectedItemIndex}`, 'ContextMenuSM');
      break;
      
    case 'UPDATE_METADATA':
      newState.metadata = { ...currentState.metadata, ...data };
      debug(`Context menu UPDATE_METADATA:`, 'ContextMenuSM', newState.metadata);
      break;
      
    default:
      console.warn(`Unknown transition action: ${action}`);
  }
  
  return newState;
}

/**
 * Get the currently selected menu item
 * 
 * @param {Object} contextState - Current context state
 * @returns {Object|null} Selected item or null
 */
export function getSelectedItem(contextState) {
  const items = getMenuItems(contextState);
  if (contextState.selectedItemIndex >= 0 && contextState.selectedItemIndex < items.length) {
    return items[contextState.selectedItemIndex];
  }
  return null;
}

/**
 * Check if menu is visible
 * 
 * @param {Object} contextState - Current context state
 * @returns {boolean}
 */
export function isMenuVisible(contextState) {
  return contextState.state === CONTEXT_MENU_STATES.VISIBLE;
}

/**
 * Get position constraints to keep menu on screen
 * 
 * @param {number} x - Raw X position
 * @param {number} y - Raw Y position
 * @param {number} width - Menu width
 * @param {number} height - Menu height
 * @returns {Object} Adjusted { x, y } position
 */
export function constrainPosition(x, y, width = 240, height = 300) {
  const padding = 8;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  let adjustedX = x;
  let adjustedY = y;
  
  // Check right edge
  if (x + width + padding > screenWidth) {
    adjustedX = screenWidth - width - padding;
  }
  
  // Check left edge
  if (adjustedX < padding) {
    adjustedX = padding;
  }
  
  // Check bottom edge
  if (y + height + padding > screenHeight) {
    adjustedY = screenHeight - height - padding;
  }
  
  // Check top edge
  if (adjustedY < padding) {
    adjustedY = padding;
  }
  
  return { x: adjustedX, y: adjustedY };
}

/**
 * Export default
 */
export default {
  CONTEXT_MENU_STATES,
  CONTEXT_TYPES,
  MENU_ACTIONS,
  createContextMenuState,
  getMenuItems,
  transitionState,
  getSelectedItem,
  isMenuVisible,
  constrainPosition,
};
