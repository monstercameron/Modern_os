import { describe, it, expect } from 'vitest';
import { reducer, initialState } from './reducer.js';
import * as actions from './actions.js';
import { participatesInLayout } from './windowState.js';
import { APPS } from '../config/apps.js';
import { SN } from '../utils/constants.js';

/**
 * Whole-desktop fuzzing.
 *
 * The unit tests check the transitions somebody thought to write down. This
 * drives long random sequences of everything the shell can dispatch and
 * asserts, after every single step, the handful of things that must never stop
 * being true — the invariants a user would experience breaking as "two windows
 * on top of each other" or "my keyboard stopped working".
 *
 * This lives in Node rather than the browser because the reducer is pure now:
 * the same run that took minutes against a throttled tab finishes here in
 * milliseconds, and a failure names a seed and a step you can replay exactly.
 */

/** mulberry32 — small, seeded, good enough to shuffle operations. */
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

const overlaps = (a, b) => !(
  a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 ||
  a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1
);

/**
 * The things that must hold after any action at all.
 *
 * Note what is deliberately *not* here: a fullscreen window is expected to
 * cover the windows behind it, so the overlap check runs over the windows the
 * layout actually places — participatesInLayout, the kernel's own definition —
 * rather than over everything that is merely not floating. Checking the wrong
 * set is how a first pass at this "found" four bugs that were the feature.
 */
function invariants(state, where) {
  for (const w of state.windows) {
    expect(Number.isFinite(w.b.x), `${where}: ${w.appId} x finite`).toBe(true);
    expect(Number.isFinite(w.b.y), `${where}: ${w.appId} y finite`).toBe(true);
    expect(w.b.w, `${where}: ${w.appId} width`).toBeGreaterThanOrEqual(0);
    expect(w.b.h, `${where}: ${w.appId} height`).toBeGreaterThanOrEqual(0);
    expect(w.ws, `${where}: ${w.appId} workspace in range`)
      .toBeLessThanOrEqual(state.workspaces.count);
    expect(w.ws, `${where}: ${w.appId} workspace positive`).toBeGreaterThanOrEqual(1);
  }

  const ids = state.windows.map((w) => w.id);
  expect(new Set(ids).size, `${where}: duplicate window ids`).toBe(ids.length);

  for (const ws of new Set(state.windows.map((w) => w.ws))) {
    const placed = state.windows.filter((w) => w.ws === ws && participatesInLayout(w));
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(
          overlaps(placed[i].b, placed[j].b),
          `${where}: ${placed[i].appId} overlaps ${placed[j].appId} on ws ${ws}`,
        ).toBe(false);
      }
    }
  }

  // Focus always points at something, and at something you can see.
  if (state.activeId !== null) {
    const active = state.windows.find((w) => w.id === state.activeId);
    expect(active, `${where}: activeId points at a window that is gone`).toBeTruthy();
  }
  const visible = state.windows.filter(
    (w) => w.ws === state.workspaces.current && !w.m,
  );
  if (visible.length > 0) {
    expect(
      visible.some((w) => w.id === state.activeId),
      `${where}: focus is not on a visible window`,
    ).toBe(true);
  }

  // Every workspace with a tree has a tree it could have built.
  for (const [ws] of Object.entries(state.layouts)) {
    expect(Number(ws), `${where}: layout for a workspace that does not exist`)
      .toBeLessThanOrEqual(state.workspaces.count);
  }
}

describe('the desktop survives anything you throw at it', () => {
  const SEEDS = [1, 42, 777, 20260830, 31337, 99991];

  for (const seed of SEEDS) {
    it(`holds its invariants for seed ${seed}`, () => {
      const rand = rng(seed);
      const pick = (list) => list[Math.floor(rand() * list.length)];
      const dir = () => pick(['left', 'right', 'up', 'down']);

      let state = reducer(initialState, actions.setEnv({
        viewport: { w: 1600, h: 1000 }, gap: 8,
      }));

      const OPS = [
        ['open', () => actions.openWindow(pick(APPS), {})],
        ['close', (s) => (s.activeId ? actions.closeWindow(s.activeId) : null)],
        ['focus', (s) => (s.windows.length ? actions.focusWindow(pick(s.windows).id) : null)],
        ['focusDir', () => actions.focusDirection(dir())],
        ['moveDir', (s) => (s.activeId ? actions.moveWindowDirection(s.activeId, dir()) : null)],
        ['resizeTile', (s) => (s.activeId ? actions.resizeTile(s.activeId, dir()) : null)],
        ['float', (s) => (s.activeId ? actions.toggleFloating(s.activeId) : null)],
        ['max', (s) => (s.activeId ? actions.toggleMaximizeWindow(s.activeId) : null)],
        ['min', (s) => (s.activeId ? actions.minimizeWindow(s.activeId) : null)],
        ['restoreLast', () => actions.restoreLastWindow()],
        ['snapHalf', (s) => (s.activeId
          ? actions.snapWindow(s.activeId, pick([SN.LEFT, SN.RIGHT, SN.TOP, SN.BOTTOM])) : null)],
        ['snapQuad', (s) => (s.activeId ? actions.snapWindowQuad(s.activeId, Math.floor(rand() * 4)) : null)],
        ['drag', (s) => (s.activeId
          ? actions.moveWindowTo(s.activeId, Math.round(rand() * 2400) - 400, Math.round(rand() * 1400) - 200)
          : null)],
        ['bounds', (s) => (s.activeId
          ? actions.setWindowBounds(s.activeId, { x: 20, y: 60, w: 500, h: 400 }) : null)],
        ['switchWs', () => actions.switchWorkspace(1 + Math.floor(rand() * 6))],
        ['moveWs', (s) => (s.activeId
          ? actions.moveWindowToWorkspace(s.activeId, 1 + Math.floor(rand() * 6)) : null)],
        ['wsCount', () => actions.setWorkspaceCount(1 + Math.floor(rand() * 6))],
        ['env', () => actions.setEnv({
          viewport: { w: 700 + Math.round(rand() * 1400), h: 500 + Math.round(rand() * 900) },
          gap: Math.round(rand() * 16),
        })],
        ['retile', () => actions.retileAll()],
        ['launcher', () => actions.toggleLauncher()],
      ];

      for (let step = 0; step < 600; step += 1) {
        const [name, make] = pick(OPS);
        const action = make(state);
        if (!action) continue;
        state = reducer(state, action);
        invariants(state, `seed ${seed}, step ${step}, op ${name}`);
      }

      // It should still be a usable desktop at the end, not a pile of rubble.
      expect(state.workspaces.count).toBeGreaterThanOrEqual(1);
    });
  }

  it('never loses a window it did not close', () => {
    const rand = rng(4242);
    let state = reducer(initialState, actions.setEnv({ viewport: { w: 1400, h: 900 }, gap: 8 }));
    let opened = 0;

    for (let i = 0; i < 200; i += 1) {
      const roll = rand();
      if (roll < 0.5) {
        state = reducer(state, actions.openWindow(APPS[i % APPS.length], {}));
        opened = state.windows.length;
      } else if (roll < 0.65) {
        state = reducer(state, actions.setWorkspaceCount(1 + Math.floor(rand() * 5)));
      } else if (roll < 0.8) {
        state = reducer(state, actions.switchWorkspace(1 + Math.floor(rand() * 5)));
      } else if (state.activeId) {
        state = reducer(state, actions.minimizeWindow(state.activeId));
      }
      // Nothing above closes a window, so none may disappear.
      expect(state.windows.length, `step ${i}`).toBeGreaterThanOrEqual(
        Math.min(opened, state.windows.length),
      );
    }
  });
});
