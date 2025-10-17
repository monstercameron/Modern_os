import { SN } from './constants.js';
import { halfRects, quadRects } from './geometry.js';

// overlap helpers
export const intersect = (a, b) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  return { x: x1, y: y1, w, h };
};

export const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);

export const overlapRatio = (a, b) => {
  const inter = intersect(a, b);
  const ar = area(a);
  return ar === 0 ? 0 : area(inter) / ar;
};

export const chooseBestTarget = (targets, ghost) => {
  let bestOverlap = null, bestR = -1;
  let bestDist = null, bestD = Infinity;
  const cx = ghost.x + ghost.w/2; const cy = ghost.y + ghost.h/2;
  for (const t of targets) {
    const r = overlapRatio(ghost, t.rect);
    if (r > bestR) { bestR = r; bestOverlap = t; }
    const tx = t.rect.x + t.rect.w/2; const ty = t.rect.y + t.rect.h/2;
    const d = Math.hypot(cx - tx, cy - ty);
    if (d < bestD) { bestD = d; bestDist = t; }
  }
  return bestR > 0 ? bestOverlap : bestDist; // prefer overlap, else nearest by center
};

// snap targets based on current state
export const buildTargetsFor = (w) => {
  const t = [];
  const halves = halfRects();
  if (w.sn === SN.LEFT)  t.push({ id: 'RIGHT', type: 'snap', payload: SN.RIGHT, rect: halves.RIGHT });
  else if (w.sn === SN.RIGHT) t.push({ id: 'LEFT', type: 'snap', payload: SN.LEFT, rect: halves.LEFT });
  else if (w.sn === SN.TOP)  t.push({ id: 'BOTTOM', type: 'snap', payload: SN.BOTTOM, rect: halves.BOTTOM });
  else if (w.sn === SN.BOTTOM) t.push({ id: 'TOP', type: 'snap', payload: SN.TOP, rect: halves.TOP });
  else if (w.sn === SN.QUAD) {
    const qs = quadRects();
    const cx = w.b.x + w.b.w/2, cy = w.b.y + w.b.h/2;
    qs.forEach((r, idx) => {
      const inRect = cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      if (!inRect) t.push({ id: `Q${idx}`, type: 'snapQuad', payload: idx, rect: r });
    });
  } else { // NONE or FULL → halves + all quads
    t.push({ id: 'LEFT', type: 'snap', payload: SN.LEFT, rect: halves.LEFT });
    t.push({ id: 'RIGHT', type: 'snap', payload: SN.RIGHT, rect: halves.RIGHT });
    t.push({ id: 'TOP', type: 'snap', payload: SN.TOP, rect: halves.TOP });
    t.push({ id: 'BOTTOM', type: 'snap', payload: SN.BOTTOM, rect: halves.BOTTOM });
    quadRects().forEach((r, idx) => t.push({ id: `Q${idx}`, type: 'snapQuad', payload: idx, rect: r }));
  }
  return t;
};

export function evaluateSnap(point, targets) {
  if (!targets || targets.length === 0) {
    return { target: null, rect: null };
  }
  
  // Find which zone the pointer is in
  for (const t of targets) {
    if (point.x >= t.rect.x && point.x <= t.rect.x + t.rect.w
      && point.y >= t.rect.y && point.y <= t.rect.y + t.rect.h) {
      return { target: t, rect: t.rect };
    }
  }
  
  return { target: null, rect: null };
}
