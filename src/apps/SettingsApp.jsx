import React from "react";

export function SettingsApp() {
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