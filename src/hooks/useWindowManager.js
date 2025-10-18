import { useState, useEffect, useRef } from 'react';
import { uid, SN } from '../utils/constants.js';
import { qb, ghostFromPoint } from '../utils/geometry.js';
import { clearBadgeState, acc } from '../utils/appHelpers.js';
import { useDragManager } from './useDragManager.js';
import * as WindowActions from './windowActions.js';
import { isSingleInstance, getMaxInstances } from '../config/manifests.js';
import { APPS } from '../config/apps.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';

/**
 * Custom hook for managing desktop windows and badges
 * Handles all window operations: open, close, minimize, maximize, snap, drag
 */
export function useWindowManager() {
  // Core state
  const [wns, setW] = useState([]);
  const [actId, setActId] = useState(null);
  const [badges, setBadges] = useState({ messages: 5, email: 3 });
  const [animatingBadge, setAnimatingBadge] = useState(null);
  
  // Drag management
  const { drag, primeDrag, handleDrag, endDrag } = useDragManager();
  const snappedThisDrag = useRef(false);

  // Increment email badge every 10 seconds with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBadges(prev => {
        const newEmail = prev.email + 1;
        setAnimatingBadge('email');
        setTimeout(() => setAnimatingBadge(null), 500); // Clear animation after 500ms
        return { ...prev, email: newEmail };
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Subscribe to taskbar events for decoupled communication
  useEffect(() => {
    // Handle window button clicks from taskbar
    const unsubscribeClick = eventBus.subscribe(TOPICS.TASKBAR_WINDOW_CLICK, ({ winId, isMinimized, isActive }) => {
      if (isMinimized) {
        unmin(winId);
        setActive(winId);
      } else if (isActive) {
        act(winId, "min");
      } else {
        setActive(winId);
      }
    });

    // Handle window actions from taskbar preview
    const unsubscribeAction = eventBus.subscribe(TOPICS.TASKBAR_WINDOW_ACTION, ({ winId, action }) => {
      if (action === 'activate') {
        setActive(winId);
      } else {
        act(winId, action);
      }
    });

    return () => {
      unsubscribeClick();
      unsubscribeAction();
    };
  }, []);

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
    setActId(id); 
    fz(id);
    
    // Publish window focus event for Task Manager
    if (id) {
      eventBus.publish(TOPICS.WINDOW_FOCUS, { windowId: id });
    }
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
    const quadrantIndex = wns.length;
    const q = qb(quadrantIndex); // snap new window to next quadrant
    
    // Create the new window object
    const newWindow = { 
      id, 
      appId: app.id, 
      t: app.title, 
      icon: app.icon, 
      ax: acc(app.color), 
      b: q, 
      sn: SN.QUAD, 
      z: 1000, 
      m: false, 
      init,
      tilePosition: init?.tilePosition, // Store tile position for animation
      instanceCount: wns.filter(w => w.appId === app.id).length + 1 
    };
    
    setW(ws => [...ws, newWindow]);
    
    setActId(id);
    fz(id);
    
    // Publish events for Task Manager
    eventBus.publish(TOPICS.WINDOW_OPEN, {
      windowId: id,
      appId: app.id,
      appName: app.title,
      minimized: false
    });
    
    eventBus.publish(TOPICS.WINDOW_FOCUS, { windowId: id });
  };

  /**
   * Execute window action (close, minimize, maximize, snap, drag)
   */
  const act = (id, type, p) => {
    // Publish events for Task Manager before state update
    if (type === "close") {
      eventBus.publish(TOPICS.WINDOW_CLOSE, { windowId: id });
    } else if (type === "min") {
      eventBus.publish(TOPICS.WINDOW_MINIMIZE, { windowId: id });
    } else if (type === "unmin") {
      eventBus.publish(TOPICS.WINDOW_RESTORE, { windowId: id });
    } else if (type === "max") {
      eventBus.publish(TOPICS.WINDOW_MAXIMIZE, { windowId: id });
    } else if (type === "unmax") {
      eventBus.publish(TOPICS.WINDOW_RESTORE, { windowId: id });
    }
    
    setW(ws => {
      const updated = ws.map(w => {
        if (w.id !== id) {
          return w;
        }
        
        if (type === "close") {
          return WindowActions.closeWindow();
        }
        if (type === "min") {
          return WindowActions.minimizeWindow(w);
        }
        if (type === "unmin") {
          return WindowActions.unminimizeWindow(w);
        }
        if (type === "max") {
          return WindowActions.maximizeWindow(w);
        }
        if (type === "unmax") {
          return WindowActions.unmaximizeWindow(w);
        }
        
        if (type === "snap") {
          setActive(id);
          return WindowActions.snapWindow(w, p);
        }
        
        if (type === "snapQuad") {
          setActive(id);
          return WindowActions.snapQuadWindow(w, p);
        }
        
        if (type === "snapToBounds") {
          setActive(id);
          // p is the bounds object {x, y, w, h}
          const saveB = (w.sn === SN.NONE) ? w.b : (w.prevB || w.b);
          return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.NONE, b: p };
        }
        
        if (type === "dbl") {
          setActive(id);
          return WindowActions.toggleMaximizeWindow(w);
        }
        
        if (type === "resize") {
          // Update window bounds during resize
          return { ...w, b: p };
        }
        
        if (type === "prime" || type === "dragStart") {
          const me = ws.find(x => x.id === id) || w;
          primeDrag(me);
          snappedThisDrag.current = false;
          return w;
        }
        
        if (type === "drag") {
          handleDrag(id, p);
          return w;
        }
        
        if (type === "dragEnd") {
          const best = endDrag(p);
          setTimeout(() => setActive(id), 0);
          
          if (best && !snappedThisDrag.current) {
            snappedThisDrag.current = true;
            if (best.type === 'snap')         { setTimeout(() => act(id, 'snap', best.payload), 0); }
            if (best.type === 'snapQuad')     { setTimeout(() => act(id, 'snapQuad', best.payload), 0); }
            if (best.type === 'snapToBounds') { setTimeout(() => act(id, 'snapToBounds', best.payload), 0); }
            return w;
          }
          
          const ghost = ghostFromPoint(w, p);
          return WindowActions.floatWindow(w, ghost.x, ghost.y);
        }
        
        return w;
      }).filter(Boolean);
      
      // If a window was closed, also close its child windows
      const closedWindowId = updated.length < ws.length ? ws.find(w => !updated.includes(w))?.id : null;
      if (closedWindowId) {
        return updated.filter(w => w.parentId !== closedWindowId);
      }
      
      return updated;
    });
  };

  /**
   * Unminimize a window
   */
  const unmin = (id) => act(id, "unmin");

  /**
   * Open an About window as a child of parent window
   */
  const openAboutWindow = (parentWindowId, appTitle) => {
    const aboutApp = APPS.find(a => a.id === 'about');
    
    if (!aboutApp) {
      console.warn('About app not found in config');
      return;
    }

    const id = uid();
    const parentWindow = wns.find(w => w.id === parentWindowId);
    
    if (!parentWindow) {
      console.warn('Parent window not found');
      return;
    }

    // Position About window relative to parent - centered on top
    const parentX = parentWindow.b.x;
    const parentY = parentWindow.b.y;
    const parentW = parentWindow.b.w;
    const parentH = parentWindow.b.h;
    
    const aboutWidth = 400;
    const aboutHeight = 300;
    const aboutX = parentX + (parentW - aboutWidth) / 2;
    const aboutY = parentY + (parentH - aboutHeight) / 2;

    const newWindow = {
      id,
      appId: 'about',
      t: `About ${appTitle}`,
      icon: 'ℹ️',
      ax: 'bg-slate-700',
      b: { x: aboutX, y: aboutY, w: aboutWidth, h: aboutHeight },
      sn: SN.NONE,
      z: parentWindow.z + 1,
      m: false,
      init: { appTitle },
      parentId: parentWindowId,
      isChildWindow: true
    };

    setW(ws => [...ws, newWindow]);
    setActId(id);
    fz(id);

    eventBus.publish(TOPICS.WINDOW_OPEN, {
      windowId: id,
      appId: 'about',
      appName: `About ${appTitle}`,
      minimized: false,
      parentId: parentWindowId
    });
  };

  return {
    // State
    wns,
    actId,
    badges,
    drag,
    animatingBadge,
    
    // Actions
    setActive,
    openA,
    act,
    unmin,
    openAboutWindow,
    setBadges,
  };
}
