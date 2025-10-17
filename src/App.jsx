import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
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
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import {
  TB,
  SN,
  tm,
  uid,
  B0,
  qb,
  bottomRect,
  clearBadgeState,
  acc,
  clampX,
  buildTargetsFor,
  chooseBestTarget,
  ghostFromPoint,
} from "./utils/constants.js";
import { Win } from "./components/Win.jsx";
import { Tile } from "./components/Tile.jsx";
import { BrowserApp } from "./apps/BrowserApp.jsx";
import { TextApp } from "./apps/TextApp.jsx";
import { VoiceApp } from "./apps/VoiceApp.jsx";
import { FilesApp } from "./apps/FilesApp.jsx";
import { MusicApp } from "./apps/MusicApp.jsx";
import { VideoApp } from "./apps/VideoApp.jsx";
import { MessagesApp } from "./apps/MessagesApp.jsx";
import { EmailApp } from "./apps/EmailApp.jsx";
import { TerminalApp } from "./apps/TerminalApp.jsx";
import { SettingsApp } from "./apps/SettingsApp.jsx";
import { StubApp } from "./apps/StubApp.jsx";

// ---------- Desktop Environment ----------

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

  // Ensure there's always an active window
  useEffect(() => {
    const visibleWindows = wns.filter(w => !w.m);
    
    if (visibleWindows.length === 0) {
      // No visible windows - clear active window
      setActId(null);
    } else {
      const activeWindowExists = visibleWindows.some(w => w.id === actId);
      if (!activeWindowExists) {
        // Find the window with highest z-index (most recently interacted)
        const highestZWindow = visibleWindows.reduce((highest, current) => 
          current.z > highest.z ? current : highest
        );
        setActive(highestZWindow.id);
      }
    }
  }, [wns, actId]);

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

  const fz = (id) => setW(ws => {
    const maxZ = Math.max(...ws.map(w => w.z), 999);
    return ws.map(w => ({ ...w, z: w.id === id ? maxZ + 1 : w.z }));
  });
  const setActive = (id) => { 
    console.log('Active window changed to:', id);
    setActId(id); 
    fz(id); 
  };

  const openA = (app, init = {}) => {
    setBadges(b => clearBadgeState(b, app.id));
    const id = uid();
    const q = qb(wns.length); // snap new window to next quadrant
    setW(ws => [...ws, { id, appId: app.id, t: app.title, icon: app.icon, ax: acc(app.color), b: q, sn: SN.NONE, z: 1000, m: false, init }]);
    setActive(id); // Set new window as active
  };

  const act = (id, type, p) => {
    setW(ws => ws.map(w => {
      if (w.id !== id) return w;
      if (type === "close") return null;
      if (type === "min")   return { ...w, m: true };
      if (type === "unmin") return { ...w, m: false };
      if (type === "max")   return { ...w, prevB: w.b, prevSN: w.sn, sn: SN.FULL, b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } };
      if (type === "unmax") return { ...w, sn: w.prevSN ?? SN.NONE, b: w.prevB ?? { ...B0 } };
      if (type === "snap") {
        setActive(id);
        if (p === SN.LEFT)   return { ...w, sn: SN.LEFT,   b: { x: 0, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB } };
        if (p === SN.RIGHT)  return { ...w, sn: SN.RIGHT,  b: { x: window.innerWidth/2, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB } };
        if (p === SN.TOP)    return { ...w, sn: SN.TOP,    b: { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB) / 2 } };
        if (p === SN.BOTTOM) return { ...w, sn: SN.BOTTOM, b: bottomRect() };
        if (p === SN.FULL)   return { ...w, sn: SN.FULL,   b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } };
        return w;
      }
      if (type === "snapQuad") {
        setActive(id);
        return { ...w, sn: SN.QUAD, b: qb(p) };
      }
      if (type === "dbl") {
        setActive(id);
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
    <div className="relative w-full h-[100vh] font-sans text-slate-900 overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Taskbar (TOP) */}
      <div className="absolute top-0 left-0 right-0 h-10 px-3 flex items-center justify-between border-b" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-1 ml-2">
          {wns.map(w => (
            <button
              key={w.id}
              onClick={() => {
                if (w.m) {
                  // Window is minimized - unminimize and activate
                  unmin(w.id);
                  setActive(w.id);
                } else if (w.id === actId) {
                  // Window is active and not minimized - minimize it
                  act(w.id, "min");
                } else {
                  // Window is not minimized but not active - make it active
                  setActive(w.id);
                }
              }}
              onMouseEnter={(e)=> { const r = e.currentTarget.getBoundingClientRect(); if (tbTimer.current) { clearTimeout(tbTimer.current); tbTimer.current=null; } setTbPrev({ id: w.id, cx: r.left + r.width/2 }); }}
              onMouseLeave={() => { if (tbTimer.current) clearTimeout(tbTimer.current); tbTimer.current = setTimeout(() => setTbPrev({ id: null, cx: 0 }), 250); }}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                w.m 
                  ? "bg-slate-600/40 border-slate-500/50 text-slate-300 italic" 
                  : w.id === actId 
                    ? "border-blue-400 text-white shadow-lg ring-2 ring-blue-300/50" 
                    : "border-white/20 text-white/90 hover:bg-white/15"
              }`}
              style={{
                backgroundColor: w.m 
                  ? 'rgba(100, 116, 139, 0.4)' // slate-600/40
                  : w.id === actId 
                    ? 'var(--theme-accent)' 
                    : 'rgba(255, 255, 255, 0.1)', // white/10
                borderColor: w.m 
                  ? 'rgba(100, 116, 139, 0.5)' // slate-500/50
                  : w.id === actId 
                    ? 'var(--theme-accent)' 
                    : 'rgba(255, 255, 255, 0.2)', // white/20
                color: w.m 
                  ? 'rgb(203, 213, 225)' // slate-300
                  : w.id === actId 
                    ? 'var(--theme-text)' 
                    : 'rgba(255, 255, 255, 0.9)' // white/90
              }}
              title={w.m ? "Minimized - Click to restore" : w.id === actId ? "Active window - Click to minimize" : "Inactive window - Click to activate"}
            >
              {w.t}
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
              className="mt-0.5 border shadow-lg w-[280px]"
              style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="text-xs font-semibold truncate pr-2">{w.t}</div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      if (w.m) {
                        unmin(w.id);
                        setActive(w.id);
                      } else if (w.id === actId) {
                        act(w.id, "min");
                      } else {
                        setActive(w.id);
                      }
                      setTbPrev({ id: null, cx: 0 });
                    }} 
                    className="px-2 py-1 hover:bg-white/10" 
                    title={w.m ? "Unminimize" : w.id === actId ? "Minimize" : "Activate"}
                  >
                    <ChevronDown size={16}/>
                  </button>
                  <button 
                    onClick={() => { 
                      setActive(w.id); 
                      act(w.id, w.sn === SN.FULL ? 'unmax' : 'max'); 
                      setTbPrev({ id: null, cx: 0 });
                    }} 
                    className="px-2 py-1 hover:bg-white/10" 
                    title={w.sn === SN.FULL ? "Restore" : "Maximize"}
                  >
                    {w.sn === SN.FULL ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                  </button>
                  <button onClick={() => { act(w.id, 'close'); setTbPrev({ id: null, cx: 0 }); }} className="px-2 py-1 hover:bg-white/10" title="Close">
                    <X size={16}/>
                  </button>
                </div>
              </div>
              <div className="relative" onClick={() => { if (w.m) unmin(w.id); setActive(w.id); setTbPrev({ id: null, cx: 0 }); }}>
                <div className="h-[150px] bg-white grid place-items-center text-slate-500 cursor-pointer">
                  <div className="text-xs">Preview</div>
                </div>
                <div className="absolute inset-0 pointer-events-none border-2 border-white/10"></div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Desktop grid */}
      <div className="absolute inset-x-0 top-10 bottom-0 p-4 grid grid-cols-6 auto-rows-[96px] gap-2">
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
        <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 z-[1500]">
          {drag.targets.map((t) => (
            <div
              key={t.id}
              className={`absolute border-2`}
              style={{
                left: t.rect.x, top: t.rect.y, width: t.rect.w, height: t.rect.h,
                backgroundColor: drag.over===t.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                borderColor: drag.over===t.id ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.3)'
              }}
            />
          ))}
          {drag.candidate && (() => {
            const c = drag.targets.find((x) => x.id === drag.candidate);
            if (!c) return null;
            return (
              <div className="absolute border-4"
                   style={{
                     left: c.rect.x, top: c.rect.y, width: c.rect.w, height: c.rect.h,
                     borderColor: 'rgba(59, 130, 246, 0.7)',
                     backgroundColor: 'rgba(59, 130, 246, 0.1)'
                   }} />
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


