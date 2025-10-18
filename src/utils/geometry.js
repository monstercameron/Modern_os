import { TB } from './constants.js';

// 2x2 quadrant with gutters
export function qb(slot) {
  const pad = 0; // No padding - quadrants should span edge to edge
  const mid = 12; // Gutter between quads
  const availW = window.innerWidth - (pad * 2);
  const availH = window.innerHeight - (TB + pad * 2);
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

export function bottomRect() {
  const fullH = window.innerHeight - TB;
  const halfH = fullH / 2;
  const y = TB + halfH; // start at mid
  return { x: 0, y, w: window.innerWidth, h: halfH };
}

// geometry for halves/quads
export const halfRects = () => ({
  LEFT:   { x: 0, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  RIGHT:  { x: window.innerWidth/2, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  TOP:    { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
  BOTTOM: { x: 0, y: TB + (window.innerHeight - TB)/2, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
});

export const quadRects = () => [qb(0), qb(1), qb(2), qb(3)];

export const ghostFromPoint = (w, p) => {
  const nx = Math.max(0, Math.min(p.x - w.b.w/2, window.innerWidth - w.b.w));
  const ny = Math.max(TB, Math.min(p.y - 20, window.innerHeight - w.b.h));
  return { x: nx, y: ny, w: w.b.w, h: w.b.h };
};
