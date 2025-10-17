import React, { useRef, useState, useCallback, useMemo, memo } from "react";
import { motion, useDragControls } from "framer-motion";
import { AppWindow, X, Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { TB, SN } from "../utils/constants.js";
import { SnapCell, SnapIcon } from "./SnapComponents.jsx";

export const Win = memo(function Win({ win, on, children, active, setActive }) {
  const controls = useDragControls();
  const [dragCur, setDragCur] = useState(false); // cursor only while pressed
  const [hv, setHv] = useState(false);
  const [showSnap, setShowSnap] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const hoverTimer = useRef(null);

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

  const transitionStyle = dragCur ? 'none' : 'left 100ms ease, top 100ms ease, width 100ms ease, height 100ms ease';

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
  const motionStyle = useMemo(() => ({
    left: win.b.x,
    top: win.b.y,
    width: win.b.w,
    height: win.b.h,
    zIndex: win.z,
    willChange: 'transform',
    transition: transitionStyle,
    boxSizing: 'border-box',
    ...borderStyle
  }), [win.b.x, win.b.y, win.b.w, win.b.h, win.z, transitionStyle, borderStyle]);

  return (
    <motion.div
      className={`absolute bg-white ${shadowCls} ${borderCls}`}
      style={motionStyle}
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
    </motion.div>
  );
});