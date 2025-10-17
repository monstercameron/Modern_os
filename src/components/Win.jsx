import React, { useRef, useState, useCallback, useMemo, memo, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { AppWindow, X, Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { TB, SN } from "../utils/constants.js";
import { SnapCell, SnapIcon } from "./SnapComponents.jsx";
import { SplashScreen } from "./SplashScreen.jsx";

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

export const Win = memo(function Win({ win, on, children, active, setActive }) {
  const controls = useDragControls();
  const [dragCur, setDragCur] = useState(false); // cursor only while pressed
  const [hv, setHv] = useState(false);
  const [showSnap, setShowSnap] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const hoverTimer = useRef(null);
  
  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [animatingFromTile, setAnimatingFromTile] = useState(!!win.tilePosition);
  
  // Resize state
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartBounds = useRef({ x: 0, y: 0, w: 0, h: 0 });
  
  // Min/max size constraints
  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 150;
  
  // Hide splash screen after minimum 100ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    hoverTimer.current = setTimeout(() => { setShowSpin(false); setShowSnap(true); }, 500);
  }, []);
  
  const handleMaxHoverEnd = useCallback(() => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowSpin(false);
    setShowSnap(false);
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
    on("dbl");
  }, [active, setActive, win.id, on]);

  // Memoize style objects
  const baseStyle = useMemo(() => ({
    zIndex: win.z,
    willChange: 'transform',
    boxSizing: 'border-box',
    ...borderStyle
  }), [win.z, borderStyle]);

  // Initial position for tile flip animation
  const initialPosition = useMemo(() => {
    if (win.tilePosition && animatingFromTile) {
      return {
        left: win.tilePosition.x,
        top: win.tilePosition.y,
        width: win.tilePosition.w,
        height: win.tilePosition.h,
        scale: 1,
        rotateY: 0
      };
    }
    return null;
  }, [win.tilePosition, animatingFromTile]);

  const animateStyle = useMemo(() => ({
    left: win.b.x,
    top: win.b.y,
    width: win.b.w,
    height: win.b.h,
    scale: 1,
    rotateY: 0
  }), [win.b.x, win.b.y, win.b.w, win.b.h]);

  return (
    <motion.div
      className={`absolute bg-white ${shadowCls} ${borderCls}`}
      style={baseStyle}
      initial={initialPosition || animateStyle}
      animate={dragCur ? undefined : animateStyle}
      transition={dragCur ? undefined : (animatingFromTile ? { 
        type: 'spring', 
        stiffness: 350, 
        damping: 28, 
        mass: 0.9 
      } : springConfig)}
      onAnimationComplete={() => setAnimatingFromTile(false)}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={controls}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`relative flex items-center justify-between px-3 py-2 select-none ${win.ax} text-white ${dragCur ? 'cursor-move' : 'cursor-default'}`}
        onPointerDownCapture={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="text-sm font-semibold flex items-center gap-2">
          {win.icon ? <win.icon size={16} className="opacity-90"/> : <AppWindow size={16}/>} {win.t}
        </div>
        <div className="flex items-center relative">
          {showSpin && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900 text-white border border-white/20 p-3 z-[2100] grid place-items-center w-40 h-20">
              <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white"></div>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); setActive(win.id); on("min"); }} className="px-2 py-1 hover:bg-white/10" title="Minimize">
            <ChevronDown size={16}/>
          </button>
          <button
            onMouseEnter={handleMaxHoverStart}
            onMouseLeave={handleMaxHoverEnd}
            onClick={(e) => { e.stopPropagation(); setActive(win.id); on(win.sn === SN.FULL ? "unmax" : "max"); }}
            className="px-2 py-1 hover:bg-white/10"
            title={win.sn === SN.FULL ? "Restore / Snap" : "Maximize / Snap"}
          >
            {win.sn === SN.FULL ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActive(win.id); on("close"); }} className="px-2 py-1 hover:bg-white/10" title="Close"><X size={16}/></button>

          {showSnap && (
            <div className="absolute top-full right-0 mt-1 bg-slate-900 text-white border border-white/20 p-3 grid grid-cols-6 gap-3 z-[2000] w-[360px]"
                 onMouseEnter={() => setShowSnap(true)} onMouseLeave={() => setShowSnap(false)}>
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
      <div className="w-full h-[calc(100%-40px)] overflow-hidden">
        <div className="w-full h-full overflow-auto">{children}</div>
      </div>
      
      {/* Resize handles - 8 directions */}
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
    </motion.div>
  );
});