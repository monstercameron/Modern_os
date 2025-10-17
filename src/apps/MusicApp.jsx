import React from "react";
import { AppShell } from "./AppShell.jsx";

export function MusicApp() {
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