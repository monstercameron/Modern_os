import React from "react";
import { AppShell } from "./AppShell.jsx";

export function EmailApp() {
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