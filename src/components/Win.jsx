import React, { useRef, useState, useCallback, useMemo, memo, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { AppWindow, X, Maximize2, Minimize2, ChevronDown, LayoutGrid, Move } from "lucide-react";
import { TB, SN } from "../utils/constants.js";
import { SnapCell, SnapIcon } from "./SnapComponents.jsx";
import { useMotion } from "../hooks/useMotion.js";
import { ContextMenu } from "./ContextMenu.jsx";
import { AboutDialog } from "./AboutDialog.jsx";
import { useWindowState } from "../hooks/useWindowState.js";
import { useContextMenu } from "../hooks/useContextMenu.js";
import { CONTEXT_TYPES, MENU_ACTIONS } from "../utils/contextMenuStateMachine.js";
import eventBus, { TOPICS } from "../utils/eventBus.js";
import { useKernel, select } from "../kernel/index.js";

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
  const [showAbout, setShowAbout] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const hoverTimer = useRef(null);
  const resizeStartPos = useRef(null);
  const resizeStartBounds = useRef(null);
  
  const [animatingFromTile, setAnimatingFromTile] = useState(!!win.tilePosition);

  /*
   * Loading face.
   *
   * A window opens face down on the tile that launched it and turns over as it
   * travels to its bounds — that rotation is the reveal. While it is still
   * turning, this overlay covers the content with the app's icon, so the first
   * half of the flip reads as "loading" rather than as mirrored text. It fades
   * out as the window lands.
   */
  const [loading, setLoading] = useState(true);
  const loadingMotion = useMotion();
  const flipEnabled = loadingMotion.allows('windowTransitions');
  const AppIcon = app?.icon || win.icon;

  // Both the wait and the turn scale with the theme's animation speed.
  const flipMs = Math.round(560 * loadingMotion.speed) || 0;
  const holdMs = flipEnabled ? Math.round(420 * loadingMotion.speed) : 0;

  useEffect(() => {
    const toReady = setTimeout(() => setLoading(false), holdMs);
    return () => clearTimeout(toReady);
  }, [holdMs]);
  
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
      case MENU_ACTIONS.ABOUT:
        setShowAbout(true);
        break;
      default:
        break;
    }
  }, [win, on]);
  
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
        return data.winId === win.id;
      },
      (data) => {
        const { action } = data;
        
        // Execute the action via the window's action handler
        if (action === 'activate') {
          setActive(win.id);
        } else if (action === 'min') {
          on('min');
        } else if (action === 'unmin') {
          on('unmin');
        } else if (action === 'max') {
          on('max');
        } else if (action === 'unmax') {
          on('unmax');
        } else if (action === 'close') {
          on('close');
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [win.id, on, setActive]);
  
  // Use state machine to understand window state
  const windowState = useWindowState(win);

  // Focus-follows-mouse, a desktop-wide preference.
  const focusFollowsMouse = useKernel(select.focusFollowsMouse);
  
  // Min/max size constraints
  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 150;

  // Border width comes from the theme. The focused window uses the thicker
  // focus width, which the engine only widens when the base border is more
  // than a hairline — at 1px the accent colour carries the emphasis instead.
  const borderCls = "";

  const shadowCls = "";

  const borderStyle = win.sn === SN.FULL
    ? { borderWidth: 0 }
    : {
        borderStyle: 'solid',
        borderWidth: active
          ? 'var(--theme-border-width-focus)'
          : 'var(--theme-border-width)',
        borderColor: active
          ? 'var(--theme-accent)'
          : hv
            ? 'var(--theme-text-muted)'
            : 'var(--theme-border)',
      };

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
    // IMPORTANT: Don't start drag if clicking on a button
    // This prevents dragCur from being set to true, which would disable
    // window animations (including maximize/minimize). When dragCur is true,
    // animateValue becomes undefined and Framer Motion stops animating.
    if (e.target.closest('button')) return;
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
    backgroundColor: 'var(--theme-surface)',
    ...borderStyle
  }), [win.z, borderStyle]);

  /*
   * The window turns over as it opens: it starts on the tile that launched it,
   * face down, showing that app's icon while it loads. When the app is ready
   * the window travels to its bounds and rotates to face the viewer, which is
   * the moment its content appears.
   *
   * This is one animation on one element. An earlier attempt put a second
   * flipping card inside the window; the two rotations fought over the same
   * axis and could stall part-way, leaving windows mirrored or stuck at tile
   * size.
   */
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
        rotateY: 180,
      };
    }
    return null;
  }, [win.tilePosition, animatingFromTile]);

  /*
   * `scale` is deliberately constant.
   *
   * A focus-emphasis scale (1 -> 1.006) was tried here and broke the opening
   * animation: that tiny distance finishes in a frame or two, onAnimationComplete
   * fires for the whole element, animatingFromTile flips, the transition prop
   * swaps mid-flight and the entrance stalls — leaving windows frozen at tile
   * size, still rotated. Focus is signalled by the accent border instead, which
   * the theme already scales through --theme-border-width-focus.
   */
  const animateStyle = useMemo(() => ({
    x: 0,
    y: 0,
    left: win.b.x,
    top: win.b.y,
    width: win.b.w,
    height: win.b.h,
    scale: 1,
    rotateY: 0,
  }), [win.b.x, win.b.y, win.b.w, win.b.h, win.id, win.sn]);

  const divRef = useRef(null);

  // CRITICAL: animateValue controls Framer Motion animation
  // When dragCur is true, animateValue is undefined which disables animation.
  // This allows manual dragging without animation interference.
  // When dragCur is false, animateValue uses animateStyle which enables
  // smooth spring animations for maximize, minimize, snap, etc.
  // DO NOT modify this logic without testing all window resize operations.
  const animateValue = dragCur ? undefined : animateStyle;

  return (
    <motion.div
      ref={divRef}
      className={`absolute ${shadowCls} ${borderCls}`}
      style={baseStyle}
      data-window
      data-window-id={win.id}
      data-focused={active ? 'true' : 'false'}
      data-floating={win.floating ? 'true' : 'false'}
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
      drag={win.floating && win.sn !== SN.FULL}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={controls}
      onMouseEnter={() => {
        setHv(true);
        // Focus follows the mouse, the way a tiling desktop behaves. Skipped
        // while a drag or resize is in flight so passing under another window
        // does not steal focus mid-gesture.
        if (focusFollowsMouse && !active && !resizing) setActive(win.id);
      }}
      onMouseLeave={() => setHv(false)}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {/* Title bar - full width with controls on right */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex items-center h-10"
        onContextMenu={(e) => handleWindowContextMenu(e)}
      >
        {/* Center grab handle */}
        <div 
          className={`select-none flex-1 h-10 ${dragCur ? 'cursor-move' : 'cursor-default'}`}
        ></div>
        
        {/* Window controls on right - includes icon and buttons */}
        <div 
          className={`flex items-center relative ${win.ax} text-white h-10 ${dragCur ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDownCapture={handlePointerDown}
          onDoubleClick={handleDoubleClick}
        >
          {/* App icon/logo */}
          <div className="flex items-center justify-center w-10 h-10">
            {app && app.icon ? (
              typeof app.icon === 'string' ? (
                <span className="text-lg">{app.icon}</span>
              ) : (
                <app.icon size={16} />
              )
            ) : (
              <span className="text-lg">□</span>
            )}
          </div>
          {showSpin && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900 text-white border border-white/20 p-3 z-[2100] grid place-items-center w-40 h-20">
              <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white"></div>
            </div>
          )}
          {/*
            Tiled windows carry a single control — the toggle out to floating.
            Everything else about a tiled window is the layout's business, and
            close/minimize stay reachable from the taskbar and the keymap.
            Floating windows get the full set, plus the toggle back into tiling.
          */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActive(win.id);
              on("toggleFloat");
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="px-2 py-1 hover:bg-white/10 h-10 cursor-pointer"
            data-window-action="toggle-float"
            title={win.floating ? "Return to tiling" : "Float this window"}
          >
            {win.floating ? <LayoutGrid size={16}/> : <Move size={16}/>}
          </button>

          {win.floating && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(win.id);
                  on("min");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="px-2 py-1 hover:bg-white/10 h-10 cursor-pointer"
                title="Minimize"
              >
                <ChevronDown size={16}/>
              </button>
              <button
                onMouseEnter={handleMaxHoverStart}
                onMouseLeave={handleMaxHoverEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(win.id);
                  on(windowState.isMaximized ? "unmax" : "max");
                }}
                // IMPORTANT: These event handlers prevent the parent's drag/doubleclick
                // from interfering with maximize button functionality
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="px-2 py-1 hover:bg-white/10 h-10 cursor-pointer"
                title={windowState.isMaximized ? "Restore / Snap" : "Maximize / Snap"}
              >
                {windowState.isMaximized ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(win.id);
                  on("close");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="px-2 py-1 hover:bg-white/10 h-10 cursor-pointer"
                title="Close"
              >
                <X size={16}/>
              </button>
            </>
          )}

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
      
      {/*
        Window content, presented as a card that turns over.

        While the app is loading the window shows its icon on a tile-coloured
        face; once it is ready the card flips on the Y axis to reveal the
        content behind it. Both faces are mounted the whole time and hidden by
        backface-visibility, so the app has already rendered by the time it
        comes into view and there is no second pop of layout.
      */}
      <div className="w-full h-full overflow-hidden relative">
        <div className="w-full h-full overflow-auto">{children}</div>

        {/* The loading face: the app's icon, shown on the tile-coloured window
            while it is face down. It is removed as the window turns over. */}
        {loading && (
          <motion.div
            className="absolute inset-0 grid place-items-center z-10"
            style={{ backgroundColor: 'var(--theme-surface)' }}
            data-window-loading
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Counter-flipped, because the window itself is face down while
                this is on screen. */}
            <div className="flex flex-col items-center gap-3" style={{ transform: 'scaleX(-1)' }}>
              <motion.div
                className={`grid place-items-center ${app?.color || 'bg-slate-700'}`}
                style={{ width: 56, height: 56, borderRadius: 'var(--theme-radius)' }}
                animate={flipEnabled ? { scale: [1, 1.07, 1] } : undefined}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              >
                {AppIcon ? <AppIcon size={26} color="#fff" /> : null}
              </motion.div>
              <div className="text-[12px] font-medium" style={{ color: 'var(--theme-text)' }}>{win.t}</div>
            </div>
          </motion.div>
        )}
      </div>

      {active && (
        <>
          <ResizeHandle position="n" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="ne" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="e" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="se" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="s" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="sw" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="w" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
          <ResizeHandle position="nw" onResizeStart={handleResizeStart} disabled={!win.floating || win.sn === SN.FULL} />
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

      {/* About Dialog */}
      {showAbout && app && (
        <AboutDialog
          appTitle={app.title}
          appIcon={app.icon}
          onClose={() => setShowAbout(false)}
        />
      )}
    </motion.div>
  );
});