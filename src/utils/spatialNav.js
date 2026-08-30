/**
 * Spatial navigation.
 *
 * "The one below" is not "the next one in the list". Given a set of rectangles
 * and a direction, this picks the neighbour a person would point at — used
 * both for moving the selection around the tile board and for moving focus
 * between tiled windows, so the two cannot drift apart.
 */

/**
 * Pick the neighbour of `fromId` in a direction.
 *
 * Prefers a candidate whose edge-to-edge span overlaps the origin's on the
 * cross axis: that is the rectangle directly beside or below, even when its
 * centre is far off. Only when nothing overlaps do we fall back to weighted
 * distance, which is what carries a selection across a ragged edge.
 *
 * @param {Array<{id:*, x:number, y:number, w:number, h:number}>} items
 * @param {*} fromId
 * @param {'left'|'right'|'up'|'down'} direction
 * @returns {*|null} the neighbour's id, or null when there is nothing that way
 */
export function pickNeighbour(items, fromId, direction) {
  const from = items.find((it) => it.id === fromId);
  if (!from) return null;

  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'right' || direction === 'down' ? 1 : -1;

  const centre = (it) => ({ cx: it.x + it.w / 2, cy: it.y + it.h / 2 });
  const span = (it) => (horizontal
    ? { lo: it.y, hi: it.y + it.h }
    : { lo: it.x, hi: it.x + it.w });

  const fromC = centre(from);
  const fromSpan = span(from);

  let overlapping = null;
  let overlappingDist = Infinity;
  let fallback = null;
  let fallbackScore = Infinity;

  for (const cand of items) {
    if (cand.id === fromId) continue;

    const c = centre(cand);
    const along = horizontal ? c.cx - fromC.cx : c.cy - fromC.cy;
    const across = horizontal ? c.cy - fromC.cy : c.cx - fromC.cx;

    // Must actually be in the direction we are travelling.
    if (along * sign <= 1) continue;

    const candSpan = span(cand);
    const overlaps = candSpan.hi > fromSpan.lo + 1 && candSpan.lo < fromSpan.hi - 1;

    if (overlaps) {
      const dist = Math.abs(along);
      if (dist < overlappingDist) { overlappingDist = dist; overlapping = cand; }
    } else {
      const score = Math.abs(along) + Math.abs(across) * 2;
      if (score < fallbackScore) { fallbackScore = score; fallback = cand; }
    }
  }

  return (overlapping || fallback)?.id ?? null;
}
