import React, { useState, useEffect } from "react";
import eventBus from "../utils/eventBus.js";

export function TerminalApp() {
  const [lines, setLines] = useState(["metro@de:~$ echo 'hello world'","hello world","metro@de:~$"]);
  const [input, setInput] = useState("");

  // Subscribe to About event
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('WINDOW_ABOUT', (data) => {
      // Window manager will handle opening About window
    });
    return unsubscribe;
  }, []);
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