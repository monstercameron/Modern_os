/**
 * BSP / dwindle layout
 *
 * A binary tree per workspace. Every leaf is a tiled window; every split holds
 * two children and a ratio. Opening a window splits the one it lands on, so the
 * first window owns the whole viewport, the second takes half, the third takes
 * half of that, and so on — each new window halves the one it displaced.
 *
 * The tree carries no geometry. Rectangles are derived from it on demand, which
 * keeps resizing the viewport a pure recompute rather than a state migration.
 *
 * Node shapes:
 *   leaf  { type: 'leaf', id }
 *   split { type: 'split', dir: 'v' | 'h', ratio, a, b }
 *     dir 'v' splits vertically  -> children sit side by side
 *     dir 'h' splits horizontally -> children stack
 */

export const GAP = 8;

export const leaf = (id) => ({ type: 'leaf', id });

const split = (dir, a, b, ratio = 0.5) => ({ type: 'split', dir, ratio, a, b });

/** Every window id in the tree, in layout order. */
export function ids(node) {
  if (!node) return [];
  if (node.type === 'leaf') return [node.id];
  return [...ids(node.a), ...ids(node.b)];
}

export function has(node, id) {
  if (!node) return false;
  if (node.type === 'leaf') return node.id === id;
  return has(node.a, id) || has(node.b, id);
}

/** The last leaf in layout order — the fallback split target. */
function lastLeaf(node) {
  if (!node) return null;
  if (node.type === 'leaf') return node;
  return lastLeaf(node.b) || lastLeaf(node.a);
}

/**
 * Insert a window by splitting an existing one.
 *
 * @param {object|null} tree
 * @param {string} id        - the window being added
 * @param {string|null} targetId - the window to split; defaults to the last leaf
 * @param {Map<string,{w:number,h:number}>} rects - current geometry, used to
 *        pick the split direction so the result stays close to square
 */
export function insert(tree, id, targetId = null, rects = new Map()) {
  if (!tree) return leaf(id);
  if (has(tree, id)) return tree;

  const target = (targetId && has(tree, targetId))
    ? targetId
    : lastLeaf(tree)?.id;

  if (!target) return leaf(id);

  // Split along the longer axis so panes trend toward square.
  const rect = rects.get(target);
  const dir = !rect || rect.w >= rect.h ? 'v' : 'h';

  const replace = (node) => {
    if (!node) return node;
    if (node.type === 'leaf') {
      return node.id === target ? split(dir, node, leaf(id)) : node;
    }
    return { ...node, a: replace(node.a), b: replace(node.b) };
  };

  return replace(tree);
}

/** Remove a window; its sibling takes over the space. */
export function remove(tree, id) {
  if (!tree) return null;
  if (tree.type === 'leaf') return tree.id === id ? null : tree;

  const a = remove(tree.a, id);
  const b = remove(tree.b, id);
  if (!a) return b;
  if (!b) return a;
  if (a === tree.a && b === tree.b) return tree;
  return { ...tree, a, b };
}

/** Change the ratio of the split that owns this window. */
export function resize(tree, id, ratio) {
  if (!tree || tree.type === 'leaf') return tree;
  const clamped = Math.min(0.85, Math.max(0.15, ratio));
  if (tree.a.type === 'leaf' && tree.a.id === id) return { ...tree, ratio: clamped };
  if (tree.b.type === 'leaf' && tree.b.id === id) return { ...tree, ratio: 1 - clamped };
  return { ...tree, a: resize(tree.a, id, ratio), b: resize(tree.b, id, ratio) };
}

/**
 * Exchange two windows' places in the tree.
 *
 * Only the leaf ids move, so every split and ratio stays put: the layout keeps
 * its shape and the two windows trade the slots they occupy.
 *
 * @param {object|null} tree
 * @param {string} a
 * @param {string} b
 * @returns {object|null}
 */
export function swap(tree, a, b) {
  if (!tree || a === b) return tree;
  const walk = (n) => {
    if (!n) return n;
    if (n.type === 'leaf') {
      if (n.id === a) return { ...n, id: b };
      if (n.id === b) return { ...n, id: a };
      return n;
    }
    return { ...n, a: walk(n.a), b: walk(n.b) };
  };
  return walk(tree);
}

/**
 * Move the divider a window shares along one axis.
 *
 * Left/Right change the pane's width and Up/Down its height -- i3's semantics,
 * where the direction names the dimension to grow rather than the way the
 * window travels. The sign depends on which side of the split the window sits
 * on: the `a` branch grows as the ratio rises, the `b` branch as it falls, so
 * the same key produces the same visible result from either side.
 *
 * Splits on the other axis are skipped, so pressing Right from inside a stack
 * of horizontal splits walks up to the nearest vertical one instead of doing
 * nothing.
 *
 * @param {object|null} tree
 * @param {string} id
 * @param {'left'|'right'|'up'|'down'} direction
 * @param {number} step - fraction of the split to move
 * @returns {object|null} the tree, returned unchanged when there is no divider
 *                        to move or it is already at its limit
 */
export function resizeDirection(tree, id, direction, step = 0.05) {
  const axis = direction === 'left' || direction === 'right' ? 'v' : 'h';
  const grow = direction === 'right' || direction === 'down';

  // Path from the root down to the leaf, so the *nearest* matching split wins.
  const path = [];
  const find = (node, trail) => {
    if (!node) return false;
    if (node.type === 'leaf') {
      if (node.id !== id) return false;
      path.push(...trail);
      return true;
    }
    return (
      find(node.a, [...trail, { node, branch: 'a' }]) ||
      find(node.b, [...trail, { node, branch: 'b' }])
    );
  };
  if (!find(tree, [])) return tree;

  const hit = [...path].reverse().find((entry) => entry.node.dir === axis);
  if (!hit) return tree;

  const delta = (hit.branch === 'a' ? 1 : -1) * (grow ? step : -step);
  const ratio = Math.min(0.85, Math.max(0.15, hit.node.ratio + delta));
  if (ratio === hit.node.ratio) return tree;

  // Rebuild only the spine down to the split that changed; the rest is shared,
  // so React sees new objects exactly where something actually moved.
  const rebuild = (node, depth) => {
    if (node === hit.node) return { ...node, ratio };
    const down = path[depth];
    if (!down) return node;
    return down.branch === 'a'
      ? { ...node, a: rebuild(node.a, depth + 1) }
      : { ...node, b: rebuild(node.b, depth + 1) };
  };
  return rebuild(tree, 0);
}

/**
 * Derive a rectangle for every leaf.
 *
 * @param {object|null} node
 * @param {{x:number,y:number,w:number,h:number}} rect - the area to fill
 * @param {number} gap - space between panes and around the edge
 * @returns {Map<string, {x:number,y:number,w:number,h:number}>}
 */
export function computeBounds(node, rect, gap = GAP) {
  const out = new Map();
  if (!node) return out;

  const walk = (n, r) => {
    if (n.type === 'leaf') {
      out.set(n.id, {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.w),
        h: Math.round(r.h),
      });
      return;
    }

    if (n.dir === 'v') {
      const usable = r.w - gap;
      const aw = usable * n.ratio;
      walk(n.a, { x: r.x, y: r.y, w: aw, h: r.h });
      walk(n.b, { x: r.x + aw + gap, y: r.y, w: usable - aw, h: r.h });
    } else {
      const usable = r.h - gap;
      const ah = usable * n.ratio;
      walk(n.a, { x: r.x, y: r.y, w: r.w, h: ah });
      walk(n.b, { x: r.x, y: r.y + ah + gap, w: r.w, h: usable - ah });
    }
  };

  // Inset the whole area by one gap so tiled windows do not touch the edges.
  walk(node, {
    x: rect.x + gap,
    y: rect.y + gap,
    w: rect.w - gap * 2,
    h: rect.h - gap * 2,
  });

  return out;
}

/** Drop ids that no longer correspond to a tiled window. */
export function prune(tree, keepIds) {
  let next = tree;
  for (const id of ids(tree)) {
    if (!keepIds.has(id)) next = remove(next, id);
  }
  return next;
}
