import React from "react";
import { AppShell } from "./AppShell.jsx";

export function MessagesApp() {
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