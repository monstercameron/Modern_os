import React from "react";

export function AppShell({ title, subtitle, actions, children }) {
  return (
    <div className="h-full w-full bg-white">
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <div>
          <div className="text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}