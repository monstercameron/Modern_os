import { useEffect } from 'react';
import keymap, { SCOPES } from '../services/keymap.js';
import { store, dispatch, actions } from '../kernel/index.js';
import { read, write } from '../services/persistence.js';
import { APPS } from '../config/apps.js';
import { SN } from '../utils/constants.js';
import eventBus from '../utils/eventBus.js';
import { APP_CONSOLE_OPEN } from '../features/agent/desktopAgent.js';

/**
 * The desktop's key bindings.
 *
 * All of them live here as data so a shortcuts UI can render and rebind them
 * later without touching component code. "$mod" is the window-manager modifier,
 * which defaults to Ctrl+Shift: a browser tab never receives Super+digit,
 * because Windows binds it to taskbar activation first.
 */
export function useDesktopKeymap() {
  useEffect(() => {
    // Restore the user's chosen modifier before anything binds against it.
    const savedMod = read('keymapMod', null);
    // Ctrl+Shift is the default; see the collision notes below.
    if (savedMod) keymap.setMod(savedMod);

    const detach = keymap.attach(window);
    const bindings = [];

    const focusedId = () => store.getState().activeId;

    /*
     * $mod is Ctrl+Shift. Two consequences shape the bindings below:
     *
     *   1. "$mod+shift+N" would collapse into "$mod+N", so moving a window to
     *      a workspace uses Alt as the third modifier instead.
     *   2. Ctrl+Shift is crowded with browser shortcuts. Everything here is
     *      checked against RESERVED_CHORDS in the keymap service, which warns
     *      in dev if a binding would never fire. Deliberately avoided:
     *      N T W Q P O B D M A E (browser/window), I J C (devtools),
     *      R and Delete (reload, clear data), and Tab (tab cycling).
     */

    // ---- workspaces: Ctrl+Shift+1..5, Ctrl+Shift+Alt+1..5 to move ----
    for (let n = 1; n <= 9; n += 1) {
      bindings.push([
        `$mod+${n}`,
        () => dispatch(actions.switchWorkspace(n)),
        { description: `Switch to workspace ${n}`, owner: 'desktop' },
      ]);
      bindings.push([
        `$mod+alt+${n}`,
        () => {
          const id = focusedId();
          if (id) dispatch(actions.moveWindowToWorkspace(id, n));
        },
        { description: `Move window to workspace ${n}`, owner: 'desktop' },
      ]);
    }

    // ---- windows ----
    bindings.push(
      // Ctrl+Shift+Q is the browser's on some platforms, so close uses X.
      ['$mod+x', () => { const id = focusedId(); if (id) dispatch(actions.closeWindow(id)); },
        { description: 'Close focused window', owner: 'desktop' }],
      /*
       * Hide and unhide are a lettered pair.
       *
       * Minimize was on $mod+Down, which read as "close" to anyone who tried
       * it: the other three arrows snap the window, so Down looked like it
       * should snap to the bottom, and instead the window disappeared with no
       * visible trace. The arrows are a consistent set again and hiding has a
       * mnemonic of its own, next to the key that brings it back.
       */
      ['$mod+h', () => { const id = focusedId(); if (id) dispatch(actions.minimizeWindow(id)); },
        { description: 'Hide focused window', owner: 'desktop' }],
      ['$mod+u', () => dispatch(actions.restoreLastWindow()),
        { description: 'Unhide the last hidden window', owner: 'desktop' }],
      ['$mod+f', () => { const id = focusedId(); if (id) dispatch(actions.toggleMaximizeWindow(id)); },
        { description: 'Toggle maximize', owner: 'desktop' }],
      ['$mod+v', () => { const id = focusedId(); if (id) dispatch(actions.toggleFloating(id)); },
        { description: 'Toggle tiling / floating', owner: 'desktop' }],
    );

    /*
     * The arrows are placement-aware.
     *
     * A floating window snaps to a half of the screen. A tiled one moves the
     * divider it shares with its neighbour, which is what resizing means
     * inside a layout -- snapping it would have to eject it from the tree to
     * give it those bounds, so pressing an arrow silently turned a tiled
     * window into a floating one. The arrows arrange what you have; $mod+V is
     * the key that changes how a window is managed.
     */
    const arrow = (direction, snapType) => () => {
      const state = store.getState();
      const win = state.windows.find((w) => w.id === state.activeId);
      if (!win) return;
      if (win.floating) dispatch(actions.snapWindow(win.id, snapType));
      else dispatch(actions.resizeTile(win.id, direction));
    };

    bindings.push(
      ['$mod+left', arrow('left', SN.LEFT),
        { description: 'Narrower pane, or snap left', owner: 'desktop' }],
      ['$mod+right', arrow('right', SN.RIGHT),
        { description: 'Wider pane, or snap right', owner: 'desktop' }],
      ['$mod+up', arrow('up', SN.TOP),
        { description: 'Shorter pane, or snap up', owner: 'desktop' }],
      ['$mod+down', arrow('down', SN.BOTTOM),
        { description: 'Taller pane, or snap down', owner: 'desktop' }],
    );

    // ---- cycle focus (Ctrl+Shift+Tab belongs to the browser) ----
    const cycle = (step) => () => {
      const state = store.getState();
      const onScreen = state.windows.filter((w) => w.ws === state.workspaces.current && !w.m);
      if (onScreen.length < 2) return;
      const index = onScreen.findIndex((w) => w.id === state.activeId);
      const next = onScreen[(index + step + onScreen.length) % onScreen.length];
      dispatch(actions.focusWindow(next.id));
    };
    bindings.push(
      ['$mod+period', cycle(1), { description: 'Focus next window', owner: 'desktop' }],
      ['$mod+comma', cycle(-1), { description: 'Focus previous window', owner: 'desktop' }],
    );

    // ---- agents ----
    bindings.push(
      // The focused app's own console. `~` on its own does the same when the
      // caret is not in a field; this chord works even while typing.
      ['$mod+`', () => {
        const state = store.getState();
        const win = state.windows.find((w) => w.id === state.activeId);
        if (!win) return;
        eventBus.publish(APP_CONSOLE_OPEN, { appId: win.appId });
      }, { description: "Open the focused app's agent", owner: 'desktop' }],

      /*
       * The desktop agent is an app, not an overlay, so it opens the same way
       * everything else does and the tiling engine places it. Opening it twice
       * focuses the window that already exists — its manifest is single
       * instance — rather than stacking copies.
       */
      ['$mod+g', () => {
        const agent = APPS.find((a) => a.id === 'agent');
        if (agent) dispatch(actions.openWindow(agent, {}));
      }, { description: 'Open the desktop agent', owner: 'desktop' }],
    );

    // ---- launcher ----
    bindings.push(
      ['$mod+space', () => dispatch(actions.toggleLauncher()),
        { description: 'Toggle the start screen', owner: 'desktop' }],
      ['escape', () => dispatch(actions.closeLauncher()),
        { scope: SCOPES.LAUNCHER, description: 'Close the start screen', owner: 'launcher' }],
    );

    // ---- task manager, kept from the previous ad-hoc listener ----
    bindings.push([
      'ctrl+shift+escape',
      () => {
        const taskmgr = APPS.find((a) => a.id === 'taskmgr');
        if (taskmgr) dispatch(actions.openWindow(taskmgr, {}));
      },
      { description: 'Open Task Manager', owner: 'desktop' },
    ]);

    const unbind = keymap.bindAll(bindings);

    /*
     * Tapping the modifier on its own toggles the launcher, the way a Super tap
     * opens one on a tiling desktop. This only applies to single-key modifiers
     * (Alt, Super) — with the Ctrl+Shift default there is no unambiguous "tap",
     * and a bare Ctrl press is far too common to hang the start screen off, so
     * the keymap does not report one. $mod+Space is the binding that always
     * works.
     */
    const offTap = keymap.onModTap(() => dispatch(actions.toggleLauncher()));

    return () => { unbind(); offTap(); detach(); };
  }, []);
}

/** Persist a modifier change. */
export function setDesktopMod(mod) {
  keymap.setMod(mod);
  write('keymapMod', mod);
}
