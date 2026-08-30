import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './reducer.js';
import * as actions from './actions.js';
import { SN } from '../utils/constants.js';

/**
 * Reducer tests.
 *
 * These exist because the reducer is now a pure function: it reads the viewport
 * and the window gap from state and takes window ids from actions, so the same
 * (state, action) pair gives the same answer here as it does in a browser. None
 * of this was testable while it measured the DOM itself.
 */

const APP = (id, title = id) => ({ id, title, icon: {}, color: 'bg-slate-700' });

/** A desktop with a known screen, so every rectangle in here is predictable. */
const boot = () => reducer(initialState, actions.setEnv({
  viewport: { w: 1600, h: 1000 }, gap: 8,
}));

const open = (state, id) => reducer(state, actions.openWindow(APP(id)));

const openMany = (state, ids) => ids.reduce((s, id) => open(s, id), state);

const tiledOn = (state, ws) =>
  state.windows.filter((w) => w.ws === ws && !w.floating && !w.m);

const overlaps = (a, b) => !(
  a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 ||
  a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1
);

const anyOverlap = (windows) => {
  for (let i = 0; i < windows.length; i += 1) {
    for (let j = i + 1; j < windows.length; j += 1) {
      if (overlaps(windows[i].b, windows[j].b)) return true;
    }
  }
  return false;
};

describe('purity', () => {
  it('gives the same result for the same input', () => {
    const s = boot();
    const action = actions.openWindow(APP('terminal'));
    expect(reducer(s, action)).toEqual(reducer(s, action));
  });

  it('lays out against the viewport in state, not the real screen', () => {
    const wide = openMany(boot(), ['a', 'b']);
    const narrow = openMany(
      reducer(initialState, actions.setEnv({ viewport: { w: 800, h: 600 }, gap: 8 })),
      ['a', 'b'],
    );
    const widest = Math.max(...wide.windows.map((w) => w.b.w));
    const narrowest = Math.max(...narrow.windows.map((w) => w.b.w));
    expect(widest).toBeGreaterThan(narrowest);
  });

  it('takes the window id from the action', () => {
    const a = actions.openWindow(APP('terminal'));
    expect(a.id).toBeTruthy();
    expect(reducer(boot(), a).windows[0].id).toBe(a.id);
  });
});

describe('opening windows', () => {
  it('the first window fills the tiling area', () => {
    const s = open(boot(), 'terminal');
    const { b } = s.windows[0];
    expect(b.w).toBeGreaterThan(1500);
    expect(b.x).toBeGreaterThanOrEqual(0);
  });

  it('a new window splits the focused pane, not the last one', () => {
    // Three windows, then focus the first and open a fourth. The fourth must
    // land beside the window that was focused.
    let s = openMany(boot(), ['a', 'b', 'c']);
    const first = s.windows[0];
    s = reducer(s, actions.focusWindow(first.id));
    const before = { ...s.windows.find((w) => w.id === first.id).b };

    s = open(s, 'd');
    const after = s.windows.find((w) => w.id === first.id).b;
    const fourth = s.windows[3].b;

    // The focused window gave up some of its own area to the newcomer...
    expect(after.w * after.h).toBeLessThan(before.w * before.h);
    // ...and the newcomer is inside where the focused window used to be.
    expect(overlaps(fourth, before)).toBe(true);
  });

  it('never overlaps tiled windows', () => {
    const s = openMany(boot(), ['a', 'b', 'c', 'd', 'e', 'f']);
    expect(anyOverlap(tiledOn(s, 1))).toBe(false);
  });
});

describe('single-instance apps', () => {
  // 'settings' is single instance in the manifest.
  it('opening one on another workspace goes to it', () => {
    let s = open(boot(), 'settings');
    const win = s.windows[0];
    s = reducer(s, actions.moveWindowToWorkspace(win.id, 3));
    s = reducer(s, actions.switchWorkspace(1));
    expect(s.workspaces.current).toBe(1);

    s = reducer(s, actions.openWindow(APP('settings')));
    expect(s.workspaces.current).toBe(3);
    expect(s.activeId).toBe(win.id);
    expect(s.windows).toHaveLength(1);
  });

  it('reopening a minimized one retiles it immediately', () => {
    let s = openMany(boot(), ['settings', 'a']);
    const settings = s.windows.find((w) => w.appId === 'settings');
    s = reducer(s, actions.minimizeWindow(settings.id));

    const other = s.windows.find((w) => w.appId === 'a');
    // With one window hidden the other owns the whole area.
    expect(s.windows.find((w) => w.id === other.id).b.w).toBeGreaterThan(1500);

    s = reducer(s, actions.openWindow(APP('settings')));
    const back = s.windows.find((w) => w.id === settings.id);
    expect(back.m).toBe(false);
    expect(back.b.w).toBeLessThan(1500);
    expect(anyOverlap(tiledOn(s, 1))).toBe(false);
  });
});

describe('workspaces', () => {
  it('shrinking the count moves windows and rebuilds their layout', () => {
    let s = boot();
    s = open(s, 'a');
    s = reducer(s, actions.switchWorkspace(5));
    s = open(s, 'b');
    s = open(s, 'c');
    expect(Object.keys(s.layouts).map(Number).sort()).toContain(5);

    s = reducer(s, actions.setWorkspaceCount(2));

    expect(s.workspaces.count).toBe(2);
    expect(s.windows.every((w) => w.ws <= 2)).toBe(true);
    // No tree left for a workspace that no longer exists.
    expect(Object.keys(s.layouts).map(Number).every((ws) => ws <= 2)).toBe(true);
    // The moved windows have real, non-overlapping rectangles right away.
    const moved = tiledOn(s, 2);
    expect(moved.length).toBe(2);
    expect(anyOverlap(moved)).toBe(false);
    for (const w of moved) {
      expect(w.b.w).toBeGreaterThan(0);
      expect(w.b.h).toBeGreaterThan(0);
    }
  });

  it('clamps a switch to a workspace that does not exist', () => {
    const s = reducer(boot(), actions.switchWorkspace(99));
    expect(s.workspaces.current).toBe(5);
  });
});

describe('the layout owns tiled geometry', () => {
  it('refuses a direct bounds write on a tiled window', () => {
    const s = open(boot(), 'a');
    const win = s.windows[0];
    const next = reducer(s, actions.setWindowBounds(win.id, { x: 5, y: 5, w: 100, h: 100 }));
    expect(next).toBe(s);
  });

  it('allows one on a floating window', () => {
    let s = open(boot(), 'a');
    const win = s.windows[0];
    s = reducer(s, actions.toggleFloating(win.id));
    s = reducer(s, actions.setWindowBounds(win.id, { x: 5, y: 5, w: 100, h: 100 }));
    expect(s.windows[0].b).toEqual({ x: 5, y: 5, w: 100, h: 100 });
  });

  it('lets a snap through, because snapping floats the window first', () => {
    let s = open(boot(), 'a');
    const win = s.windows[0];
    s = reducer(s, actions.setWindowBounds(win.id, { x: 0, y: 40, w: 800, h: 960 }, { snapped: true }));
    expect(s.windows[0].floating).toBe(true);
    expect(s.windows[0].b.w).toBe(800);
  });
});

describe('the state machine is the only authority', () => {
  it('maximize and restore round-trip through it', () => {
    let s = open(boot(), 'a');
    const id = s.windows[0].id;
    s = reducer(s, actions.toggleMaximizeWindow(id));
    expect(s.windows[0].sn).toBe(SN.FULL);
    s = reducer(s, actions.toggleMaximizeWindow(id));
    expect(s.windows[0].sn).toBe(SN.NONE);
  });

  it('refuses to maximize a window that already is, leaving state untouched', () => {
    let s = open(boot(), 'a');
    const id = s.windows[0].id;
    s = reducer(s, actions.maximizeWindow(id));
    const maxed = s;
    s = reducer(s, actions.maximizeWindow(id));
    expect(s).toBe(maxed);
  });

  it('a fullscreen window leaves the tiling tree and comes back', () => {
    let s = openMany(boot(), ['a', 'b']);
    const id = s.windows[0].id;
    const shared = s.windows[1].b.w;

    s = reducer(s, actions.maximizeWindow(id));
    // The other window now has the area to itself.
    expect(s.windows[1].b.w).toBeGreaterThan(shared);

    s = reducer(s, actions.unmaximizeWindow(id));
    expect(s.windows[1].b.w).toBe(shared);
    expect(anyOverlap(tiledOn(s, 1))).toBe(false);
  });

  it('minimize hides a window and restore brings it back into the layout', () => {
    let s = openMany(boot(), ['a', 'b']);
    const id = s.windows[0].id;
    s = reducer(s, actions.minimizeWindow(id));
    expect(s.windows[0].m).toBe(true);
    expect(tiledOn(s, 1)).toHaveLength(1);

    s = reducer(s, actions.restoreWindow(id));
    expect(s.windows[0].m).toBe(false);
    expect(tiledOn(s, 1)).toHaveLength(2);
    expect(anyOverlap(tiledOn(s, 1))).toBe(false);
  });
});

describe('drag and snap paths', () => {
  /*
   * These exist because making the reducer pure changed the signatures of
   * qb() and ghostFromPoint() to take the viewport, and two call sites inside
   * the reducer were left passing the old argument list. Nothing failed at
   * build time — they are plain function calls — so dragging a window and
   * snapping one to a quadrant both threw at the first use. Exercising every
   * branch that computes geometry is the cheap way to never repeat that.
   */
  it('moves a window to a point without throwing', () => {
    let s = open(boot(), 'a');
    const id = s.windows[0].id;
    s = reducer(s, actions.moveWindowTo(id, 300, 200));
    const w = s.windows[0];
    expect(w.floating).toBe(true);
    expect(Number.isFinite(w.b.x)).toBe(true);
    expect(Number.isFinite(w.b.y)).toBe(true);
  });

  it('clamps a moved window inside the viewport', () => {
    let s = open(boot(), 'a');
    const id = s.windows[0].id;
    s = reducer(s, actions.moveWindowTo(id, 99999, 99999));
    const { b } = s.windows[0];
    expect(b.x + b.w).toBeLessThanOrEqual(1600);
    expect(b.y).toBeGreaterThanOrEqual(40);
  });

  it('snaps to each quadrant with real geometry', () => {
    for (const quad of [0, 1, 2, 3]) {
      let s = open(boot(), 'a');
      s = reducer(s, actions.snapWindowQuad(s.windows[0].id, quad));
      const { b } = s.windows[0];
      expect(Number.isFinite(b.w), `quad ${quad} width`).toBe(true);
      expect(b.w, `quad ${quad} width`).toBeGreaterThan(0);
      expect(b.h, `quad ${quad} height`).toBeGreaterThan(0);
      expect(b.x + b.w, `quad ${quad} right`).toBeLessThanOrEqual(1601);
    }
  });

  it('snaps to each half with real geometry', () => {
    for (const half of [SN.LEFT, SN.RIGHT, SN.TOP, SN.BOTTOM]) {
      let s = open(boot(), 'a');
      s = reducer(s, actions.snapWindow(s.windows[0].id, half));
      const w = s.windows[0];
      expect(w.floating, `${half} floats`).toBe(true);
      expect(w.sn, `${half} snap state`).toBe(half);
      expect(w.b.w, `${half} width`).toBeGreaterThan(0);
      expect(w.b.h, `${half} height`).toBeGreaterThan(0);
    }
  });

  it('every action type the shell dispatches survives a round trip', () => {
    // A crude but effective sweep: run each action against a live desktop and
    // assert the reducer neither throws nor produces a broken window.
    let s = openMany(boot(), ['a', 'b']);
    const id = s.windows[0].id;
    const sequence = [
      actions.focusWindow(id),
      actions.snapWindow(id, SN.LEFT),
      actions.moveWindowTo(id, 100, 100),
      actions.setWindowBounds(id, { x: 10, y: 50, w: 400, h: 300 }),
      actions.snapWindowQuad(id, 2),
      actions.toggleFloating(id),
      actions.resizeTile(id, 'right'),
      actions.moveWindowDirection(id, 'right'),
      actions.focusDirection('left'),
      actions.toggleMaximizeWindow(id),
      actions.toggleMaximizeWindow(id),
      actions.minimizeWindow(id),
      actions.restoreWindow(id),
      actions.moveWindowToWorkspace(id, 2),
      actions.switchWorkspace(1),
      actions.retileAll(),
      actions.setEnv({ viewport: { w: 1024, h: 768 }, gap: 12 }),
    ];
    for (const action of sequence) {
      s = reducer(s, action);
      for (const w of s.windows) {
        expect(Number.isFinite(w.b.x), `${action.type} x`).toBe(true);
        expect(Number.isFinite(w.b.y), `${action.type} y`).toBe(true);
        expect(w.b.w, `${action.type} width`).toBeGreaterThanOrEqual(0);
        expect(w.b.h, `${action.type} height`).toBeGreaterThanOrEqual(0);
      }
    }
    expect(s.windows).toHaveLength(2);
  });
});

describe('focus', () => {
  it('never leaves a hidden window focused', () => {
    let s = openMany(boot(), ['a', 'b']);
    s = reducer(s, actions.minimizeWindow(s.activeId));
    const active = s.windows.find((w) => w.id === s.activeId);
    expect(active.m).toBe(false);
  });

  it('closing the last window clears focus', () => {
    let s = open(boot(), 'a');
    s = reducer(s, actions.closeWindow(s.windows[0].id));
    expect(s.activeId).toBeNull();
  });
});
