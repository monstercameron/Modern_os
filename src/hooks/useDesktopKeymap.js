import { useEffect } from 'react';
import keymap, { SCOPES } from '../services/keymap.js';
import { store, dispatch, actions } from '../kernel/index.js';
import { read, write } from '../services/persistence.js';
import { APPS } from '../config/apps.js';
import { SN } from '../utils/constants.js';

/**
 * The desktop's key bindings.
 *
 * All of them live here as data so a shortcuts UI can render and rebind them
 * later without touching component code. "$mod" is the window-manager modifier,
 * which defaults to Alt because Windows intercepts Meta+digit before a browser
 * tab ever sees it.
 */
export function useDesktopKeymap() {
  useEffect(() => {
    // Restore the user's chosen modifier before anything binds against it.
    const savedMod = read('keymapMod', null);
    if (savedMod) keymap.setMod(savedMod);

    const detach = keymap.attach(window);
    const bindings = [];

    const focusedId = () => store.getState().activeId;

    // ---- workspaces ----
    for (let n = 1; n <= 9; n += 1) {
      bindings.push([
        `$mod+${n}`,
        () => dispatch(actions.switchWorkspace(n)),
        { description: `Switch to workspace ${n}`, owner: 'desktop' },
      ]);
      bindings.push([
        `$mod+shift+${n}`,
        () => {
          const id = focusedId();
          if (id) dispatch(actions.moveWindowToWorkspace(id, n));
        },
        { description: `Move window to workspace ${n}`, owner: 'desktop' },
      ]);
    }

    // ---- windows ----
    bindings.push(
      ['$mod+q', () => { const id = focusedId(); if (id) dispatch(actions.closeWindow(id)); },
        { description: 'Close focused window', owner: 'desktop' }],
      ['$mod+m', () => { const id = focusedId(); if (id) dispatch(actions.minimizeWindow(id)); },
        { description: 'Minimize focused window', owner: 'desktop' }],
      ['$mod+f', () => { const id = focusedId(); if (id) dispatch(actions.toggleMaximizeWindow(id)); },
        { description: 'Toggle maximize', owner: 'desktop' }],
      ['$mod+v', () => { const id = focusedId(); if (id) dispatch(actions.toggleFloating(id)); },
        { description: 'Toggle tiling / floating', owner: 'desktop' }],
      ['$mod+left', () => { const id = focusedId(); if (id) dispatch(actions.snapWindow(id, SN.LEFT)); },
        { description: 'Snap window left', owner: 'desktop' }],
      ['$mod+right', () => { const id = focusedId(); if (id) dispatch(actions.snapWindow(id, SN.RIGHT)); },
        { description: 'Snap window right', owner: 'desktop' }],
      ['$mod+up', () => { const id = focusedId(); if (id) dispatch(actions.snapWindow(id, SN.TOP)); },
        { description: 'Snap window up', owner: 'desktop' }],
      ['$mod+down', () => { const id = focusedId(); if (id) dispatch(actions.snapWindow(id, SN.BOTTOM)); },
        { description: 'Snap window down', owner: 'desktop' }],
    );

    // ---- cycle focus ----
    bindings.push([
      '$mod+tab',
      () => {
        const state = store.getState();
        const onScreen = state.windows.filter((w) => w.ws === state.workspaces.current && !w.m);
        if (onScreen.length < 2) return;
        const index = onScreen.findIndex((w) => w.id === state.activeId);
        const next = onScreen[(index + 1) % onScreen.length];
        dispatch(actions.focusWindow(next.id));
      },
      { description: 'Focus next window', owner: 'desktop' },
    ]);

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

    // Tapping the modifier on its own toggles the launcher, the way a Super tap
    // opens a launcher on a tiling desktop.
    const offTap = keymap.onModTap(() => dispatch(actions.toggleLauncher()));

    return () => { unbind(); offTap(); detach(); };
  }, []);
}

/** Persist a modifier change. */
export function setDesktopMod(mod) {
  keymap.setMod(mod);
  write('keymapMod', mod);
}
