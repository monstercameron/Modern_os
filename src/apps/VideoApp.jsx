import React from "react";
import { AppShell } from "./AppShell.jsx";

export function VideoApp() {
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