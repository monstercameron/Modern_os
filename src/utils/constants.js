// ---------- constants & helpers ----------
export const TB = 40; // taskbar height (top)
export const SN = { NONE: "NONE", LEFT: "LEFT", RIGHT: "RIGHT", TOP: "TOP", BOTTOM: "BOTTOM", FULL: "FULL", QUAD: "QUAD" };
export const tm = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const uid = (() => { let i = 0; return () => `${++i}-${Math.random().toString(36).slice(2,7)}`; })();

// base floating bounds
export const B0 = { x: 120, y: TB + 12, w: 760, h: 500 };

// 2x2 quadrant with gutters
export function qb(slot) {
  const pad = 12;
  const mid = 12;
  const availW = window.innerWidth - (pad * 2);
  const availH = window.innerHeight - (TB + pad * 2);
  const qw = (availW - mid) / 2;
  const qh = (availH - mid) / 2;
  const x0 = pad;
  const x1 = pad + qw + mid;
  const y0 = TB + pad;
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

export function clearBadgeState(badges, id) {
  if (badges && Object.prototype.hasOwnProperty.call(badges, id)) {
    return { ...badges, [id]: 0 };
  }
  return badges;
}

export function acc(color) {
  if (color.includes("sky")) return "bg-sky-700";
  if (color.includes("rose")) return "bg-rose-700";
  if (color.includes("amber")) return "bg-amber-700";
  if (color.includes("emerald")) return "bg-emerald-700";
  if (color.includes("indigo")) return "bg-indigo-700";
  if (color.includes("purple")) return "bg-purple-700";
  if (color.includes("teal")) return "bg-teal-700";
  if (color.includes("zinc")) return "bg-zinc-800";
  return "bg-slate-800";
}

// clamp preview X within viewport with 8px gutters
export function clampX(x, width) {
  const max = Math.max(0, window.innerWidth - width - 8);
  return Math.max(8, Math.min(x, max));
}

// geometry for halves/quads
export const halfRects = () => ({
  LEFT:   { x: 0, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  RIGHT:  { x: window.innerWidth/2, y: TB, w: window.innerWidth/2, h: window.innerHeight - TB },
  TOP:    { x: 0, y: TB, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
  BOTTOM: { x: 0, y: TB + (window.innerHeight - TB)/2, w: window.innerWidth, h: (window.innerHeight - TB)/2 },
});
export const quadRects = () => [qb(0), qb(1), qb(2), qb(3)];

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
export const ghostFromPoint = (w, p) => {
  const nx = Math.max(0, Math.min(p.x - w.b.w/2, window.innerWidth - w.b.w));
  const ny = Math.max(TB, Math.min(p.y - 20, window.innerHeight - w.b.h));
  return { x: nx, y: ny, w: w.b.w, h: w.b.h };
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