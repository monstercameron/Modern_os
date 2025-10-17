// ---------- Core Constants ----------
export const TB = 40; // taskbar height (top)
export const SN = { NONE: "NONE", LEFT: "LEFT", RIGHT: "RIGHT", TOP: "TOP", BOTTOM: "BOTTOM", FULL: "FULL", QUAD: "QUAD" };
export const tm = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const uid = (() => { let i = 0; return () => `${++i}-${Math.random().toString(36).slice(2,7)}`; })();

// base floating bounds
export const B0 = { x: 120, y: TB + 12, w: 760, h: 500 };

// clamp preview X within viewport with 8px gutters
export function clampX(x, width) {
  const max = Math.max(0, window.innerWidth - width - 8);
  return Math.max(8, Math.min(x, max));
}