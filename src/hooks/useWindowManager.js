import { useCallback, useEffect, useRef } from 'react';
import { SN } from '../utils/constants.js';
import { useDragManager } from './useDragManager.js';
import { APPS } from '../config/apps.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';
import { store, dispatch, useKernel, actions, select } from '../kernel/index.js';
import { read, write } from '../services/persistence.js';

/**
 * React binding for the kernel's window state.
 *
 * The kernel owns the state; this hook translates the legacy
 * act(id, "type", payload) vocabulary that Win.jsx and Taskbar.jsx speak into
 * kernel actions, and manages the drag session (which is transient UI state,
 * not desktop state, so it stays out of the kernel).
 */
export function useWindowManager() {
  const windows = useKernel(select.allWindows);
  const actId = useKernel(select.activeWindowId);
  const badges = useKernel(select.badges);
  const animatingBadge = useKernel(select.animatingBadge);

  const { drag, primeDrag, handleDrag, endDrag } = useDragManager();
  const snappedThisDrag = useRef(false);

  // ---------- badge feed ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const current = store.getState().badges.email ?? 0;
      dispatch([actions.setBadge('email', current + 1), actions.animateBadge('email')]);
      setTimeout(() => dispatch(actions.animateBadge(null)), 500);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ---------- keep tiling in step with the viewport ----------
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => dispatch(actions.retileAll()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // ---------- persist tile sizes ----------
  const tileSizes = useKernel(select.tileSizes);
  useEffect(() => {
    write('tileSizes', tileSizes);
  }, [tileSizes]);

  const setActive = useCallback((id) => {
    dispatch(actions.focusWindow(id));
  }, []);

  const openA = useCallback((app, init = {}) => {
    // Callers pass either an APPS entry or a bare app id.
    const entry = typeof app === 'string' ? APPS.find((a) => a.id === app) : app;
    if (!entry) return;
    dispatch(actions.openWindow(entry, init));
  }, []);

  /**
   * Legacy action bridge. Every branch resolves to kernel actions.
   */
  const act = useCallback((id, type, payload) => {
    switch (type) {
      case 'close': return void dispatch(actions.closeWindow(id));
      case 'min': return void dispatch(actions.minimizeWindow(id));
      case 'unmin': return void dispatch(actions.restoreWindow(id));
      case 'max': return void dispatch(actions.maximizeWindow(id));
      case 'unmax': return void dispatch(actions.unmaximizeWindow(id));
      case 'dbl': return void dispatch(actions.toggleMaximizeWindow(id));
      case 'toggleFloat': return void dispatch(actions.toggleFloating(id));
      case 'snap': return void dispatch(actions.snapWindow(id, payload));
      case 'snapQuad': return void dispatch(actions.snapWindowQuad(id, payload));
      case 'snapToBounds':
        return void dispatch(actions.setWindowBounds(id, payload, { snapped: true }));
      case 'resize':
        return void dispatch(actions.setWindowBounds(id, payload));

      case 'prime':
      case 'dragStart': {
        const win = store.getState().windows.find((w) => w.id === id);
        if (win) primeDrag(win);
        snappedThisDrag.current = false;
        return;
      }

      case 'drag':
        return void handleDrag(id, payload);

      case 'dragEnd': {
        const target = endDrag(payload);
        if (target && !snappedThisDrag.current) {
          snappedThisDrag.current = true;
          dispatch(actions.setWindowBounds(id, target.payload, { snapped: true }));
          return;
        }
        dispatch(actions.moveWindowTo(id, payload.x, payload.y));
        return;
      }

      default:
        return;
    }
  }, [primeDrag, handleDrag, endDrag]);

  const unmin = useCallback((id) => dispatch(actions.restoreWindow(id)), []);

  const openAboutWindow = useCallback((parentWindowId, appTitle) => {
    const aboutApp = APPS.find((a) => a.id === 'about');
    if (!aboutApp) return;
    dispatch({
      type: 'window/openChild',
      app: aboutApp,
      parentId: parentWindowId,
      title: `About ${appTitle}`,
      init: { appTitle },
    });
  }, []);

  // ---------- taskbar events ----------
  useEffect(() => {
    const offClick = eventBus.subscribe(
      TOPICS.TASKBAR_WINDOW_CLICK,
      ({ winId, isMinimized, isActive }) => {
        if (isMinimized) dispatch(actions.restoreWindow(winId));
        else if (isActive) dispatch(actions.minimizeWindow(winId));
        else dispatch(actions.focusWindow(winId));
      }
    );

    const offAction = eventBus.subscribe(
      TOPICS.TASKBAR_WINDOW_ACTION,
      ({ winId, action }) => {
        if (action === 'activate') dispatch(actions.focusWindow(winId));
        else act(winId, action);
      }
    );

    return () => { offClick(); offAction(); };
  }, [act]);

  const setBadges = useCallback((updater) => {
    const current = store.getState().badges;
    const next = typeof updater === 'function' ? updater(current) : updater;
    dispatch(Object.entries(next).map(([appId, count]) => actions.setBadge(appId, count)));
  }, []);

  return {
    wns: windows,
    actId,
    badges,
    drag,
    animatingBadge,
    setActive,
    openA,
    act,
    unmin,
    openAboutWindow,
    setBadges,
  };
}

/** Restore persisted tile sizes into the kernel at boot. */
export function hydrateTileSizes() {
  const saved = read('tileSizes', null);
  if (saved && typeof saved === 'object') {
    dispatch(
      Object.entries(saved).map(([appId, size]) => actions.setTileSize(appId, size))
    );
  }
}

export { SN };
