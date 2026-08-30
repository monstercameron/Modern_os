/**
 * Kernel Reducer
 *
 * The single source of truth for windows, workspaces, the launcher and tiles.
 * Pure: (state, action) => state. No side effects, no event publishing, no DOM
 * writes — the bridge layer handles those after a dispatch settles.
 *
 * Window transitions are resolved through utils/windowStateMachine.js so the
 * machine that documents the transitions is the machine that performs them.
 */

import { SN, B0, TB, uid } from '../utils/constants.js';
import { qb, ghostFromPoint } from '../utils/geometry.js';
import { acc, clearBadgeState } from '../utils/appHelpers.js';
import { isSingleInstance, getMaxInstances } from '../config/manifests.js';
import {
  displayEnumToState,
  snapEnumToState,
  resolveAction,
} from '../utils/windowStateMachine.js';
import { ActionTypes as T } from './actions.js';
import * as bsp from './layout/bsp.js';
import {
  ACTION as WA,
  readState,
  transition,
  applyState,
  participatesInLayout,
} from './windowState.js';

export const DEFAULT_WORKSPACE_COUNT = 5;

export const initialState = {
  windows: [],
  activeId: null,
  /** Per-workspace BSP trees: { [workspaceIndex]: node|null } */
  layouts: {},
  workspaces: { current: 1, count: DEFAULT_WORKSPACE_COUNT },
  // The desktop boots to the start screen; a tiling desktop with no windows
  // would otherwise be a blank background.
  launcherOpen: true,
  tiles: { sizes: {}, editMode: false },
  badges: { messages: 5, email: 3 },
  /** Desktop preferences that are not themeing. */
  prefs: { focusFollowsMouse: true },
  animatingBadge: null,
};

// ---------- helpers ----------

const viewport = () => ({
  w: typeof window === 'undefined' ? 1280 : window.innerWidth,
  h: typeof window === 'undefined' ? 800 : window.innerHeight,
});

/** Full-screen bounds below the taskbar. */
function fullBounds() {
  const { w, h } = viewport();
  return { x: 0, y: TB, w, h: h - TB };
}

/** Bounds for a half-screen snap. */
function halfBounds(snapType) {
  const { w, h } = viewport();
  const usableH = h - TB;
  switch (snapType) {
    case SN.LEFT: return { x: 0, y: TB, w: w / 2, h: usableH };
    case SN.RIGHT: return { x: w / 2, y: TB, w: w / 2, h: usableH };
    case SN.TOP: return { x: 0, y: TB, w, h: usableH / 2 };
    case SN.BOTTOM: return { x: 0, y: TB + usableH / 2, w, h: usableH / 2 };
    case SN.FULL: return fullBounds();
    default: return null;
  }
}

/** Remember where a window was before it snapped, so it can be restored. */
function withRestorePoint(win) {
  return win.sn === SN.NONE ? win.b : (win.prevB || win.b);
}

/** The area tiled windows share: the viewport below the taskbar. */
function tilingArea() {
  const { w, h } = viewport();
  return { x: 0, y: TB, w, h: h - TB };
}

/**
 * Spacing between tiled windows, read from the theme so it stays configurable.
 * Falls back to the layout default when there is no document (tests, SSR).
 */
function windowGap() {
  if (typeof document === 'undefined') return bsp.GAP;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-window-gap');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : bsp.GAP;
}

/**
 * Whether the layout should give this window a rectangle right now. Delegated
 * to the state machine so there is one definition of "tiled and visible".
 */
const isTiled = participatesInLayout;

/**
 * Run a window through the state machine.
 * Returns the updated window, or null when the machine refuses the action.
 */
function step(win, action, extra = {}) {
  const result = transition(readState(win), action);
  if (!result.ok) return null;
  return { ...applyState(win, result), ...extra };
}

/**
 * Recompute the tree for a workspace and write the resulting rectangles onto
 * its tiled windows. Floating windows keep whatever bounds they had.
 */
function retile(state, workspace) {
  const tiledIds = new Set(
    state.windows.filter((w) => w.ws === workspace && isTiled(w)).map((w) => w.id)
  );

  let tree = bsp.prune(state.layouts[workspace] || null, tiledIds);

  // Anything tiled but missing from the tree (restored, un-floated, moved in)
  // gets inserted next to whatever is focused.
  for (const id of tiledIds) {
    if (!bsp.has(tree, id)) {
      const rects = bsp.computeBounds(tree, tilingArea(), windowGap());
      const target = tiledIds.has(state.activeId) && state.activeId !== id
        ? state.activeId
        : null;
      tree = bsp.insert(tree, id, target, rects);
    }
  }

  const bounds = bsp.computeBounds(tree, tilingArea(), windowGap());
  const windows = state.windows.map((w) => {
    if (w.ws !== workspace || !isTiled(w)) return w;
    const b = bounds.get(w.id);
    if (!b) return w;
    if (w.b && w.b.x === b.x && w.b.y === b.y && w.b.w === b.w && w.b.h === b.h) return w;
    return { ...w, b, sn: SN.NONE };
  });

  return { ...state, windows, layouts: { ...state.layouts, [workspace]: tree } };
}

/** Retile every workspace that holds windows — used on viewport resize. */
function retileAll(state) {
  const touched = new Set(state.windows.map((w) => w.ws));
  let next = state;
  for (const ws of touched) next = retile(next, ws);
  return next;
}

/** Take a window out of tiling and give it a floating rectangle. */
function floatRect(win) {
  const { w: vw, h: vh } = viewport();
  const width = Math.round(Math.min(Math.max(win.b?.w ?? 760, 420), vw * 0.7));
  const height = Math.round(Math.min(Math.max(win.b?.h ?? 500, 300), (vh - TB) * 0.8));
  return {
    x: Math.round((vw - width) / 2),
    y: Math.round(TB + (vh - TB - height) / 2),
    w: width,
    h: height,
  };
}

/** Ask the state machine whether this action is legal for the window's state. */
function permits(win, userAction) {
  const resolved = resolveAction(
    displayEnumToState(win.m),
    snapEnumToState(win.sn),
    userAction
  );
  return resolved && resolved.valid ? resolved : null;
}

/** Replace one window by id, dropping it when the updater returns null. */
function mapWindow(state, id, updater) {
  let changed = false;
  const windows = [];
  for (const w of state.windows) {
    if (w.id !== id) { windows.push(w); continue; }
    const next = updater(w);
    changed = true;
    if (next) windows.push(next);
  }
  return changed ? { ...state, windows } : state;
}

/** Raise a window above its peers. */
function raise(state, id) {
  const maxZ = state.windows.reduce((m, w) => Math.max(m, w.z), 999);
  return {
    ...state,
    windows: state.windows.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w)),
  };
}

/**
 * After any change to the window set, make sure the active window is one that
 * is actually visible on the current workspace.
 */
function reconcileActive(state) {
  const visible = state.windows.filter(
    (w) => !w.m && w.ws === state.workspaces.current
  );
  if (visible.length === 0) {
    return state.activeId === null ? state : { ...state, activeId: null };
  }
  if (visible.some((w) => w.id === state.activeId)) return state;
  const top = visible.reduce((hi, w) => (w.z > hi.z ? w : hi));
  return { ...state, activeId: top.id };
}

// ---------- reducer ----------

export function reducer(state, action) {
  switch (action.type) {
    // ---------- open ----------
    case T.WINDOW_OPEN: {
      const { app, init } = action;
      if (!app) return state;

      const onThisApp = state.windows.filter((w) => w.appId === app.id);

      // Single-instance apps focus the window they already have.
      if (isSingleInstance(app.id) && onThisApp.length > 0) {
        const existing = onThisApp[0];
        const restored = mapWindow(state, existing.id, (w) => ({ ...w, m: false }));
        return reconcileActive(
          raise({ ...restored, activeId: existing.id, launcherOpen: false }, existing.id)
        );
      }

      if (onThisApp.length >= getMaxInstances(app.id)) return state;

      const id = uid();
      const workspace = state.workspaces.current;
      const onWorkspace = state.windows.filter((w) => w.ws === workspace).length;

      const win = {
        id,
        appId: app.id,
        ws: workspace,
        t: app.title,
        icon: app.icon,
        ax: acc(app.color),
        // retile() assigns the real rectangle; this is only a starting point
        // for the open animation.
        b: tilingArea(),
        sn: SN.NONE,
        z: 1000,
        m: false,
        floating: false,
        init,
        tilePosition: init?.tilePosition,
        instanceCount: onThisApp.length + 1,
      };
      void onWorkspace;

      // Split whatever is focused, so the new window halves its neighbour.
      const withWindow = {
        ...state,
        windows: [...state.windows, win],
        activeId: id,
        launcherOpen: false,
        badges: clearBadgeState(state.badges, app.id),
      };

      return reconcileActive(raise(retile(withWindow, workspace), id));
    }

    // ---------- open a child window (About) ----------
    case 'window/openChild': {
      const { app, parentId, title, init } = action;
      const parent = state.windows.find((w) => w.id === parentId);
      if (!app || !parent) return state;

      const id = uid();
      const width = 400;
      const height = 300;
      const win = {
        id,
        appId: app.id,
        ws: parent.ws,
        t: title,
        icon: app.icon,
        ax: 'bg-slate-700',
        b: {
          x: parent.b.x + (parent.b.w - width) / 2,
          y: parent.b.y + (parent.b.h - height) / 2,
          w: width,
          h: height,
        },
        sn: SN.NONE,
        z: parent.z + 1,
        m: false,
        floating: true,
        init,
        parentId,
        isChildWindow: true,
      };

      return reconcileActive(
        raise({ ...state, windows: [...state.windows, win], activeId: id }, id)
      );
    }

    // ---------- close ----------
    case T.WINDOW_CLOSE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      // A window's children go with it.
      const windows = state.windows.filter(
        (w) => w.id !== action.id && w.parentId !== action.id
      );
      // Closing the last window on a workspace falls back to the start screen
      // rather than leaving an empty background with no way in.
      const emptyNow = !windows.some((w) => w.ws === state.workspaces.current);
      const closed = reconcileActive({
        ...state,
        windows,
        launcherOpen: state.launcherOpen || emptyNow,
      });
      // The sibling of the closed window reclaims its space.
      return retile(closed, target.ws);
    }

    // ---------- focus ----------
    case T.WINDOW_FOCUS: {
      if (!action.id) return { ...state, activeId: null };
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      // Focusing a window on another workspace follows it there.
      const base =
        target.ws === state.workspaces.current
          ? state
          : { ...state, workspaces: { ...state.workspaces, current: target.ws } };
      return raise({ ...base, activeId: action.id }, action.id);
    }

    // ---------- display state ----------
    case T.WINDOW_MINIMIZE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) => step(w, WA.MINIMIZE) || w);
      // A minimized window releases its share of the tiling area.
      return retile(reconcileActive(next), target.ws);
    }

    case T.WINDOW_RESTORE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      // Restore is also the "unhide" path, so it accepts a window that is not
      // minimized and simply focuses it.
      const next = mapWindow(state, action.id, (w) => step(w, WA.RESTORE) || w);
      return retile(
        reconcileActive(raise({ ...next, activeId: action.id }, action.id)),
        target.ws
      );
    }

    /** Bring back the most recently minimized window on the current workspace. */
    case T.WINDOW_RESTORE_LAST: {
      const candidates = state.windows.filter(
        (w) => w.m && w.ws === state.workspaces.current
      );
      if (candidates.length === 0) return state;
      const target = candidates[candidates.length - 1];
      const next = mapWindow(state, target.id, (w) => step(w, WA.RESTORE) || w);
      return retile(
        reconcileActive(raise({ ...next, activeId: target.id }, target.id)),
        target.ws
      );
    }

    // ---------- tiling <-> floating ----------
    case T.WINDOW_TOGGLE_FLOATING: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const goingFloating = !target.floating;

      const next = mapWindow(state, action.id, (w) => {
        const moved = step(w, WA.TOGGLE_PLACEMENT);
        if (!moved) return w;
        return goingFloating
          ? { ...moved, sn: SN.NONE, b: floatRect(w), prevB: w.b }
          : { ...moved, sn: SN.NONE };
      });

      // Leaving the tree frees space; joining it splits the focused window.
      const layouts = goingFloating
        ? { ...next.layouts, [target.ws]: bsp.remove(next.layouts[target.ws] || null, action.id) }
        : next.layouts;

      return reconcileActive(
        raise(retile({ ...next, layouts, activeId: action.id }, target.ws), action.id)
      );
    }

    case T.WINDOW_RETILE:
      return retileAll(state);

    // ---------- maximize ----------
    case T.WINDOW_MAXIMIZE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) => ({
        ...w,
        m: false,
        prevB: w.b,
        prevSN: w.sn,
        sn: SN.FULL,
        b: fullBounds(),
      }));
      return retile(reconcileActive(next), target.ws);
    }

    case T.WINDOW_UNMAXIMIZE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) => ({
        ...w,
        sn: w.prevSN === SN.FULL ? SN.NONE : (w.prevSN ?? SN.NONE),
        b: w.floating ? (w.prevB ?? { ...B0 }) : w.b,
      }));
      return retile(next, target.ws);
    }

    case T.WINDOW_TOGGLE_MAXIMIZE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) =>
        w.sn === SN.FULL
          ? {
              ...w,
              m: false,
              sn: SN.NONE,
              b: w.floating ? (w.prevB ?? { ...B0 }) : w.b,
            }
          : { ...w, m: false, prevB: w.b, prevSN: w.sn, sn: SN.FULL, b: fullBounds() }
      );
      return retile(
        reconcileActive(raise({ ...next, activeId: action.id }, action.id)),
        target.ws
      );
    }

    // ---------- snapping ----------
    // Snapping and dragging are floating gestures: a tiled window that gets
    // snapped or moved by hand leaves the tree and stays where it was put.
    case T.WINDOW_SNAP: {
      const bounds = halfBounds(action.snapType);
      const target = state.windows.find((w) => w.id === action.id);
      if (!bounds || !target) return state;
      const next = mapWindow(state, action.id, (w) => ({
        ...w,
        m: false,
        prevB: withRestorePoint(w),
        prevSN: w.sn,
        sn: action.snapType,
        b: bounds,
        floating: true,
      }));
      return retile(
        reconcileActive(raise({ ...next, activeId: action.id }, action.id)),
        target.ws
      );
    }

    /*
     * Resizing a tiled window is a change to the layout, not to the window:
     * the tree moves a divider and retile() writes the new rectangles onto
     * both neighbours. The machine refuses this for floating, minimized and
     * fullscreen windows, and a refusal leaves the tree untouched.
     */
    case T.WINDOW_RESIZE_TILE: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || !step(target, WA.RESIZE_TILE)) return state;
      const current = state.layouts[target.ws] || null;
      const tree = bsp.resizeDirection(current, action.id, action.direction);
      if (tree === current) return state;
      return retile(
        { ...state, layouts: { ...state.layouts, [target.ws]: tree } },
        target.ws
      );
    }

    case T.WINDOW_SNAP_QUAD: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) => ({
        ...w,
        m: false,
        prevB: withRestorePoint(w),
        prevSN: w.sn,
        sn: SN.QUAD,
        b: qb(action.quadIndex),
        floating: true,
      }));
      return retile(
        reconcileActive(raise({ ...next, activeId: action.id }, action.id)),
        target.ws
      );
    }

    case T.WINDOW_SET_BOUNDS: {
      const { bounds, snapped } = action;
      const target = state.windows.find((w) => w.id === action.id);
      if (!bounds || !target) return state;
      const next = mapWindow(state, action.id, (w) =>
        snapped
          ? { ...w, prevB: withRestorePoint(w), prevSN: w.sn, sn: SN.NONE, b: bounds, floating: true }
          : { ...w, b: bounds }
      );
      return snapped
        ? retile(reconcileActive(raise({ ...next, activeId: action.id }, action.id)), target.ws)
        : next;
    }

    case T.WINDOW_MOVE_TO: {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      const next = mapWindow(state, action.id, (w) => {
        const ghost = ghostFromPoint(w, { x: action.x, y: action.y });
        return { ...w, sn: SN.NONE, floating: true, b: { ...w.b, x: ghost.x, y: ghost.y } };
      });
      return retile(
        reconcileActive(raise({ ...next, activeId: action.id }, action.id)),
        target.ws
      );
    }

    // ---------- workspaces ----------
    case T.WORKSPACE_SWITCH: {
      const { count } = state.workspaces;
      const target = Math.min(Math.max(1, action.workspace), count);
      if (target === state.workspaces.current) return state;
      return reconcileActive({
        ...state,
        workspaces: { ...state.workspaces, current: target },
        launcherOpen: false,
      });
    }

    case T.WORKSPACE_SET_COUNT: {
      const count = Math.max(1, action.count);
      // Windows on workspaces that no longer exist come back to the last one.
      const windows = state.windows.map((w) => (w.ws > count ? { ...w, ws: count } : w));
      const current = Math.min(state.workspaces.current, count);
      return reconcileActive({ ...state, windows, workspaces: { current, count } });
    }

    case T.WINDOW_MOVE_TO_WORKSPACE: {
      const { count } = state.workspaces;
      const target = Math.min(Math.max(1, action.workspace), count);
      const origin = state.windows.find((w) => w.id === action.id);
      const moved = mapWindow(state, action.id, (w) => ({ ...w, ws: target }));
      if (moved === state || !origin) return state;

      // The window leaves the old workspace's tree and joins the new one's.
      const withLayouts = {
        ...moved,
        layouts: {
          ...moved.layouts,
          [origin.ws]: bsp.remove(moved.layouts[origin.ws] || null, action.id),
        },
      };

      const placed = retile(retile(withLayouts, origin.ws), target);

      return reconcileActive(
        action.follow
          ? { ...placed, workspaces: { ...placed.workspaces, current: target }, activeId: action.id }
          : placed
      );
    }

    // ---------- launcher ----------
    case T.LAUNCHER_OPEN:
      return state.launcherOpen ? state : { ...state, launcherOpen: true };
    case T.LAUNCHER_CLOSE:
      return state.launcherOpen ? { ...state, launcherOpen: false, tiles: { ...state.tiles, editMode: false } } : state;
    case T.LAUNCHER_TOGGLE:
      return { ...state, launcherOpen: !state.launcherOpen };

    // ---------- tiles ----------
    case T.TILE_SET_SIZE:
      return {
        ...state,
        tiles: { ...state.tiles, sizes: { ...state.tiles.sizes, [action.appId]: action.size } },
      };

    case T.TILE_EDIT_MODE:
      return { ...state, tiles: { ...state.tiles, editMode: !!action.enabled } };

    // ---------- badges ----------
    case T.BADGE_SET:
      return { ...state, badges: { ...state.badges, [action.appId]: action.count } };

    case T.BADGE_CLEAR:
      return { ...state, badges: clearBadgeState(state.badges, action.appId) };

    case T.PREFS_SET:
      return { ...state, prefs: { ...state.prefs, [action.key]: action.value } };

    case T.BADGE_ANIMATE:
      return { ...state, animatingBadge: action.appId };

    default:
      return state;
  }
}
