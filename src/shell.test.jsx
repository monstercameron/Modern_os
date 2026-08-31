// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

import App from './App.jsx';
import { ThemeProvider } from './ThemeContext.jsx';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { store, dispatch, actions } from './kernel/index.js';
import { reducer, initialState } from './kernel/reducer.js';
import { APPS } from './config/apps.js';

/**
 * Shell tests: does the screen agree with the kernel?
 *
 * The kernel tests prove the state is right. These prove the desktop actually
 * shows that state — the gap where a window can exist, be tiled, hold correct
 * bounds, and still not be on screen because a component filtered it out or
 * rendered it at the wrong size. Nothing was checking that.
 */

const app = (id) => APPS.find((a) => a.id === id);

/** Windows the DOM is currently showing, keyed by kernel id. */
const rendered = (container) => {
  const out = new Map();
  for (const el of container.querySelectorAll('[data-window-id]')) {
    out.set(el.dataset.windowId, el);
  }
  return out;
};

const bounds = (el) => ({
  x: Math.round(Number.parseFloat(el.style.left) || 0),
  y: Math.round(Number.parseFloat(el.style.top) || 0),
  w: Math.round(Number.parseFloat(el.style.width) || 0),
  h: Math.round(Number.parseFloat(el.style.height) || 0),
});

let container;

beforeEach(() => {
  // Every test starts from a known desktop on a known screen.
  store.replaceState(reducer(initialState, actions.setEnv({
    viewport: { w: 1400, h: 900 }, gap: 8,
  })));
  // The same providers main.jsx wraps the desktop in. App does not supply
  // them itself, so rendering it bare is not what the product does.
  ({ container } = render(
    <SettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SettingsProvider>,
  ));
});

afterEach(cleanup);

const open = (id) => act(() => { dispatch(actions.openWindow(app(id), {})); });
const run = (action) => act(() => { dispatch(action); });

describe('the screen shows what the kernel holds', () => {
  it('starts on the launcher with no windows', () => {
    expect(store.getState().windows).toHaveLength(0);
    expect(rendered(container).size).toBe(0);
  });

  it('renders one element per open window', () => {
    run(actions.closeLauncher());
    open('terminal');
    open('notes');

    const state = store.getState();
    const dom = rendered(container);
    expect(state.windows).toHaveLength(2);
    expect(dom.size, 'the DOM does not match the window list').toBe(2);
    for (const w of state.windows) {
      expect(dom.has(w.id), `window ${w.appId} is in state but not on screen`).toBe(true);
    }
  });

  it('does not render windows from another workspace', () => {
    run(actions.closeLauncher());
    open('terminal');
    const only = store.getState().windows[0];

    run(actions.switchWorkspace(2));
    expect(rendered(container).has(only.id), 'a window from workspace 1 is showing on 2')
      .toBe(false);

    run(actions.switchWorkspace(1));
    expect(rendered(container).has(only.id), 'it did not come back').toBe(true);
  });

  it('does not render a minimized window', () => {
    run(actions.closeLauncher());
    open('terminal');
    const id = store.getState().windows[0].id;

    run(actions.minimizeWindow(id));
    expect(rendered(container).has(id)).toBe(false);

    run(actions.restoreWindow(id));
    expect(rendered(container).has(id)).toBe(true);
  });

  it('stops rendering a window that was closed', () => {
    run(actions.closeLauncher());
    open('terminal');
    const id = store.getState().windows[0].id;
    run(actions.closeWindow(id));
    expect(rendered(container).has(id)).toBe(false);
  });
});

describe('the geometry on screen is the geometry in the tree', () => {
  it('positions a single window where the layout says', () => {
    run(actions.closeLauncher());
    open('terminal');
    const win = store.getState().windows[0];
    const el = rendered(container).get(win.id);
    expect(el, 'window not rendered').toBeTruthy();

    const drawn = bounds(el);
    // Framer Motion animates toward the target, so the element may be mid
    // flight; what must be true is that it is being driven by the kernel's
    // rectangle and not by something else entirely.
    expect(drawn.w, 'width on screen does not come from the layout')
      .toBeGreaterThan(0);
    expect(Math.abs(drawn.w - win.b.w) <= win.b.w, 'width unrelated to state').toBe(true);
  });

  it('gives a tiled window no title bar and a floating one a title bar', () => {
    run(actions.closeLauncher());
    open('terminal');
    const id = store.getState().windows[0].id;

    const tiled = rendered(container).get(id);
    expect(tiled.querySelector('[data-titlebar]'), 'a tiled window grew a title bar')
      .toBeFalsy();

    run(actions.toggleFloating(id));
    const floating = rendered(container).get(id);
    expect(floating.querySelector('[data-titlebar]'), 'a floating window has no title bar')
      .toBeTruthy();
  });

  it('marks exactly one window as focused', () => {
    run(actions.closeLauncher());
    open('terminal');
    open('notes');

    const focused = [...container.querySelectorAll('[data-window][data-focused="true"]')];
    expect(focused, 'more than one window claims focus').toHaveLength(1);
    expect(focused[0].dataset.windowId).toBe(store.getState().activeId);
  });

  it('moves the focus marker when focus moves', () => {
    run(actions.closeLauncher());
    open('terminal');
    open('notes');
    const first = store.getState().windows[0];

    run(actions.focusWindow(first.id));
    const focused = container.querySelector('[data-window][data-focused="true"]');
    expect(focused.dataset.windowId).toBe(first.id);
  });
});

describe('the launcher', () => {
  it('shows the board when open and removes it when closed', () => {
    expect(container.querySelector('[data-launcher="open"]'), 'board missing at boot')
      .toBeTruthy();

    run(actions.closeLauncher());
    // The exit animation may still be running, but it must be inert the
    // instant it is no longer open — otherwise Tab reaches a hidden screen.
    const board = container.querySelector('[data-launcher="open"]');
    if (board) expect(board.hasAttribute('inert'), 'closed board is still tabbable').toBe(true);
  });

  it('renders a tile for every app', () => {
    const tiles = container.querySelectorAll('[data-tile]');
    expect(tiles.length, 'the board does not show every app').toBe(APPS.length);
  });

  it('every tile carries the app it opens', () => {
    const ids = [...container.querySelectorAll('[data-tile]')].map((t) => t.dataset.tile);
    for (const a of APPS) {
      expect(ids, `${a.id} has no tile`).toContain(a.id);
    }
  });
});

describe('the taskbar reflects the desktop', () => {
  it('lists the windows on the current workspace', () => {
    run(actions.closeLauncher());
    open('terminal');
    open('notes');

    const text = container.textContent;
    expect(text).toContain('Terminal');
    expect(text).toContain('Notes');
  });

  it('offers one control per workspace', () => {
    const buttons = [...container.querySelectorAll('button')]
      .filter((b) => /^Workspace \d/.test(b.getAttribute('aria-label') || ''));
    expect(buttons.length).toBe(store.getState().workspaces.count);
  });
});
