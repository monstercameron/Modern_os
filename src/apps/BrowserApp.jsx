import React, { useState } from "react";
import { Globe } from "lucide-react";

export function BrowserApp({ init = {} }) {
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