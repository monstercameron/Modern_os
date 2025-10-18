import React, { useRef, useState, useCallback, useMemo, memo, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { AppWindow, X, Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { TB, SN } from "../utils/constants.js";
import { SnapCell, SnapIcon } from "./SnapComponents.jsx";
import { SplashScreen } from "./SplashScreen.jsx";
import { ContextMenu } from "./ContextMenu.jsx";
import { useWindowState } from "../hooks/useWindowState.js";
import { useContextMenu } from "../hooks/useContextMenu.js";
import { CONTEXT_TYPES, MENU_ACTIONS } from "../utils/contextMenuStateMachine.js";
import eventBus, { TOPICS } from "../utils/eventBus.js";

// Resize handle component
const ResizeHandle = memo(function ResizeHandle({ position, onResizeStart, disabled }) {
  const controls = useDragControls();
  
  const positionStyles = {
    n: 'top-0 left-0 right-0 h-1 cursor-ns-resize',
    ne: 'top-0 right-0 w-3 h-3 cursor-nesw-resize',
    e: 'top-0 right-0 bottom-0 w-1 cursor-ew-resize',
    se: 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize',
    s: 'bottom-0 left-0 right-0 h-1 cursor-ns-resize',
    sw: 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize',
    w: 'top-0 left-0 bottom-0 w-1 cursor-ew-resize',
    nw: 'top-0 left-0 w-3 h-3 cursor-nwse-resize'
  };

  if (disabled) return null;

  return (
    <motion.div
      className={`absolute ${positionStyles[position]} hover:bg-blue-500/20 z-10`}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragControls={controls}
      dragListener={false}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        controls.start(e);
        onResizeStart(position, e);
      }}
    />
  );
});

export const Win = memo(function Win({ win, on, children, active, setActive, app }) {
  const controls = useDragControls();
  const [dragCur, setDragCur] = useState(false); // cursor only while pressed
  const [hv, setHv] = useState(false);
  const [showSnap, setShowSnap] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const hoverTimer = useRef(null);
  const resizeStartPos = useRef(null);
  const resizeStartBounds = useRef(null);
  
  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [animatingFromTile, setAnimatingFromTile] = useState(!!win.tilePosition);
  
  // Context menu for window
  const {
    contextMenuState: windowContextMenu,
    handleContextMenu: handleWindowContextMenu,
    handleCloseMenu: closeWindowMenu,
    handleSelectItem: handleWindowMenuSelect,
    updateMetadata: updateWindowMenuMetadata,
  } = useContextMenu(CONTEXT_TYPES.WINDOW, { 
    windowId: win.id,
    isMinimized: win.m,
    isMaximized: win.sn === SN.FULL,
    isFullscreen: false,
  });

  // Handle window context menu actions
  const handleWindowAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.MINIMIZE:
        on('min');
        break;
      case MENU_ACTIONS.MAXIMIZE:
        on(win.sn === SN.FULL ? 'unmax' : 'max');
        break;
      case MENU_ACTIONS.RESTORE:
        on('unmax');
        break;
      case MENU_ACTIONS.CLOSE:
        on('close');
        break;
      case MENU_ACTIONS.SNAP_LEFT:
        on('snap', SN.LEFT);
        break;
      case MENU_ACTIONS.SNAP_RIGHT:
        on('snap', SN.RIGHT);
        break;
      case MENU_ACTIONS.SNAP_TOP:
        on('snap', SN.TOP);
        break;
      case MENU_ACTIONS.SNAP_BOTTOM:
        on('snap', SN.BOTTOM);
        break;
      default:
        break;
    }
  }, [win, on]);
  
  // Hide splash screen after minimum 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Update window menu metadata when window state changes
  useEffect(() => {
    updateWindowMenuMetadata({
      isMinimized: win.m,
      isMaximized: win.sn === SN.FULL,
    });
  }, [win.m, win.sn, updateWindowMenuMetadata]);
  
  // Subscribe to window actions from taskbar preview via eventBus
  useEffect(() => {
    const unsubscribe = eventBus.subscribeFiltered(
      TOPICS.TASKBAR_WINDOW_ACTION,
      (data) => {
        console.log('[Win.subscribeFiltered] Checking if event is for this window:', { 
          eventWinId: data.winId, 
          thisWindowId: win.id, 
          matches: data.winId === win.id 
        });
        return data.winId === win.id;
      },
      (data) => {
        console.log('[Win] Received TASKBAR_WINDOW_ACTION event for this window:', data);
        const { action } = data;
        console.log('[Win] Action to execute:', action);
        
        // Execute the action via the window's action handler
        if (action === 'activate') {
          console.log('[Win] Executing activate action - calling setActive(). NOT calling on() since activate is handled by setActive');
          setActive(win.id);
        } else if (action === 'min') {
          console.log('[Win] Executing min action - calling on("min")');
          on('min');
        } else if (action === 'unmin') {
          console.log('[Win] Executing unmin action - calling on("unmin")');
          on('unmin');
        } else if (action === 'max') {
          console.log('[Win] Executing max action - calling on("max")');
          on('max');
        } else if (action === 'unmax') {
          console.log('[Win] Executing unmax action - calling on("unmax")');
          on('unmax');
        } else if (action === 'close') {
          console.log('[Win] Executing close action - calling on("close")');
          on('close');
        } else {
          console.log('[Win] Unknown action received:', action);
        }
      }
    );
    
    return () => {
      console.log('[Win] Unsubscribing from TASKBAR_WINDOW_ACTION for window:', win.id);
      unsubscribe();
    };
  }, [win.id, on, setActive]);
  
  // Use state machine to understand window state
  const windowState = useWindowState(win);
  
  // Min/max size constraints
  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 150;

  const borderCls = win.sn === SN.FULL
    ? "border-0"
    : active
      ? "border-6"
      : hv
        ? "border-2"
        : "border";

  const shadowCls = (win.sn === SN.FULL || win.sn === SN.LEFT || win.sn === SN.RIGHT || win.sn === SN.TOP || win.sn === SN.BOTTOM || win.sn === SN.QUAD)
    ? ""
    : "shadow-lg";

  const borderStyle = win.sn === SN.FULL
    ? {}
    : active
      ? { borderColor: 'var(--theme-accent)' }
      : hv
        ? { borderColor: 'var(--theme-text)' }
        : { borderColor: 'var(--theme-border)' };

  // Spring animation config for snappy feel (<100ms)
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

  // Resize handlers
  const handleResizeStart = useCallback((direction, e) => {
    e.stopPropagation();
    setResizing(true);
    setResizeDir(direction);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartBounds.current = { ...win.b };
    
    // Add global mouse move and up listeners
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - resizeStartPos.current.x;
      const deltaY = moveEvent.clientY - resizeStartPos.current.y;
      
      let newBounds = { ...resizeStartBounds.current };
      
      // Calculate new bounds based on resize direction
      if (direction.includes('n')) {
        const newHeight = resizeStartBounds.current.h - deltaY;
        if (newHeight >= MIN_HEIGHT) {
          newBounds.y = resizeStartBounds.current.y + deltaY;
          newBounds.h = newHeight;
        }
      }
      if (direction.includes('s')) {
        newBounds.h = Math.max(MIN_HEIGHT, resizeStartBounds.current.h + deltaY);
      }
      if (direction.includes('w')) {
        const newWidth = resizeStartBounds.current.w - deltaX;
        if (newWidth >= MIN_WIDTH) {
          newBounds.x = resizeStartBounds.current.x + deltaX;
          newBounds.w = newWidth;
        }
      }
      if (direction.includes('e')) {
        newBounds.w = Math.max(MIN_WIDTH, resizeStartBounds.current.w + deltaX);
      }
      
      // Update window bounds via the action handler
      on('resize', newBounds);
    };
    
    const handleMouseUp = () => {
      setResizing(false);
      setResizeDir(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [win.b, on, MIN_WIDTH, MIN_HEIGHT]);

  const handleMaxHoverStart = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setShowSpin(true);
    hoverTimer.current = setTimeout(() => { setShowSpin(false); setShowSnap(true); }, 800);
  }, []);
  
  const handleMaxHoverEnd = useCallback(() => {
    clearTimeout(hoverTimer.current);
    // Don't close immediately - let the dialog handle its own mouse leave
    // Only close spin animation
    setShowSpin(false);
  }, []);
  
  const handleSnapDialogMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setShowSnap(false);
    }, 50);
  }, []);
  
  const handleSnapDialogMouseEnter = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setShowSnap(true);
  }, []);

  const handleDragStart = useCallback(() => on("dragStart"), [on]);
  const handleDrag = useCallback((e, i) => on("drag", { x: i.point.x, y: i.point.y }), [on]);
  const handleDragEnd = useCallback((e, i) => { 
    setDragCur(false); 
    on("dragEnd", { x: i.point.x, y: i.point.y }); 
  }, [on]);
  const handleClick = useCallback(() => setActive(win.id), [setActive, win.id]);
  
  const handlePointerDown = useCallback((e) => {
    if ((e.button ?? 0) !== 0) return;
    setDragCur(true);
    controls.start(e);
  }, [controls]);
  
  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (!active) { setActive(win.id); return; }
    setDragCur(false);  // Reset drag state so animation can play
    on("dbl");
  }, [active, setActive, win.id, on]);

  // Memoize style objects
  const baseStyle = useMemo(() => ({
    zIndex: win.z,
    boxSizing: 'border-box',
    ...borderStyle
  }), [win.z, borderStyle]);

  // Initial position for tile flip animation
  const initialPosition = useMemo(() => {
    if (win.tilePosition && animatingFromTile) {
      return {
        x: 0,
        y: 0,
        left: win.tilePosition.x,
        top: win.tilePosition.y,
        width: win.tilePosition.w,
        height: win.tilePosition.h,
        scale: 1,
        rotateY: 180
      };
    }
    return null;
  }, [win.tilePosition, animatingFromTile]);

  const animateStyle = useMemo(() => ({
    x: 0,
    y: 0,
    left: win.b.x,
    top: win.b.y,
    width: win.b.w,
    height: win.b.h,
    scale: 1,
    rotateY: 0
  }), [win.b.x, win.b.y, win.b.w, win.b.h]);

  const divRef = useRef(null);

  const animateValue = dragCur ? undefined : animateStyle;

  return (
    <motion.div
      ref={divRef}
      className={`absolute bg-white ${shadowCls} ${borderCls}`}
      style={baseStyle}
      initial={initialPosition || animateStyle}
      animate={animateValue}
      transition={dragCur ? undefined : (animatingFromTile ? { 
        type: 'spring', 
        stiffness: 350, 
        damping: 28, 
        mass: 0.9 
      } : springConfig)}
      onAnimationComplete={() => {
        setAnimatingFromTile(false);
        try {
          const el = divRef.current;
          if (el && el.getBoundingClientRect) {
            const r = el.getBoundingClientRect();
            const rectStr = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
            const csEl = window.getComputedStyle ? window.getComputedStyle(el) : null;
            const elTransform = csEl ? csEl.transform : null;
            const inlineLeft = el.style.left || null;
            const inlineTop = el.style.top || null;
            const scrollX = typeof window.scrollX !== 'undefined' ? window.scrollX : (document.documentElement || {}).scrollLeft || 0;
            const scrollY = typeof window.scrollY !== 'undefined' ? window.scrollY : (document.documentElement || {}).scrollTop || 0;
            console.log(`Win animationComplete rect vs bounds id=${win.id} bounds=${win.b.x},${win.b.y},${win.b.w},${win.b.h} rect=${rectStr} elStyleLeft=${inlineLeft} elStyleTop=${inlineTop} elTransform=${elTransform} scroll=${scrollX},${scrollY}`);
            // If DOM rect doesn't match expected bounds, log ancestor transforms and rects
            if (Math.round(r.left) !== win.b.x || Math.round(r.top) !== win.b.y) {
              try {
                let node = el.parentElement;
                const ancestors = [];
                while (node) {
                  const nr = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
                  const cs = window.getComputedStyle ? window.getComputedStyle(node) : null;
                  ancestors.push({ tag: node.tagName, id: node.id || null, class: node.className || null, rect: nr ? `${Math.round(nr.left)},${Math.round(nr.top)},${Math.round(nr.width)},${Math.round(nr.height)}` : null, transform: cs ? cs.transform : null });
                  node = node.parentElement;
                }
                console.log('Win ancestor chain (closest->root):', ancestors);
              } catch (err) {
                console.error('Error logging ancestors', err);
              }
              // Attempt to correct residual transform-based positioning by clearing transform
              // and setting inline left/top/width/height to the final bounds. Run in RAF
              // to avoid fighting the layout engine.
              try {
                const applyCorrection = () => {
                  try {
                    // Forcefully clear any transform (use !important)
                    el.style.setProperty('transform', 'none', 'important');
                    // Set inline geometry (use !important to avoid being overridden)
                    el.style.setProperty('left', `${win.b.x}px`, 'important');
                    el.style.setProperty('top', `${win.b.y}px`, 'important');
                    el.style.setProperty('width', `${win.b.w}px`, 'important');
                    el.style.setProperty('height', `${win.b.h}px`, 'important');
                    console.log(`Win corrected inline styles id=${win.id} -> left=${el.style.left} top=${el.style.top} w=${el.style.width} h=${el.style.height} (important)`);
                  } catch (err2) {
                    console.error('Error applying inline correction', err2);
                  }
                };

                // Try immediately in RAF, then again after short delays to beat any later writes
                requestAnimationFrame(() => applyCorrection());
                setTimeout(() => applyCorrection(), 40);
                setTimeout(() => applyCorrection(), 120);
              } catch (err) {
                console.error('Error scheduling inline correction', err);
              }
            }
          }
        } catch (err) {
          console.error('Error reading rect', err);
        }
      }}
      drag={win.sn !== SN.FULL}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={controls}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      onClick={handleClick}
      onContextMenu={(e) => handleWindowContextMenu(e)}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {/* Title bar - compact wrapper around window controls with grab handle */}
      <div className="absolute top-0 right-0 z-10 flex items-center">
        {/* Grab handle padding */}
        <div 
          className={`select-none ${win.ax} text-white w-12 h-10 ${dragCur ? 'cursor-move' : 'cursor-default'}`}
          onPointerDownCapture={handlePointerDown}
          onDoubleClick={handleDoubleClick}
        ></div>
        
        {/* Window controls */}
        <div className={`flex items-center relative ${win.ax} text-white`}>
          {showSpin && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900 text-white border border-white/20 p-3 z-[2100] grid place-items-center w-40 h-20">
              <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white"></div>
            </div>
          )}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setActive(win.id); 
              on("min"); 
            }} 
            className="px-2 py-1 hover:bg-white/10 h-10" 
            title="Minimize"
          >
            <ChevronDown size={16}/>
          </button>
          <button
            onMouseEnter={handleMaxHoverStart}
            onMouseLeave={handleMaxHoverEnd}
            onClick={(e) => { 
              e.stopPropagation(); 
              console.log('[Win.MaxButton] Clicked for window:', win.id, 'windowState:', windowState);
              setActive(win.id); 
              on(windowState.isMaximized ? "unmax" : "max"); 
            }}
            className="px-2 py-1 hover:bg-white/10 h-10"
            title={windowState.isMaximized ? "Restore / Snap" : "Maximize / Snap"}
          >
            {windowState.isMaximized ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActive(win.id); on("close"); }} className="px-2 py-1 hover:bg-white/10 h-10" title="Close"><X size={16}/></button>

          {showSnap && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900 text-white border border-white/20 p-3 grid grid-cols-6 gap-3 z-[2000] w-[360px]"
                 onMouseEnter={handleSnapDialogMouseEnter}
                 onMouseLeave={handleSnapDialogMouseLeave}>
              <SnapCell ariaLabel="Full" onClick={() => on("snap", SN.FULL)} className="col-span-6"><SnapIcon type="full"/></SnapCell>
              <SnapCell ariaLabel="Left" onClick={() => on("snap", SN.LEFT)} className="col-span-3"><SnapIcon type="left"/></SnapCell>
              <SnapCell ariaLabel="Right" onClick={() => on("snap", SN.RIGHT)} className="col-span-3"><SnapIcon type="right"/></SnapCell>
              <SnapCell ariaLabel="Top" onClick={() => on("snap", SN.TOP)} className="col-span-3"><SnapIcon type="top"/></SnapCell>
              <SnapCell ariaLabel="Bottom" onClick={() => on("snap", SN.BOTTOM)} className="col-span-3"><SnapIcon type="bottom"/></SnapCell>
              <div className="col-span-6 grid grid-cols-2 grid-rows-2 gap-2">
                <SnapCell ariaLabel="Top Left" onClick={() => on("snapQuad", 0)}><SnapIcon type="tl"/></SnapCell>
                <SnapCell ariaLabel="Top Right" onClick={() => on("snapQuad", 1)}><SnapIcon type="tr"/></SnapCell>
                <SnapCell ariaLabel="Bottom Left" onClick={() => on("snapQuad", 2)}><SnapIcon type="bl"/></SnapCell>
                <SnapCell ariaLabel="Bottom Right" onClick={() => on("snapQuad", 3)}><SnapIcon type="br"/></SnapCell>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Window content area - full height */}
      <div className="w-full h-full overflow-hidden">
        <div className="w-full h-full overflow-auto">{children}</div>
      </div>
      
      {/* Splash Screen */}
      {showSplash && app && (
        <SplashScreen 
          title={app.title} 
          icon={app.icon} 
          color={app.color} 
          type={app.splashType || 'logo'} 
        />
      )}
      {active && (
        <>
          <ResizeHandle position="n" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="ne" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="e" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="se" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="s" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="sw" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="w" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
          <ResizeHandle position="nw" onResizeStart={handleResizeStart} disabled={win.sn === SN.FULL} />
        </>
      )}

      {/* Window Context Menu */}
      <ContextMenu
        contextMenuState={windowContextMenu}
        onClose={closeWindowMenu}
        onSelectItem={(item) => {
          handleWindowMenuSelect(item);
          handleWindowAction(item);
        }}
      />
    </motion.div>
  );
});