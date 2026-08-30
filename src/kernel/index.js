/**
 * Kernel entry point.
 *
 * Creates the desktop store, wires the event bus to it, and exposes the React
 * binding. Everything the UI needs from kernel state comes through here.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { createStore } from './store.js';
import { reducer, initialState } from './reducer.js';
import { ActionTypes } from './actions.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';

export const store = createStore(reducer, initialState);

export * as actions from './actions.js';
export * as select from './selectors.js';
export { ActionTypes } from './actions.js';

/**
 * Announce state changes on the event bus so features that are not React
 * components (Task Manager's process list, notifications) can react.
 * The reducer stays pure; this is the only place a dispatch has side effects.
 */
const announce = (action, before, after) => {
  switch (action.type) {
    case ActionTypes.WINDOW_OPEN: {
      const opened = after.windows.find((w) => !before.windows.includes(w));
      if (opened) {
        eventBus.publish(TOPICS.WINDOW_OPEN, {
          windowId: opened.id,
          appId: opened.appId,
          appName: opened.t,
          minimized: false,
        });
        eventBus.publish(TOPICS.WINDOW_FOCUS, { windowId: opened.id });
      }
      break;
    }
    case ActionTypes.WINDOW_CLOSE:
      eventBus.publish(TOPICS.WINDOW_CLOSE, { windowId: action.id });
      break;
    case ActionTypes.WINDOW_MINIMIZE:
      eventBus.publish(TOPICS.WINDOW_MINIMIZE, { windowId: action.id });
      break;
    case ActionTypes.WINDOW_RESTORE:
      eventBus.publish(TOPICS.WINDOW_RESTORE, { windowId: action.id });
      break;
    case ActionTypes.WINDOW_MAXIMIZE:
      eventBus.publish(TOPICS.WINDOW_MAXIMIZE, { windowId: action.id });
      break;
    case ActionTypes.WINDOW_UNMAXIMIZE:
      eventBus.publish(TOPICS.WINDOW_RESTORE, { windowId: action.id });
      break;
    case ActionTypes.WORKSPACE_SWITCH:
      eventBus.publish('workspace.switch', { workspace: after.workspaces.current });
      break;
    case ActionTypes.WINDOW_MOVE_TO_WORKSPACE:
      eventBus.publish('workspace.moveWindow', {
        windowId: action.id,
        workspace: action.workspace,
      });
      break;
    default:
      break;
  }

  if (before.activeId !== after.activeId && after.activeId) {
    eventBus.publish(TOPICS.WINDOW_FOCUS, { windowId: after.activeId });
  }
};

/** Dispatch one action (or an array), then announce what happened. */
export function dispatch(action) {
  const list = Array.isArray(action) ? action : [action];
  for (const a of list) {
    if (!a) continue;
    const before = store.getState();
    const after = store.dispatch(a);
    announce(a, before, after);
  }
  return store.getState();
}

/**
 * Subscribe a component to a slice of kernel state.
 * @param {Function} selector - (state) => slice
 */
export function useKernel(selector) {
  const getSnapshot = useCallback(() => selector(store.getState()), [selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Stable dispatch reference for components. */
export function useDispatch() {
  return dispatch;
}

// Dev-only inspection handle. Lets the running desktop be driven and asserted
// from the console (or a browser-automation session) without a second module
// instance, which a dynamic import would create.
if (import.meta.env?.DEV && typeof globalThis !== 'undefined') {
  globalThis.__kernel = { store, dispatch, actions: undefined, select: undefined };
  import('./actions.js').then((m) => { globalThis.__kernel.actions = m; });
  import('./selectors.js').then((m) => { globalThis.__kernel.select = m; });
}
