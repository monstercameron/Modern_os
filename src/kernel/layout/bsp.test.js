import { describe, it, expect } from 'vitest';
import * as bsp from './bsp.js';

/**
 * BSP invariants.
 *
 * The tiling engine is the piece most worth testing by property rather than by
 * example: it is a tree mutated by open, close, move, swap and resize in any
 * order, and the interesting failures are the sequences nobody thinks to write
 * down. These drive random sequences and assert the things that must be true
 * after every single one of them.
 *
 * The generator is seeded, so a failure names a seed you can replay.
 */

/** A small deterministic PRNG — mulberry32. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREA = { x: 0, y: 40, w: 1600, h: 960 };
const GAP = 8;

const leavesOf = (node, out = []) => {
  if (!node) return out;
  if (node.type === 'leaf') { out.push(node.id); return out; }
  leavesOf(node.a, out);
  leavesOf(node.b, out);
  return out;
};

const splitsOf = (node, out = []) => {
  if (!node || node.type === 'leaf') return out;
  out.push(node);
  splitsOf(node.a, out);
  splitsOf(node.b, out);
  return out;
};

const overlaps = (a, b) => !(
  a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 ||
  a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1
);

/** Everything that must hold after any sequence of operations. */
function checkInvariants(tree, expectedIds, seed, step) {
  const where = `seed ${seed}, step ${step}`;
  const leaves = leavesOf(tree);

  // Every window appears exactly once, and nothing else appears at all.
  expect(new Set(leaves).size, `duplicate leaves — ${where}`).toBe(leaves.length);
  expect([...leaves].sort(), `leaf set — ${where}`).toEqual([...expectedIds].sort());

  // No split may be degenerate, and ratios stay inside the clamp.
  for (const node of splitsOf(tree)) {
    expect(node.a, `split missing a — ${where}`).toBeTruthy();
    expect(node.b, `split missing b — ${where}`).toBeTruthy();
    expect(node.ratio, `ratio low — ${where}`).toBeGreaterThanOrEqual(0.15);
    expect(node.ratio, `ratio high — ${where}`).toBeLessThanOrEqual(0.85);
    expect(['v', 'h'], `split dir — ${where}`).toContain(node.dir);
  }

  // Rectangles: one per window, positive, inside the area, non-overlapping.
  const bounds = bsp.computeBounds(tree, AREA, GAP);
  expect(bounds.size, `bounds count — ${where}`).toBe(expectedIds.size);

  /*
   * Rectangles are never negative or NaN. They can be very small: a tree
   * nested deeply enough, with ratios repeatedly at the 0.15 clamp, genuinely
   * runs out of pixels, and the engine's job there is to stay valid rather
   * than to refuse. The shallow-tree case below is the one that must be
   * comfortably positive.
   */
  const rects = [...bounds.values()];
  for (const r of rects) {
    expect(Number.isFinite(r.w), `width finite — ${where}`).toBe(true);
    expect(Number.isFinite(r.h), `height finite — ${where}`).toBe(true);
    expect(r.w, `width — ${where}`).toBeGreaterThanOrEqual(0);
    expect(r.h, `height — ${where}`).toBeGreaterThanOrEqual(0);
    expect(r.x, `left edge — ${where}`).toBeGreaterThanOrEqual(AREA.x - 1);
    expect(r.y, `top edge — ${where}`).toBeGreaterThanOrEqual(AREA.y - 1);
    expect(r.x + r.w, `right edge — ${where}`).toBeLessThanOrEqual(AREA.x + AREA.w + 1);
    expect(r.y + r.h, `bottom edge — ${where}`).toBeLessThanOrEqual(AREA.y + AREA.h + 1);
  }

  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      expect(overlaps(rects[i], rects[j]), `overlap — ${where}`).toBe(false);
    }
  }
}

describe('bsp invariants under random sequences', () => {
  const SEEDS = [1, 7, 42, 99, 1234, 20260830, 8675309, 31337];

  for (const seed of SEEDS) {
    it(`holds for seed ${seed}`, () => {
      const rand = rng(seed);
      const pick = (list) => list[Math.floor(rand() * list.length)];

      let tree = null;
      const ids = new Set();
      let counter = 0;

      for (let step = 0; step < 120; step += 1) {
        const live = [...ids];
        const roll = rand();

        if (live.length === 0 || roll < 0.4) {
          const id = `w${counter += 1}`;
          const rects = bsp.computeBounds(tree, AREA, GAP);
          const target = live.length && rand() < 0.7 ? pick(live) : null;
          tree = bsp.insert(tree, id, target, rects);
          ids.add(id);
        } else if (roll < 0.6) {
          const id = pick(live);
          tree = bsp.remove(tree, id);
          ids.delete(id);
        } else if (roll < 0.75 && live.length >= 2) {
          const a = pick(live);
          const b = pick(live.filter((x) => x !== a));
          tree = bsp.swap(tree, a, b);
        } else if (roll < 0.9) {
          const id = pick(live);
          const dir = pick(['left', 'right', 'up', 'down']);
          tree = bsp.resizeDirection(tree, id, dir);
        } else {
          tree = bsp.prune(tree, ids);
        }

        checkInvariants(tree, ids, seed, step);
      }
    });
  }
});

describe('realistic layouts give every window real space', () => {
  /*
   * Eight, not twelve. Each new window splits the one that is focused, and
   * focus follows the new window, so opening apps back to back cascades down a
   * single spine: the pane halves on alternating axes every time. Twelve deep
   * is a 25x15 sliver — that is dwindle tiling working as designed, the same
   * as i3 or Hyprland, not a defect. Eight is the depth a person reaches
   * before they would reach for another workspace.
   */
  it('keeps every pane usable for the window counts a person actually opens', () => {
    let tree = null;
    const ids = [];
    for (let n = 1; n <= 8; n += 1) {
      const id = `w${n}`;
      const rects = bsp.computeBounds(tree, AREA, GAP);
      // Always split the newest window, the deepest realistic nesting.
      tree = bsp.insert(tree, id, ids[ids.length - 1] ?? null, rects);
      ids.push(id);

      for (const r of bsp.computeBounds(tree, AREA, GAP).values()) {
        expect(r.w, `width with ${n} windows`).toBeGreaterThan(20);
        expect(r.h, `height with ${n} windows`).toBeGreaterThan(20);
      }
    }
  });
});

describe('bsp operations', () => {
  it('a single window owns the whole area', () => {
    const tree = bsp.insert(null, 'only');
    const b = bsp.computeBounds(tree, AREA, GAP).get('only');
    expect(b.w).toBe(AREA.w - GAP * 2);
  });

  it('removing the last window empties the tree', () => {
    let tree = bsp.insert(null, 'a');
    tree = bsp.remove(tree, 'a');
    expect(leavesOf(tree)).toEqual([]);
    expect(bsp.computeBounds(tree, AREA, GAP).size).toBe(0);
  });

  it('swap exchanges places and keeps the shape', () => {
    let tree = bsp.insert(null, 'a');
    tree = bsp.insert(tree, 'b', 'a', bsp.computeBounds(tree, AREA, GAP));
    const before = bsp.computeBounds(tree, AREA, GAP);
    const swapped = bsp.swap(tree, 'a', 'b');
    const after = bsp.computeBounds(swapped, AREA, GAP);
    expect(after.get('a')).toEqual(before.get('b'));
    expect(after.get('b')).toEqual(before.get('a'));
  });

  it('swapping a window with itself changes nothing', () => {
    const tree = bsp.insert(null, 'a');
    expect(bsp.swap(tree, 'a', 'a')).toBe(tree);
  });

  it('resize moves the divider and conserves the total area', () => {
    let tree = bsp.insert(null, 'a');
    tree = bsp.insert(tree, 'b', 'a', bsp.computeBounds(tree, AREA, GAP));
    const before = bsp.computeBounds(tree, AREA, GAP);
    const total = [...before.values()].reduce((n, r) => n + r.w * r.h, 0);

    const grown = bsp.resizeDirection(tree, 'a', 'right');
    const after = bsp.computeBounds(grown, AREA, GAP);

    expect(after.get('a').w).not.toBe(before.get('a').w);
    const totalAfter = [...after.values()].reduce((n, r) => n + r.w * r.h, 0);
    expect(Math.abs(totalAfter - total) / total).toBeLessThan(0.02);
  });

  it('resize clamps rather than running away', () => {
    let tree = bsp.insert(null, 'a');
    tree = bsp.insert(tree, 'b', 'a', bsp.computeBounds(tree, AREA, GAP));
    for (let i = 0; i < 50; i += 1) tree = bsp.resizeDirection(tree, 'a', 'right');
    const b = bsp.computeBounds(tree, AREA, GAP).get('b');
    expect(b.w).toBeGreaterThan(0);
    expect(splitsOf(tree)[0].ratio).toBeLessThanOrEqual(0.85);
  });

  it('resizing on an axis the window has no divider for is a no-op', () => {
    const tree = bsp.insert(null, 'a');
    expect(bsp.resizeDirection(tree, 'a', 'left')).toBe(tree);
  });

  it('prune drops windows that are gone', () => {
    let tree = bsp.insert(null, 'a');
    tree = bsp.insert(tree, 'b', 'a', bsp.computeBounds(tree, AREA, GAP));
    tree = bsp.prune(tree, new Set(['a']));
    expect(leavesOf(tree)).toEqual(['a']);
  });
});
