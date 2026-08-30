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
     * The arrows move focus.
     *
     * This is the most-pressed key in a tiling desktop, and it had been given
     * to snapping and then to resizing -- neither of which is what an arrow
     * means when you are looking at a grid of windows. The neighbour is
     * chosen geometrically, so it works the same for tiled and floating
     * windows.
     *
     * Adding Alt moves the window instead of the focus, which is the meaning
     * Alt already carries: $mod+Alt+N moves a window to workspace N. A tiled
     * window trades places with its neighbour; a floating one snaps, since a
     * window outside the layout has no neighbour to trade with.
     */
    const DIRECTIONS = [['left', SN.LEFT], ['right', SN.RIGHT], ['up', SN.TOP], ['down', SN.BOTTOM]];

    for (const [direction, snapType] of DIRECTIONS) {
      bindings.push([
        `$mod+${direction}`,
        () => dispatch(actions.focusDirection(direction)),
        { description: `Focus the window ${direction}`, owner: 'desktop' },
      ]);
      bindings.push([
        `$mod+alt+${direction}`,
        () => {
          const state = store.getState();
          const win = state.windows.find((w) => w.id === state.activeId);
          if (!win) return;
          if (win.floating) dispatch(actions.snapWindow(win.id, snapType));
          else dispatch(actions.moveWindowDirection(win.id, direction));
        },
        { description: `Move the window ${direction}`, owner: 'desktop' },
      ]);
    }

    /*
     * Resize is a mode, the way it is in i3.
     *
     * There is no free chord left for it -- $mod is Ctrl+Shift, so the Shift
     * row does not exist and Alt is spoken for -- and resizing is a thing you
     * do in bursts anyway. $mod+R latches, bare arrows size the focused
     * window, Escape or Enter leaves. The RESIZE scope shadows the desktop
     * and owns the keyboard while it is up, so the arrows work even when the
     * caret is sitting in an app's text field.
     */
    const setResizeMode = (on) => {
      dispatch(actions.setResizeMode(on));
      if (on) keymap.pushScope(SCOPES.RESIZE);
      else keymap.popScope(SCOPES.RESIZE);
    };

    // Not $mod+R: Ctrl+Shift+R is the browser's hard reload, and it was also
    // sitting under a stray settings-reset listener. S for size.
    bindings.push(['$mod+s', () => setResizeMode(!store.getState().resizeMode),
      { description: 'Resize mode: arrows size, Esc leaves', owner: 'desktop' }]);

    for (const [direction, snapType] of DIRECTIONS) {
      const sizeIt = () => {
        const state = store.getState();
        const win = state.windows.find((w) => w.id === state.activeId);
        if (!win) return;
        if (win.floating) dispatch(actions.snapWindow(win.id, snapType));
        else dispatch(actions.resizeTile(win.id, direction));
      };
      bindings.push([direction, sizeIt, { scope: SCOPES.RESIZE, description: `Size ${direction}`, owner: 'resize' }]);
      bindings.push([`$mod+${direction}`, sizeIt, { scope: SCOPES.RESIZE, description: `Size ${direction}`, owner: 'resize' }]);
    }
    bindings.push(
      ['escape', () => setResizeMode(false), { scope: SCOPES.RESIZE, description: 'Leave resize mode', owner: 'resize' }],
      ['enter', () => setResizeMode(false), { scope: SCOPES.RESIZE, description: 'Leave resize mode', owner: 'resize' }],
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

    // ---- task manager ----
    /*
     * Not Ctrl+Shift+Escape. That is Windows' own Task Manager chord and the
     * OS takes it before the page is told anything, so the binding looked
     * right and never once fired. It is in RESERVED_CHORDS now so the audit
     * catches anyone trying again.
     */
    bindings.push([
      '$mod+escape',
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
