import { useState, useEffect } from 'react';
import { uid, SN } from '../utils/constants.js';
import { qb, ghostFromPoint } from '../utils/geometry.js';
import { clearBadgeState, acc } from '../utils/appHelpers.js';
import { useDragManager } from './useDragManager.js';
import * as WindowActions from './windowActions.js';
import { isSingleInstance, getMaxInstances } from '../config/manifests.js';

/**
 * Custom hook for managing desktop windows and badges
 * Handles all window operations: open, close, minimize, maximize, snap, drag
 */
export function useWindowManager() {
  // Core state
  const [wns, setW] = useState([]);
  const [actId, setActId] = useState(null);
  const [badges, setBadges] = useState({ messages: 5, email: 3 });
  
  // Drag management
  const { drag, primeDrag, handleDrag, endDrag } = useDragManager();

  // Ensure there's always an active window
  useEffect(() => {
    const visibleWindows = wns.filter(w => !w.m);
    
    if (visibleWindows.length === 0) {
      // No visible windows - clear active window
      if (actId !== null) setActId(null);
    } else {
      const activeWindowExists = visibleWindows.some(w => w.id === actId);
      if (!activeWindowExists) {
        // Find the window with highest z-index (most recently interacted)
        const highestZWindow = visibleWindows.reduce((highest, current) => 
          current.z > highest.z ? current : highest
        );
        if (highestZWindow.id !== actId) {
          setActId(highestZWindow.id);
          fz(highestZWindow.id);
        }
      }
    }
  }, [wns, actId]);

  /**
   * Bring window to front (focus z-index)
   */
  const fz = (id) => setW(ws => {
    const maxZ = Math.max(...ws.map(w => w.z), 999);
    return ws.map(w => ({ ...w, z: w.id === id ? maxZ + 1 : w.z }));
  });

  /**
   * Set active window (focus + bring to front)
   */
  const setActive = (id) => { 
    console.log('Active window changed to:', id);
    setActId(id); 
    fz(id); 
  };

  /**
   * Open a new app window
   * @param {Object} app - App config with id, title, color, icon, content
   * @param {Object} init - Initial data for the app (optional)
   */
  const openA = (app, init = {}) => {
    // Check if app is single instance
    if (isSingleInstance(app.id)) {
      const existingWindow = wns.find(w => w.appId === app.id);
      if (existingWindow) {
        console.log(`${app.title} is already running (single instance)`);
        // Unminimize if minimized and bring to front
        if (existingWindow.m) {
          act(existingWindow.id, 'unmin');
        }
        setActive(existingWindow.id);
        return;
      }
    } else {
      // Check max instances limit
      const instances = wns.filter(w => w.appId === app.id).length;
      const maxInstances = getMaxInstances(app.id);
      if (instances >= maxInstances) {
        console.warn(`${app.title} has reached max instances (${maxInstances})`);
        return;
      }
    }
    
    setBadges(b => clearBadgeState(b, app.id));
    const id = uid();
    const q = qb(wns.length); // snap new window to next quadrant
    setW(ws => [...ws, { 
      id, 
      appId: app.id, 
      t: app.title, 
      icon: app.icon, 
      ax: acc(app.color), 
      b: q, 
      sn: SN.NONE, 
      z: 1000, 
      m: false, 
      init,
      instanceCount: wns.filter(w => w.appId === app.id).length + 1 
    }]);
    setActive(id); // Set new window as active
  };

  /**
   * Execute window action (close, minimize, maximize, snap, drag)
   */
  const act = (id, type, p) => {
    setW(ws => ws.map(w => {
      if (w.id !== id) return w;
      
      if (type === "close") return WindowActions.closeWindow();
      if (type === "min")   return WindowActions.minimizeWindow(w);
      if (type === "unmin") return WindowActions.unminimizeWindow(w);
      if (type === "max")   return WindowActions.maximizeWindow(w);
      if (type === "unmax") return WindowActions.unmaximizeWindow(w);
      
      if (type === "snap") {
        setActive(id);
        return WindowActions.snapWindow(w, p);
      }
      
      if (type === "snapQuad") {
        setActive(id);
        return WindowActions.snapQuadWindow(w, p);
      }
      
      if (type === "dbl") {
        setActive(id);
        return WindowActions.toggleMaximizeWindow(w);
      }
      
      if (type === "prime" || type === "dragStart") {
        const me = ws.find(x => x.id === id) || w;
        primeDrag(me);
        return w;
      }
      
      if (type === "drag") {
        handleDrag(id, p);
        return w;
      }
      
      if (type === "dragEnd") {
        const best = endDrag(p);
        setTimeout(() => setActive(id), 0);
        
        if (best) {
          if (best.type === 'snap')     { setTimeout(() => act(id, 'snap', best.payload), 0); }
          if (best.type === 'snapQuad') { setTimeout(() => act(id, 'snapQuad', best.payload), 0); }
          return w;
        }
        
        const ghost = ghostFromPoint(w, p);
        return WindowActions.floatWindow(w, ghost.x, ghost.y);
      }
      
      return w;
    }).filter(Boolean));
  };

  /**
   * Unminimize a window
   */
  const unmin = (id) => act(id, "unmin");

  return {
    // State
    wns,
    actId,
    badges,
    drag,
    
    // Actions
    setActive,
    openA,
    act,
    unmin,
    setBadges,
  };
}
