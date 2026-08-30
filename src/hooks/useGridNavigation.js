import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keyboard navigation over a grid of variable-sized tiles.
 *
 * Tiles span different numbers of rows and columns, so index arithmetic gives
 * the wrong neighbour as soon as a 2x1 sits next to two 1x1s. This picks the
 * nearest tile *geometrically* instead: among the tiles that actually lie in
 * the direction of travel, take the one whose centre is closest, weighting
 * distance along the travel axis so a tile straight ahead beats one that is
 * merely near.
 *
 * @param {object}  opts
 * @param {Array}   opts.items      - the visible items, in DOM order
 * @param {object}  opts.containerRef
 * @param {string}  opts.itemSelector - selects the tile elements
 * @param {Function} opts.onActivate - called with the item when chosen
 */
export function useGridNavigation({ items, containerRef, itemSelector = '[data-tile]', onActivate }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeRef = useRef(-1);
  useEffect(() => { activeRef.current = activeIndex; }, [activeIndex]);

  // Keep the selection in range as the list is filtered.
  useEffect(() => {
    setActiveIndex((i) => {
      if (items.length === 0) return -1;
      if (i < 0) return -1;
      return Math.min(i, items.length - 1);
    });
  }, [items.length]);

  const rects = useCallback(() => {
    const root = containerRef.current;
    if (!root) return [];
    return [...root.querySelectorAll(itemSelector)].map((el, i) => {
      const r = el.getBoundingClientRect();
      return { i, el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r };
    });
  }, [containerRef, itemSelector]);

  const focusIndex = useCallback((index) => {
    setActiveIndex(index);
    const all = rects();
    const target = all[index];
    if (target?.el) {
      target.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      target.el.focus?.({ preventScroll: true });
    }
  }, [rects]);

  /** Move to the nearest tile in a direction. */
  const move = useCallback((dir) => {
    const all = rects();
    if (all.length === 0) return;

    const current = activeRef.current;
    if (current < 0 || !all[current]) {
      focusIndex(0);
      return;
    }

    const from = all[current];
    const horizontal = dir === 'left' || dir === 'right';
    const sign = dir === 'right' || dir === 'down' ? 1 : -1;

    /*
     * Prefer a tile whose edge-to-edge span overlaps the current one on the
     * cross axis — that is the tile a person means by "the one below". Only
     * when nothing overlaps do we fall back to weighted distance, which is
     * what carries the selection across a ragged column edge.
     */
    const span = (rect) => (horizontal
      ? { lo: rect.top, hi: rect.bottom }
      : { lo: rect.left, hi: rect.right });

    const fromSpan = span(from.r);
    let overlapping = null;
    let overlappingDist = Infinity;
    let fallback = null;
    let fallbackScore = Infinity;

    for (const cand of all) {
      if (cand.i === from.i) continue;

      const dx = cand.cx - from.cx;
      const dy = cand.cy - from.cy;
      const along = horizontal ? dx : dy;
      const across = horizontal ? dy : dx;

      // Must actually be in the direction we are travelling.
      if (along * sign <= 1) continue;

      const candSpan = span(cand.r);
      const overlaps = candSpan.hi > fromSpan.lo + 1 && candSpan.lo < fromSpan.hi - 1;

      if (overlaps) {
        const dist = Math.abs(along);
        if (dist < overlappingDist) { overlappingDist = dist; overlapping = cand; }
      } else {
        const score = Math.abs(along) + Math.abs(across) * 2;
        if (score < fallbackScore) { fallbackScore = score; fallback = cand; }
      }
    }

    const best = overlapping || fallback;
    if (best) focusIndex(best.i);
  }, [rects, focusIndex]);

  /** Handle a key. Returns true when the key was consumed. */
  const handleKey = useCallback((e) => {
    const key = e.key;
    const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

    if (dirs[key]) {
      move(dirs[key]);
      return true;
    }
    if (key === 'Home') { focusIndex(0); return true; }
    if (key === 'End') { focusIndex(items.length - 1); return true; }
    if (key === 'Enter' || key === ' ') {
      const index = activeRef.current;
      if (index >= 0 && items[index]) {
        onActivate?.(items[index], index);
        return true;
      }
      // Nothing selected yet: Enter takes the first result, which is what a
      // type-to-filter flow expects.
      if (items.length > 0) {
        onActivate?.(items[0], 0);
        return true;
      }
    }
    return false;
  }, [move, focusIndex, items, onActivate]);

  const reset = useCallback(() => setActiveIndex(-1), []);

  return { activeIndex, setActiveIndex: focusIndex, handleKey, reset, move };
}

export default useGridNavigation;
