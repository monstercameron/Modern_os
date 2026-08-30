/**
 * Kernel Actions
 *
 * Typed action creators. These replace the stringly-typed act(id, "type", payload)
 * dispatcher — every state change in the desktop goes through one of these.
 *
 * Creators are where impurity is allowed to live: minting an id or reading the
 * clock happens here so the reducer stays a pure function of (state, action).
 */

import { uid } from '../utils/constants.js';

export const ActionTypes = {
  // Windows
  WINDOW_OPEN: 'window/open',
  WINDOW_CLOSE: 'window/close',
  WINDOW_FOCUS: 'window/focus',
  WINDOW_MINIMIZE: 'window/minimize',
  WINDOW_RESTORE: 'window/restore',
  WINDOW_RESTORE_LAST: 'window/restoreLast',
  WINDOW_MAXIMIZE: 'window/maximize',
  WINDOW_UNMAXIMIZE: 'window/unmaximize',
  WINDOW_TOGGLE_MAXIMIZE: 'window/toggleMaximize',
  WINDOW_SNAP: 'window/snap',
  WINDOW_RESIZE_TILE: 'window/resizeTile',
  WINDOW_FOCUS_DIRECTION: 'window/focusDirection',
  WINDOW_MOVE_DIRECTION: 'window/moveDirection',
  RESIZE_MODE_SET: 'ui/resizeMode',
  ENV_SET: 'env/set',
  WINDOW_SNAP_QUAD: 'window/snapQuad',
  WINDOW_SET_BOUNDS: 'window/setBounds',
  WINDOW_MOVE_TO: 'window/moveTo',
  WINDOW_MOVE_TO_WORKSPACE: 'window/moveToWorkspace',
  WINDOW_TOGGLE_FLOATING: 'window/toggleFloating',
  WINDOW_RETILE: 'window/retile',

  // Workspaces
  WORKSPACE_SWITCH: 'workspace/switch',
  WORKSPACE_SET_COUNT: 'workspace/setCount',

  // Launcher
  LAUNCHER_OPEN: 'launcher/open',
  LAUNCHER_CLOSE: 'launcher/close',
  LAUNCHER_TOGGLE: 'launcher/toggle',

  // Tiles
  TILE_SET_SIZE: 'tile/setSize',
  TILE_EDIT_MODE: 'tile/editMode',

  // Preferences
  PREFS_SET: 'prefs/set',

  // Badges
  BADGE_SET: 'badge/set',
  BADGE_CLEAR: 'badge/clear',
  BADGE_ANIMATE: 'badge/animate',
};

// ---------- Windows ----------

/** @param {object} app - APPS entry  @param {object} init - initial app data */
/*
 * Window ids are minted here, not in the reducer.
 *
 * uid() is the one piece of a window's identity that cannot be derived from
 * (state, action), and having the reducer call it made the same dispatch
 * produce a different state every time — untestable, and not a reducer. The
 * action carries the id; the reducer stays a pure function of its inputs.
 */
export const openWindow = (app, init = {}) => ({ type: ActionTypes.WINDOW_OPEN, app, init, id: uid() });

export const closeWindow = (id) => ({ type: ActionTypes.WINDOW_CLOSE, id });
export const focusWindow = (id) => ({ type: ActionTypes.WINDOW_FOCUS, id });
export const minimizeWindow = (id) => ({ type: ActionTypes.WINDOW_MINIMIZE, id });
export const restoreWindow = (id) => ({ type: ActionTypes.WINDOW_RESTORE, id });

/** Unhide the most recently minimized window on the current workspace. */
export const restoreLastWindow = () => ({ type: ActionTypes.WINDOW_RESTORE_LAST });
export const maximizeWindow = (id) => ({ type: ActionTypes.WINDOW_MAXIMIZE, id });
export const unmaximizeWindow = (id) => ({ type: ActionTypes.WINDOW_UNMAXIMIZE, id });
export const toggleMaximizeWindow = (id) => ({ type: ActionTypes.WINDOW_TOGGLE_MAXIMIZE, id });

/** @param {string} snapType - one of SN.LEFT | RIGHT | TOP | BOTTOM | FULL */
export const snapWindow = (id, snapType) => ({ type: ActionTypes.WINDOW_SNAP, id, snapType });
export const snapWindowQuad = (id, quadIndex) => ({ type: ActionTypes.WINDOW_SNAP_QUAD, id, quadIndex });

/** Move the divider a tiled window shares. direction is left|right|up|down. */
export const resizeTile = (id, direction) => ({ type: ActionTypes.WINDOW_RESIZE_TILE, id, direction });

/** Focus the window in a direction. direction is left|right|up|down. */
export const focusDirection = (direction) => ({ type: ActionTypes.WINDOW_FOCUS_DIRECTION, direction });

/** Swap a tiled window with its neighbour in a direction. */
export const moveWindowDirection = (id, direction) => ({ type: ActionTypes.WINDOW_MOVE_DIRECTION, id, direction });

/** Latch the keyboard into resize mode, where bare arrows size the focus. */
export const setResizeMode = (on) => ({ type: ActionTypes.RESIZE_MODE_SET, on });

/** Explicit bounds, used by snap zones and by resize. */
export const setWindowBounds = (id, bounds, { snapped = false } = {}) => ({
  type: ActionTypes.WINDOW_SET_BOUNDS, id, bounds, snapped,
});

/** Free-float a window to a point (drag drop outside any snap zone). */
export const moveWindowTo = (id, x, y) => ({ type: ActionTypes.WINDOW_MOVE_TO, id, x, y });

export const moveWindowToWorkspace = (id, workspace, { follow = true } = {}) => ({
  type: ActionTypes.WINDOW_MOVE_TO_WORKSPACE, id, workspace, follow,
});

/** Move a window between the tiling tree and free-floating placement. */
export const toggleFloating = (id) => ({ type: ActionTypes.WINDOW_TOGGLE_FLOATING, id });

/** Recompute every workspace's tiling — used when the viewport changes. */
export const retileAll = () => ({ type: ActionTypes.WINDOW_RETILE });

// ---------- Workspaces ----------

export const switchWorkspace = (workspace) => ({ type: ActionTypes.WORKSPACE_SWITCH, workspace });
export const setWorkspaceCount = (count) => ({ type: ActionTypes.WORKSPACE_SET_COUNT, count });

// ---------- Launcher ----------

export const openLauncher = () => ({ type: ActionTypes.LAUNCHER_OPEN });
export const closeLauncher = () => ({ type: ActionTypes.LAUNCHER_CLOSE });
export const toggleLauncher = () => ({ type: ActionTypes.LAUNCHER_TOGGLE });

// ---------- Tiles ----------

export const setTileSize = (appId, size) => ({ type: ActionTypes.TILE_SET_SIZE, appId, size });
export const setTileEditMode = (enabled) => ({ type: ActionTypes.TILE_EDIT_MODE, enabled });

// ---------- Badges ----------

/** Set a desktop preference, e.g. focusFollowsMouse. */
export const setPref = (key, value) => ({ type: ActionTypes.PREFS_SET, key, value });

export const setBadge = (appId, count) => ({ type: ActionTypes.BADGE_SET, appId, count });
export const clearBadge = (appId) => ({ type: ActionTypes.BADGE_CLEAR, appId });
export const animateBadge = (appId) => ({ type: ActionTypes.BADGE_ANIMATE, appId });

/**
 * Tell the kernel how big the screen is and how wide the window gap is.
 *
 * The layout is computed from these, and the reducer must not measure them
 * itself: the shell owns the DOM, so the shell measures and dispatches.
 */
export const setEnv = ({ viewport, gap }) => ({ type: ActionTypes.ENV_SET, viewport, gap });
