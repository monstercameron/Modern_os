import React from "react";
import { Folder } from "lucide-react";

export function FilesApp() {
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