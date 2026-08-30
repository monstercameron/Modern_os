import { TB } from './constants.js';

// 2x2 quadrant with gutters
export function qb(slot, view) {
  const pad = 0; // No padding - quadrants should span edge to edge
  const mid = 12; // Gutter between quads
  const availW = view.w - (pad * 2);
  const availH = view.h - (TB + pad * 2);
  const qw = (availW - mid) / 2;
  const qh = (availH - mid) / 2;
  const x0 = pad;
  const x1 = pad + qw + mid;
  const y0 = TB + pad; // Start right after taskbar, no additional padding
  const y1 = TB + pad + qh + mid;
  const idx = slot % 4; // TL, TR, BL, BR
  if (idx === 0) return { x: x0, y: y0, w: qw, h: qh };
  if (idx === 1) return { x: x1, y: y0, w: qw, h: qh };
  if (idx === 2) return { x: x0, y: y1, w: qh ? qw : qw, h: qh }; // guard qh
  return { x: x1, y: y1, w: qw, h: qh };
}

export function bottomRect(view) {
  const fullH = view.h - TB;
  const halfH = fullH / 2;
  const y = TB + halfH; // start at mid
  return { x: 0, y, w: view.w, h: halfH };
}

// geometry for halves/quads
export const halfRects = (view) => ({
  LEFT:   { x: 0, y: TB, w: view.w/2, h: view.h - TB },
  RIGHT:  { x: view.w/2, y: TB, w: view.w/2, h: view.h - TB },
  TOP:    { x: 0, y: TB, w: view.w, h: (view.h - TB)/2 },
  BOTTOM: { x: 0, y: TB + (view.h - TB)/2, w: view.w, h: (view.h - TB)/2 },
});

export const quadRects = (view) => [qb(0, view), qb(1, view), qb(2, view), qb(3, view)];

export const ghostFromPoint = (w, p, view) => {
  const nx = Math.max(0, Math.min(p.x - w.b.w/2, view.w - w.b.w));
  const ny = Math.max(TB, Math.min(p.y - 20, view.h - w.b.h));
  return { x: nx, y: ny, w: w.b.w, h: w.b.h };
};
