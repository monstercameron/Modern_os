/**
 * Kernel Store
 *
 * A minimal observable store built for useSyncExternalStore. No dependencies.
 * The store owns the desktop's state; the UI reads it through selectors and
 * changes it only by dispatching actions.
 */

/**
 * Create a store around a pure reducer.
 *
 * @param {Function} reducer - (state, action) => state
 * @param {object} initialState
 * @returns {{getState: Function, dispatch: Function, subscribe: Function, replaceState: Function}}
 */
export function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const notify = () => {
    // Copy before iterating: a listener may unsubscribe during notification.
    for (const listener of [...listeners]) listener();
  };

  /**
   * Dispatch one action, or an array of actions applied in order with a single
   * notification at the end. Returns the resulting state.
   */
  const dispatch = (action) => {
    const actions = Array.isArray(action) ? action : [action];
    const before = state;

    for (const a of actions) {
      if (!a || typeof a.type !== 'string') {
        console.warn('[store] ignored malformed action', a);
        continue;
      }
      state = reducer(state, a);
    }

    if (state !== before) notify();
    return state;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  /** Test/bootstrap escape hatch — replaces state without running the reducer. */
  const replaceState = (next) => {
    state = next;
    notify();
  };

  return { getState, dispatch, subscribe, replaceState };
}
