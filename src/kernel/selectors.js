/**
 * Kernel Selectors
 *
 * Read models over kernel state. Components read through these so the shape of
 * the state can change without touching the UI.
 *
 * Array-returning selectors cache on their inputs, because useSyncExternalStore
 * re-runs the selector on every store notification and a fresh array each time
 * would re-render every subscriber.
 */

/** Cache a single-argument selector on identity of the values it derives from. */
function cached(compute) {
  let lastKey = null;
  let lastValue = null;
  return (state, ...args) => {
    const { key, value } = compute(state, ...args);
    if (lastKey !== null && key.length === lastKey.length && key.every((k, i) => k === lastKey[i])) {
      return lastValue;
    }
    lastKey = key;
    lastValue = value;
    return lastValue;
  };
}

export const currentWorkspace = (state) => state.workspaces.current;
export const workspaceCount = (state) => state.workspaces.count;
export const isLauncherOpen = (state) => state.launcherOpen;
export const activeWindowId = (state) => state.activeId;
export const tileSizes = (state) => state.tiles.sizes;
export const tileEditMode = (state) => state.tiles.editMode;
export const badges = (state) => state.badges;
export const prefs = (state) => state.prefs;
export const focusFollowsMouse = (state) => state.prefs.focusFollowsMouse;
export const animatingBadge = (state) => state.animatingBadge;

/** Every window, across all workspaces. */
export const allWindows = (state) => state.windows;

/** Windows assigned to the workspace on screen — minimized ones included. */
export const windowsOnWorkspace = cached((state) => {
  const ws = state.workspaces.current;
  const value = state.windows.filter((w) => w.ws === ws);
  return { key: [state.windows, ws], value };
});

/** Windows that should actually be painted right now. */
export const visibleWindows = cached((state) => {
  const ws = state.workspaces.current;
  const value = state.windows.filter((w) => w.ws === ws && !w.m);
  return { key: [state.windows, ws], value };
});

/** The focused window object, or null. */
export const activeWindow = (state) =>
  state.windows.find((w) => w.id === state.activeId) || null;

/** Which workspaces have at least one window — drives the taskbar indicator. */
export const workspaceOccupancy = cached((state) => {
  const occupied = new Set(state.windows.map((w) => w.ws));
  const value = Array.from({ length: state.workspaces.count }, (_, i) => ({
    index: i + 1,
    occupied: occupied.has(i + 1),
    current: state.workspaces.current === i + 1,
    windowCount: state.windows.filter((w) => w.ws === i + 1).length,
  }));
  return { key: [state.windows, state.workspaces.current, state.workspaces.count], value };
});
