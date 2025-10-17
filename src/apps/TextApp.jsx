import React, { useState } from "react";

export function TextApp() {
  const [value, setValue] = useState(`# Notes\n\nThis is a flat, sharp-corner text editor mock.\n\n- Markdown-ish\n- Autosave (mock)\n- Tabs (future)\n`);
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-slate-50 text-sm">Text Editor</div>
      <textarea value={value} onChange={(e)=>setValue(e.target.value)} className="flex-1 p-3 font-mono text-sm outline-none"/>
    </div>
  );
}