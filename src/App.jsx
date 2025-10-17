import React, { useEffect, useRef, useState } from "react";
import { motion, useDragControls } from "framer-motion";
import {
  AppWindow,
  X,
  Settings as SettingsIcon,
  Globe,
  Terminal,
  Folder,
  Music,
  Video,
  Wifi,
  Battery,
  Volume2,
  Mic,
  FileText,
  Mail,
  MessageSquare,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ---------- constants & helpers ----------
const TB = 48; // taskbar height (top)
const SN = { NONE: "NONE", LEFT: "LEFT", RIGHT: "RIGHT", TOP: "TOP", BOTTOM: "BOTTOM", FULL: "FULL", QUAD: "QUAD" };
const tm = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const uid = (() => { let i = 0; return () => `${++i}-${Math.random().toString(36).slice(2,7)}`; })();

// base floating bounds
const B0 = { x: 120, y: TB + 12, w: 760, h: 500 };

// 2x2 quadrant with gutters
function qb(slot) {
  const pad = 12;
  const mid = 12;
  const availW = window.innerWidth - (pad * 2);
  const availH = window.innerHeight - (TB + pad * 2);
  const qw = (availW - mid) / 2;
  const qh = (availH - mid) / 2;
  const x0 = pad;
  const x1 = pad + qw + mid;
  const y0 = TB + pad;
  const y1 = TB + pad + qh + mid;
  const idx = slot % 4; // TL, TR, BL, BR
  if (idx === 0) return { x: x0, y: y0, w: qw, h: qh };
  if (idx === 1) return { x: x1, y: y0, w: qw, h: qh };
  if (idx === 2) return { x: x0, y: y1, w: qh ? qw : qw, h: qh }; // guard qh
  return { x: x1, y: y1, w: qw, h: qh };
}

function bottomRect() {
  const fullH = window.innerHeight - TB;
  const halfH = fullH / 2;
  const y = TB + halfH; // start at mid
  return { x: 0, y, w: window.innerWidth, h: halfH };
}

function clearBadgeState(badges, id) {
  if (badges && Object.prototype.hasOwnProperty.call(badges, id)) {
    return { ...badges, [id]: 0 };
  }
  return badges;
}

function acc(color) {
  if (color.includes("sky")) return "bg-sky-700";
  if (color.includes("rose")) return "bg-rose-700";
  if (color.includes("amber")) return "bg-amber-700";
  if (color.includes("emerald")) return "bg-emerald-700";
  if (color.includes("indigo")) return "bg-indigo-700";
  if (color.includes("purple")) return "bg-purple-700";
  if (color.includes("teal")) return "bg-teal-700";
  if (color.includes("zinc")) return "bg-zinc-800";
  return "bg-slate-800";
}

// clamp preview X within viewport with 8px gutters
function clampX(x, width) {
  const max = Math.max(0, window.innerWidth - width - 8);
  return Math.max(8, Math.min(x, max));
}

// geometry for halves/quads
const halfRects = () => ({
  LEFT:   { x: 0, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  RIGHT:  { x: window.innerWidth/2, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  TOP:    { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
  BOTTOM: { x: 0, y: TB + (window.innerHeight - TB)/2, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
});
const quadRects = () => [qb(0), qb(1), qb(2), qb(3)];

// overlap helpers
const intersect = (a, b) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  return { x: x1, y: y1, w, h };
};
const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
const overlapRatio = (a, b) => {
  const inter = intersect(a, b);
  const ar = area(a);
  return ar === 0 ? 0 : area(inter) / ar;
};
const chooseBestTarget = (targets, ghost) => {
  let bestOverlap = null, bestR = -1;
  let bestDist = null, bestD = Infinity;
  const cx = ghost.x + ghost.w/2; const cy = ghost.y + ghost.h/2;
  for (const t of targets) {
    const r = overlapRatio(ghost, t.rect);
    if (r > bestR) { bestR = r; bestOverlap = t; }
    const tx = t.rect.x + t.rect.w/2; const ty = t.rect.y + t.rect.h/2;
    const d = Math.hypot(cx - tx, cy - ty);
    if (d < bestD) { bestD = d; bestDist = t; }
  }
  return bestR > 0 ? bestOverlap : bestDist; // prefer overlap, else nearest by center
};
const ghostFromPoint = (w, p) => {
  const nx = Math.max(0, Math.min(p.x - w.b.w/2, window.innerWidth - w.b.w));
  const ny = Math.max(TB, Math.min(p.y - 20, window.innerHeight - w.b.h));
  return { x: nx, y: ny, w: w.b.w, h: w.b.h };
};

// snap targets based on current state
const buildTargetsFor = (w) => {
  const t = [];
  const halves = halfRects();
  if (w.sn === SN.LEFT)  t.push({ id: 'RIGHT', type: 'snap', payload: SN.RIGHT, rect: halves.RIGHT });
  else if (w.sn === SN.RIGHT) t.push({ id: 'LEFT', type: 'snap', payload: SN.LEFT, rect: halves.LEFT });
  else if (w.sn === SN.TOP)  t.push({ id: 'BOTTOM', type: 'snap', payload: SN.BOTTOM, rect: halves.BOTTOM });
  else if (w.sn === SN.BOTTOM) t.push({ id: 'TOP', type: 'snap', payload: SN.TOP, rect: halves.TOP });
  else if (w.sn === SN.QUAD) {
    const qs = quadRects();
    const cx = w.b.x + w.b.w/2, cy = w.b.y + w.b.h/2;
    qs.forEach((r, idx) => {
      const inRect = cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      if (!inRect) t.push({ id: `Q${idx}`, type: 'snapQuad', payload: idx, rect: r });
    });
  } else { // NONE or FULL → halves + all quads
    t.push({ id: 'LEFT', type: 'snap', payload: SN.LEFT, rect: halves.LEFT });
    t.push({ id: 'RIGHT', type: 'snap', payload: SN.RIGHT, rect: halves.RIGHT });
    t.push({ id: 'TOP', type: 'snap', payload: SN.TOP, rect: halves.TOP });
    t.push({ id: 'BOTTOM', type: 'snap', payload: SN.BOTTOM, rect: halves.BOTTOM });
    quadRects().forEach((r, idx) => t.push({ id: `Q${idx}`, type: 'snapQuad', payload: idx, rect: r }));
  }
  return t;
};

function SnapCell({ onClick, className = "", ariaLabel = "", children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`px-3 py-3 bg-white/10 hover:bg-white/20 border border-white/20 grid place-items-center ${className}`}
    >
      {children}
    </button>
  );
}

function SnapIcon({ type }) {
  const W = 48, H = 32;
  const base = "fill='none' stroke='white' stroke-opacity='0.3' stroke-width='2'";
  const hi = "fill='white' fill-opacity='0.35'";
  const rect = (x,y,w,h) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' ${hi}/>`;
  let mark = "";
  if (type === "full")   mark = rect(0,0,W,H);
  if (type === "left")   mark = rect(0,0,W/2,H);
  if (type === "right")  mark = rect(W/2,0,W/2,H);
  if (type === "top")    mark = rect(0,0,W,H/2);
  if (type === "bottom") mark = rect(0,H/2,W,H/2);
  if (type === "tl")     mark = rect(0,0,W/2,H/2);
  if (type === "tr")     mark = rect(W/2,0,W/2,H/2);
  if (type === "bl")     mark = rect(0,H/2,W/2,H/2);
  if (type === "br")     mark = rect(W/2,H/2,W/2,H/2);
  const svg = `
    <svg viewBox='0 0 ${W} ${H}' width='24' height='18' xmlns='http://www.w3.org/2000/svg'>
      <rect x='0' y='0' width='${W}' height='${H}' ${base}/>
      <line x1='${W/2}' y1='0' x2='${W/2}' y2='${H}' ${base}/>
      <line x1='0' y1='${H/2}' x2='${W}' y2='${H/2}' ${base}/>
      ${mark}
    </svg>`;
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Win({ win, on, children, active, setActive }) {
  const controls = useDragControls();
  const [dragCur, setDragCur] = useState(false); // cursor only while pressed
  const [hv, setHv] = useState(false);
  const [showSnap, setShowSnap] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const hoverTimer = useRef(null);

  const borderCls = win.sn === SN.FULL
    ? "border-0"
    : active
      ? "border-4 border-blue-500"
      : hv
        ? "border-2 border-white"
        : "border border-black/20";

  const handleMaxHoverStart = () => {
    clearTimeout(hoverTimer.current);
    setShowSpin(true);
    hoverTimer.current = setTimeout(() => { setShowSpin(false); setShowSnap(true); }, 500);
  };
  const handleMaxHoverEnd = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowSpin(false);
    setShowSnap(false);
  };

  return (
    <motion.div
      className={`absolute bg-white shadow-lg ${borderCls}`}
      style={{ left: win.b.x, top: win.b.y, width: win.b.w, height: win.b.h, zIndex: win.z, willChange: 'transform' }}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      dragControls={controls}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      onDoubleClick={() => on("dbl")}
      onDragStart={() => on("dragStart")}
      onDrag={(e, i) => on("drag", { x: i.point.x, y: i.point.y })}
      onDragEnd={(e, i) => { setDragCur(false); on("dragEnd", { x: i.point.x, y: i.point.y }); }}
    >
      <div
        className={`relative flex items-center justify-between px-3 py-2 select-none ${win.ax} text-white ${dragCur ? 'cursor-move' : 'cursor-default'}`}
        onPointerDownCapture={(e)=>{ if ((e.button ?? 0) !== 0) return; setDragCur(true); controls.start(e); }}
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
          <button onClick={() => on("min")} className="px-2 py-1 hover:bg-white/10" title="Minimize">
            <ChevronDown size={16}/>
          </button>
          <button
            onMouseEnter={handleMaxHoverStart}
            onMouseLeave={handleMaxHoverEnd}
            onClick={() => on(win.sn === SN.FULL ? "unmax" : "max")}
            className="px-2 py-1 hover:bg-white/10"
            title={win.sn === SN.FULL ? "Restore / Snap" : "Maximize / Snap"}
          >
            {win.sn === SN.FULL ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>
          <button onClick={() => on("close")} className="px-2 py-1 hover:bg-white/10" title="Close"><X size={16}/></button>

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
}

// ---------- Desktop Environment ----------
export default function App() {
  const APPS = [
    { id: "terminal", title: "Terminal", color: "bg-zinc-700", icon: Terminal, size: "col-span-1 row-span-1", content: TerminalApp },
    { id: "browser",  title: "Browser",  color: "bg-sky-600",  icon: Globe,    size: "col-span-2 row-span-1", content: BrowserApp },
    { id: "settings", title: "Settings", color: "bg-neutral-700", icon: SettingsIcon, size: "col-span-1 row-span-1", content: SettingsApp },
    { id: "text",     title: "Text",     color: "bg-amber-600", icon: FileText, size: "col-span-1 row-span-2", content: TextApp },
    { id: "voice",    title: "Voice",    color: "bg-rose-600",  icon: Mic,      size: "col-span-1 row-span-1", content: VoiceApp },
    { id: "music",    title: "Music",    color: "bg-purple-600",icon: Music,    size: "col-span-2 row-span-1", content: MusicApp },
    { id: "video",    title: "Video",    color: "bg-teal-600",  icon: Video,    size: "col-span-1 row-span-1", content: VideoApp },
    { id: "files",    title: "Files",    color: "bg-indigo-600",icon: Folder,   size: "col-span-1 row-span-2", content: FilesApp },
    { id: "messages", title: "Messages", color: "bg-cyan-600",  icon: MessageSquare, size: "col-span-1 row-span-1", content: MessagesApp },
    { id: "email",    title: "Email",    color: "bg-red-600",   icon: Mail,          size: "col-span-1 row-span-1", content: EmailApp },
  ];

  const [wns, setW] = useState([]);
  const [clk, setClk] = useState(tm());
  const [actId, setActId] = useState(null);
  const [badges, setBadges] = useState({ messages: 5, email: 3 });
  const [tests, setTests] = useState({ ran: false, pass: true, list: [] });
  const [drag, setDrag] = useState({ activeId: null, targets: [], over: null, candidate: null });
  const dragRAF = useRef(0);
  const dragPtRef = useRef(null);
  const targetsRef = useRef([]);
  const dragOverRef = useRef(null);
  const [tbPrev, setTbPrev] = useState({ id: null, cx: 0 });
  const tbTimer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setClk(tm()), 15000);
    return () => clearInterval(t);
  }, []);

  // smoke + behavior tests
  useEffect(() => {
    const res = [];
    try {
      const r0 = qb(0), r1 = qb(1), r2 = qb(2), r3 = qb(3);
      const positive = [r0, r1, r2, r3].every(r => r.w > 0 && r.h > 0 && r.y >= TB);
      const distinct = new Set([`${r0.x},${r0.y}`, `${r1.x},${r1.y}`, `${r2.x},${r2.y}`, `${r3.x},${r3.y}`]).size === 4;
      res.push({ name: "qb() positive & distinct", ok: positive && distinct });
    } catch (e) { res.push({ name: "qb() threw", ok: false, err: String(e) }); }

    try {
      const b0 = { messages: 2, email: 1 };
      const b1 = clearBadgeState(b0, "messages");
      res.push({ name: "badge clear on open", ok: b1.messages === 0 && b1.email === 1 });
    } catch (e) { res.push({ name: "badge clear threw", ok: false, err: String(e) }); }

    try {
      const top = { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB) / 2 };
      const bottom = bottomRect();
      res.push({ name: "bottom snap geometry", ok: bottom.y > top.y && Math.abs(bottom.w - top.w) < 1 });
    } catch (e) { res.push({ name: "bottom snap threw", ok: false, err: String(e) }); }

    try {
      const prevB = { x: 33, y: TB + 44, w: 420, h: 300 };
      const w = { b: prevB, sn: SN.LEFT, prevB, prevSN: SN.LEFT };
      const restored = { ...w, m: false, sn: w.prevSN ?? SN.NONE, b: w.prevB ?? { ...B0 } };
      res.push({ name: "dbl restore to prev", ok: restored.sn === SN.LEFT && restored.b.x === 33 && !restored.m });
    } catch (e) { res.push({ name: "dbl restore threw", ok: false, err: String(e) }); }

    try {
      const w = { sn: SN.LEFT, b: { x:0,y:TB,w:100,h:100 } };
      const t = buildTargetsFor(w);
      res.push({ name: "drag targets from LEFT", ok: t.length === 1 && t[0].payload === SN.RIGHT });
    } catch (e) { res.push({ name: "drag targets threw", ok: false, err: String(e) }); }

    try {
      const x = clampX(99999, 280);
      res.push({ name: "preview clamp within viewport", ok: x <= (window.innerWidth - 280) });
    } catch (e) { res.push({ name: "preview clamp threw", ok: false, err: String(e) }); }

    try {
      const ghost = { x: window.innerWidth*0.6, y: TB+20, w: 320, h: 240 };
      const best = chooseBestTarget([
        { id:'LEFT', type:'snap', payload:SN.LEFT, rect: halfRects().LEFT },
        { id:'RIGHT', type:'snap', payload:SN.RIGHT, rect: halfRects().RIGHT }
      ], ghost);
      res.push({ name: 'best target selection', ok: best && best.id === 'RIGHT' });
    } catch(e){ res.push({ name: 'best target test threw', ok:false, err:String(e) }); }

    try {
      // rAF schedule/cancel sanity
      const id = requestAnimationFrame(() => {});
      cancelAnimationFrame(id);
      res.push({ name: 'rAF schedule/cancel', ok: true });
    } catch(e){ res.push({ name: 'rAF test threw', ok:false, err:String(e) }); }

    try {
      const ok = typeof StubApp === 'function';
      res.push({ name: 'StubApp exists', ok });
    } catch(e){ res.push({ name: 'StubApp existence threw', ok:false, err:String(e) }); }

    setTests({ ran: true, pass: res.every(r => r.ok), list: res });
  }, []);

  const fz = (id) => setW(ws => ws.map(w => ({ ...w, z: w.id === id ? 1000 : Math.max(1, w.z - 1) })));
  const setActive = (id) => { setActId(id); fz(id); };

  const openA = (app, init = {}) => {
    setBadges(b => clearBadgeState(b, app.id));
    setW(ws => {
      const id = uid();
      const q = qb(ws.length); // snap new window to next quadrant
      setActId(id);
      return [...ws, { id, appId: app.id, t: app.title, icon: app.icon, ax: acc(app.color), b: q, sn: SN.NONE, z: 1000, m: false, init }];
    });
  };

  const act = (id, type, p) => {
    setW(ws => ws.map(w => {
      if (w.id !== id) return w;
      if (type === "close") return null;
      if (type === "min")   return { ...w, m: true };
      if (type === "unmin") return { ...w, m: false, z: 1000 };
      if (type === "max")   return { ...w, prevB: w.b, prevSN: w.sn, sn: SN.FULL, b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } };
      if (type === "unmax") return { ...w, sn: w.prevSN ?? SN.NONE, b: w.prevB ?? { ...B0 } };
      if (type === "snap") {
        if (p === SN.LEFT)   return { ...w, sn: SN.LEFT,   b: { x: 0, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB } };
        if (p === SN.RIGHT)  return { ...w, sn: SN.RIGHT,  b: { x: window.innerWidth/2, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB } };
        if (p === SN.TOP)    return { ...w, sn: SN.TOP,    b: { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB) / 2 } };
        if (p === SN.BOTTOM) return { ...w, sn: SN.BOTTOM, b: bottomRect() };
        if (p === SN.FULL)   return { ...w, sn: SN.FULL,   b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } };
        return w;
      }
      if (type === "snapQuad") {
        return { ...w, sn: SN.QUAD, b: qb(p) };
      }
      if (type === "dbl") {
        if (w.sn === SN.FULL) return { ...w, m: false, sn: w.prevSN ?? SN.NONE, b: w.prevB ?? { ...B0 } };
        return { ...w, prevB: w.b, prevSN: w.sn, sn: SN.FULL, b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } };
      }
      if (type === "prime") {
        const me = ws.find(x => x.id === id) || w;
        const targets = buildTargetsFor(me);
        targetsRef.current = targets;
        setDrag({ activeId: id, targets, over: null, candidate: null });
        return w;
      }
      if (type === "dragStart") {
        const me = ws.find(x => x.id === id) || w;
        const targets = buildTargetsFor(me);
        targetsRef.current = targets;
        setDrag({ activeId: id, targets, over: null, candidate: null });
        return w;
      }
      if (type === "drag") {
        if (drag.activeId !== id) return w;
        const pt = p;
        dragPtRef.current = pt;
        if (!dragRAF.current) {
          dragRAF.current = requestAnimationFrame(() => {
            const cur = dragPtRef.current;
            if (!cur) { dragRAF.current = 0; return; }
            const ghost = ghostFromPoint(w, cur);
            const best = chooseBestTarget(targetsRef.current, ghost);
            const over = best ? best.id : null;
            if (over !== dragOverRef.current) {
              dragOverRef.current = over;
              setDrag(d => (d.activeId === id ? { ...d, over, candidate: over } : d));
            }
            dragRAF.current = 0;
          });
        }
        return w;
      }
      if (type === "dragEnd") {
        if (dragRAF.current) { cancelAnimationFrame(dragRAF.current); dragRAF.current = 0; }
        const targets = drag.targets;
        const ghost = ghostFromPoint(w, p);
        const best = drag.candidate ? targets.find((t) => t.id === drag.candidate) : chooseBestTarget(targets, ghost);
        setDrag({ activeId: null, targets: [], over: null, candidate: null });
        setTimeout(() => setActive(id), 0);
        if (best) {
          if (best.type === 'snap')     { setTimeout(() => act(id, 'snap', best.payload), 0); return w; }
          if (best.type === 'snapQuad') { setTimeout(() => act(id, 'snapQuad', best.payload), 0); return w; }
        }
        // float at ghost
        return { ...w, b: { ...w.b, x: ghost.x, y: ghost.y }, z: 1000 };
      }
      return w;
    }).filter(Boolean));
  };

  const unmin = (id) => act(id, "unmin");

  return (
    <div className="relative w-full h-[100vh] font-sans bg-slate-900 text-slate-900 overflow-hidden">
      {/* Taskbar (TOP) */}
      <div className="absolute top-0 left-0 right-0 h-12 px-3 flex items-center justify-between bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-1 ml-2">
          {wns.map(w => (
            <button
              key={w.id}
              onClick={() => (w.m ? unmin(w.id) : act(w.id, "min"))}
              onMouseEnter={(e)=> { const r = e.currentTarget.getBoundingClientRect(); if (tbTimer.current) { clearTimeout(tbTimer.current); tbTimer.current=null; } setTbPrev({ id: w.id, cx: r.left + r.width/2 }); }}
              onMouseLeave={() => { if (tbTimer.current) clearTimeout(tbTimer.current); tbTimer.current = setTimeout(() => setTbPrev({ id: null, cx: 0 }), 250); }}
              className={`relative px-2 py-1 text-xs ${w.m ? "bg-white/5 opacity-60 italic" : "bg-white/15"} ${w.id===actId ? "ring-2 ring-blue-400" : ""} text-white/90`}
              title={w.m ? "Minimized" : "Active"}
            >
              {w.t}{w.m ? " (min)" : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <Wifi size={18}/>
          <Volume2 size={18}/>
          <Battery size={18}/>
          <div className="text-sm tabular-nums">{clk}</div>
        </div>
      </div>

      {/* Taskbar hover preview (tight to taskbar) */}
      {(() => {
        const w = wns.find(x => x.id === tbPrev.id);
        if (!w) return null;
        const W = 280; const top = TB + 1;
        const left = clampX(tbPrev.cx - W/2, W);
        return (
          <div className="absolute z-[1600]" style={{ left, top }}
               onMouseEnter={()=>{ if (tbTimer.current) { clearTimeout(tbTimer.current); tbTimer.current=null; } setTbPrev(p=>({ ...p })); }}
               onMouseLeave={() => { if (tbTimer.current) clearTimeout(tbTimer.current); tbTimer.current = setTimeout(() => setTbPrev({ id: null, cx: 0 }), 200); }}>
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-0.5 bg-slate-900 text-white border border-white/20 shadow-xl w-[280px]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <div className="text-xs font-semibold truncate pr-2">{w.t}</div>
                <button onClick={() => act(w.id, 'close')} className="text-white/80 hover:text-white">✕</button>
              </div>
              <div className="relative" onClick={() => { if (w.m) unmin(w.id); setActive(w.id); }}>
                <div className="h-[150px] bg-white grid place-items-center text-slate-500 cursor-pointer">
                  <div className="text-xs">Preview</div>
                </div>
                <div className="absolute inset-0 pointer-events-none border-2 border-white/10"></div>
              </div>
              <div className="flex">
                <button onClick={() => (w.m ? unmin(w.id) : setActive(w.id))} className="flex-1 text-xs px-3 py-2 hover:bg-white/10">Open</button>
                <button onClick={() => act(w.id, w.sn === SN.FULL ? 'unmax' : 'max')} className="flex-1 text-xs px-3 py-2 hover:bg-white/10">{w.sn===SN.FULL? 'Restore' : 'Maximize'}</button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Desktop grid */}
      <div className="absolute inset-x-0 top-12 bottom-0 p-4 grid grid-cols-6 auto-rows-[96px] gap-2">
        {APPS.map(app => (
          <Tile key={app.id} app={app} badge={(badges && badges[app.id]) || 0} onOpen={() => openA(app)} onQuick={(init) => openA(app, init)} />
        ))}
      </div>

      {/* Windows */}
      {wns.filter(w => !w.m).map(w => {
        const App = (APPS.find(a => a.id === w.appId)?.content || StubApp);
        return (
          <Win key={w.id} win={w} active={w.id===actId} setActive={setActive} on={(t, p) => act(w.id, t, p)}>
            <div className="w-full h-full bg-white">
              <App init={w.init} />
            </div>
          </Win>
        );
      })}

      {/* drag snap overlay */}
      {drag.activeId && drag.targets.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-12 bottom-0 z-[1500]">
          {drag.targets.map((t) => (
            <div
              key={t.id}
              className={`absolute ${drag.over===t.id ? 'bg-blue-500/20 border-blue-400' : 'bg-white/10 border-white/30'} border-2`}
              style={{ left: t.rect.x, top: t.rect.y, width: t.rect.w, height: t.rect.h }}
            />
          ))}
          {drag.candidate && (() => {
            const c = drag.targets.find((x) => x.id === drag.candidate);
            if (!c) return null;
            return (
              <div className="absolute border-4 border-blue-500/70 bg-blue-400/10"
                   style={{ left: c.rect.x, top: c.rect.y, width: c.rect.w, height: c.rect.h }} />
            );
          })()}
        </div>
      )}

      {/* tests status */}
      <div className={`absolute bottom-1 right-1 px-2 py-1 text-[10px] ${tests.pass ? "bg-emerald-700" : "bg-rose-700"} text-white/90`}>
        tests: {tests.pass ? "pass" : "fail"}
      </div>
    </div>
  );
}

// ---------- Tiles ----------
function Tile({ app, onOpen, onQuick, badge = 0 }) {
  const Icon = app.icon;
  const [hv, setHv] = useState(false);
  const [playing, setPlaying] = useState(false);
  return (
    <motion.button
      onClick={onOpen}
      onHoverStart={() => setHv(true)}
      onHoverEnd={() => setHv(false)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`relative ${app.size} ${app.color} overflow-hidden shadow-md border border-black/20 p-3 flex flex-col justify-between text-left text-white`}
    >
      {badge > 0 && (
        <div className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] leading-[18px] text-center font-semibold">
          {badge}
        </div>
      )}

      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
        initial={{ x: "-120%" }}
        animate={{ x: hv ? "220%" : "-120%" }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {app.id === 'music' ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/30 grid place-items-center text-white/80 text-[10px] font-semibold">ART</div>
          <div className="flex-1">
            <div className="font-semibold">Now Playing</div>
            <div className="text-white/70 text-[11px] truncate">Unknown Artist — Track</div>
          </div>
          <div className="flex items-center gap-2">
            <div onClick={(e)=>{e.stopPropagation(); setPlaying(p=>!p);}} className="px-2 py-1 bg-black/20 border border-white/20 text-[11px] cursor-pointer select-none">
              {playing ? 'Pause' : 'Play'}
            </div>
          </div>
        </div>
      ) : app.id === 'browser' ? (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold flex items-center justify-between">
              <span>{app.title}</span>
              <div
                onClick={(e)=>{ e.stopPropagation(); onQuick && onQuick({ url: 'https://www.msn.com' }); }}
                className="ml-2 px-2 py-1 bg-black/20 border border-white/20 text-[11px] cursor-pointer select-none"
                title="Quick launch MSN"
              >MSN</div>
            </div>
            <div className="text-white/70 text-[11px]">Tile</div>
          </motion.div>
        </>
      ) : app.id === 'text' ? (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold">{app.title}</div>
            <div className="mt-2 p-2 bg-black/15 text-white/80 text-[10px] font-mono leading-snug">last.md — "Notes about the DE mock..."</div>
          </motion.div>
        </>
      ) : (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold">{app.title}</div>
            <div className="text-white/70 text-[11px]">Tile</div>
          </motion.div>
        </>
      )}
    </motion.button>
  );
}

// ---------- Apps ----------
function AppShell({ title, subtitle, actions, children }) {
  return (
    <div className="h-full w-full bg-white">
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function BrowserApp({ init = {} }) {
  const [url, setUrl] = useState(init.url ?? "https://example.lan");
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 bg-slate-50 border-b">
        <button className="px-2 py-1 bg-slate-200">⟵</button>
        <button className="px-2 py-1 bg-slate-200">⟶</button>
        <div className="flex-1 flex items-center gap-2 bg-white border px-3 py-1">
          <Globe size={16} className="text-slate-500"/>
          <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full outline-none"/>
        </div>
        <button className="px-3 py-1 bg-slate-900 text-white">Go</button>
      </div>
      <div className="flex-1 bg-white grid place-items-center">
        <div className="text-center text-slate-500">
          <div className="text-xl font-semibold mb-1">Mock Browser</div>
          <div>Rendering <span className="font-mono">{url}</span></div>
        </div>
      </div>
    </div>
  );
}

function TextApp() {
  const [value, setValue] = useState(`# Notes\n\nThis is a flat, sharp-corner text editor mock.\n\n- Markdown-ish\n- Autosave (mock)\n- Tabs (future)\n`);
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-slate-50 text-sm">Text Editor</div>
      <textarea value={value} onChange={(e)=>setValue(e.target.value)} className="flex-1 p-3 font-mono text-sm outline-none"/>
    </div>
  );
}

function VoiceApp() {
  return (
    <AppShell title="Voice" subtitle="Record & transcribe" actions={<button className="px-3 py-1 border">Record</button>}>
      <div className="text-slate-600 text-sm">Input, waveform, and transcription list will go here.</div>
    </AppShell>
  );
}

function FilesApp() {
  return (
    <div className="h-full grid grid-cols-12">
      <div className="col-span-3 border-r p-3 space-y-1">
        {["Home","Documents","Downloads","Pictures","Music","Videos","Drive"].map(f => (
          <div key={f} className="px-3 py-2 hover:bg-slate-100 flex items-center gap-2">
            <Folder size={16}/><span>{f}</span>
          </div>
        ))}
      </div>
      <div className="col-span-9 p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {Array.from({length:9}).map((_,i) => (
          <div key={i} className="aspect-video border p-3 hover:bg-slate-50">
            <div className="text-sm font-medium">Item {i+1}</div>
            <div className="text-xs text-slate-500">Type • Modified just now</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MusicApp() {
  return (
    <AppShell title="Music" subtitle="Playlists & albums" actions={<button className="px-3 py-1 bg-slate-900 text-white">Play</button>}>
      <div className="space-y-2">
        {Array.from({length:6}).map((_,i) => (
          <div key={i} className="p-3 border flex items-center justify-between">
            <div>
              <div className="font-medium">Playlist {i+1}</div>
              <div className="text-xs text-slate-500">25 tracks • 1h 32m</div>
            </div>
            <button className="px-3 py-1 border">Open</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function VideoApp() {
  return (
    <AppShell title="Videos" subtitle="Watch & manage">
      <div className="grid md:grid-cols-2 gap-2">
        {Array.from({length:4}).map((_,i) => (
          <div key={i} className="aspect-video border grid place-items-center text-slate-500">Video {i+1}</div>
        ))}
      </div>
    </AppShell>
  );
}

function MessagesApp() {
  return (
    <AppShell title="Messages" subtitle="Recent chats" actions={<button className="px-3 py-1 border">New</button>}>
      <div className="space-y-2">
        {Array.from({length:6}).map((_,i)=> (
          <div key={i} className="p-3 border flex items-center justify-between">
            <div>
              <div className="font-medium">Contact {i+1}</div>
              <div className="text-xs text-slate-500">Last message • just now</div>
            </div>
            <button className="px-3 py-1 border">Open</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function EmailApp() {
  return (
    <AppShell title="Email" subtitle="Inbox" actions={<>
      <button className="px-3 py-1 border">Compose</button>
    </>}>
      <div className="grid grid-cols-12">
        <div className="col-span-3 border-r p-2 space-y-1">
          {['Inbox','Starred','Sent','Drafts','Spam'].map(f => (
            <div key={f} className="px-2 py-1 hover:bg-slate-100">{f}</div>
          ))}
        </div>
        <div className="col-span-9 p-2 space-y-2">
          {Array.from({length:7}).map((_,i)=> (
            <div key={i} className="p-2 border">
              <div className="font-medium">Welcome to Metro Mail</div>
              <div className="text-xs text-slate-500">Preview • just now</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function TerminalApp() {
  const [lines, setLines] = useState(["metro@de:~$ echo 'hello world'","hello world","metro@de:~$"]);
  const [input, setInput] = useState("");
  return (
    <div className="h-full w-full bg-black text-green-400 font-mono text-sm p-3">
      {lines.map((l,i)=> <div key={i}>{l}</div>)}
      <div className="flex items-center gap-2 mt-2">
        <span>metro@de:~$</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setLines(ls=>[...ls, input, "metro@de:~$"]); setInput(""); } }} className="bg-transparent outline-none flex-1"/>
      </div>
    </div>
  );
}

function SettingsApp() {
  return (
    <div className="h-full grid grid-cols-12">
      <div className="col-span-4 border-r p-4 space-y-1">
        {["System","Display","Network","Sound","Personalization","Apps","Privacy"].map(s => (
          <div key={s} className="px-3 py-2 hover:bg-slate-100 flex items-center justify-between">
            <span>{s}</span>
            <span className="text-slate-400">›</span>
          </div>
        ))}
      </div>
      <div className="col-span-8 p-4">
        <div className="text-slate-600">Pick a category on the left.</div>
      </div>
    </div>
  );
}

function StubApp() {
  return <div className="p-6 text-center text-slate-500">App surface</div>;
}
