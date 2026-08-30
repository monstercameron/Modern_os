/**
 * Desktop agent.
 *
 * The global counterpart to an app's own console: it answers about, and acts
 * on, the desktop itself — windows, workspaces, the theme, the keymap — and it
 * can hand a question to whichever app is focused.
 *
 * There is no model behind this. It is a small intent matcher over the kernel,
 * which is honest about what the demo is: the interface is the point, and every
 * answer is derived from real state rather than invented.
 */

import { store, dispatch, actions } from '../../kernel/index.js';
import { APPS } from '../../config/apps.js';
import keymap, { MOD_CHOICES } from '../../services/keymap.js';
import eventBus from '../../utils/eventBus.js';

/** Topic an app's console listens on so the desktop can open or drive it. */
export const APP_CONSOLE_OPEN = 'app.console.open';
export const APP_CONSOLE_ASK = 'app.console.ask';

/** The label the rest of the UI shows for the modifier, not a re-derived one. */
const modLabel = () => MOD_CHOICES[keymap.getMod()]?.label || keymap.getMod();

const findApp = (text) => {
  const q = text.toLowerCase();
  // Longest title first, so "video call" beats "video".
  return [...APPS]
    .sort((a, b) => b.title.length - a.title.length)
    .find((a) => q.includes(a.title.toLowerCase()) || q.includes(a.id));
};

const describeWindows = (windows) => (windows.length
  ? windows.map((w) => `${w.t} — workspace ${w.ws}${w.floating ? ', floating' : ', tiled'}${w.m ? ', minimized' : ''}`).join('\n')
  : 'Nothing is open.');

/**
 * Answer a request against the whole desktop.
 * @returns {Promise<string|null>} null when nothing matched
 */
export async function runDesktopAgent(text) {
  const q = text.trim().toLowerCase();
  const state = store.getState();

  // ---- opening and closing apps ----
  if (/^(open|launch|start|run)\b/.test(q)) {
    const app = findApp(q);
    if (!app) return `I could not tell which app you meant. Try "open settings", or ask "what apps are there?".`;
    dispatch(actions.openWindow(app, {}));
    return `Opened ${app.title}.`;
  }

  if (/^(close|quit|kill)\b/.test(q)) {
    if (/all/.test(q)) {
      const n = state.windows.length;
      state.windows.forEach((w) => dispatch(actions.closeWindow(w.id)));
      return `Closed ${n} window${n === 1 ? '' : 's'}.`;
    }
    const app = findApp(q);
    const target = app
      ? state.windows.find((w) => w.appId === app.id)
      : state.windows.find((w) => w.id === state.activeId);
    if (!target) return app ? `${app.title} is not open.` : 'Nothing is focused.';
    dispatch(actions.closeWindow(target.id));
    return `Closed ${target.t}.`;
  }

  // ---- workspaces ----
  if (/workspace|desktop \d/.test(q)) {
    const n = parseInt(q.replace(/\D+/g, ''), 10);
    if (/move|send/.test(q) && n) {
      const id = state.activeId;
      if (!id) return 'Nothing is focused to move.';
      dispatch(actions.moveWindowToWorkspace(id, n));
      return `Moved ${state.windows.find((w) => w.id === id)?.t} to workspace ${n}.`;
    }
    if (n) {
      dispatch(actions.switchWorkspace(n));
      return `Switched to workspace ${n}.`;
    }
    return Array.from({ length: state.workspaces.count }, (_, i) => {
      const ws = i + 1;
      const on = state.windows.filter((w) => w.ws === ws);
      return `${ws === state.workspaces.current ? '→' : ' '} ${ws}: ${on.length ? on.map((w) => w.t).join(', ') : 'empty'}`;
    }).join('\n');
  }

  // ---- window layout ----
  if (/float|untile/.test(q)) {
    const id = state.activeId;
    if (!id) return 'Nothing is focused.';
    dispatch(actions.toggleFloating(id));
    const w = store.getState().windows.find((x) => x.id === id);
    return `${w.t} is now ${w.floating ? 'floating' : 'tiled'}.`;
  }
  if (/tile|arrange|layout/.test(q)) {
    const tiled = state.windows.filter((w) => !w.floating && !w.m && w.ws === state.workspaces.current);
    return tiled.length
      ? `Workspace ${state.workspaces.current} is tiled:\n${tiled.map((w) => `${w.t} — ${w.b.w}x${w.b.h} at ${w.b.x},${w.b.y}`).join('\n')}`
      : 'Nothing is tiled on this workspace.';
  }

  // ---- what is running ----
  if (/what.*(open|running)|list windows|windows/.test(q)) {
    return describeWindows(state.windows);
  }
  if (/what apps|which apps|list apps/.test(q)) {
    return `${APPS.length} apps:\n${APPS.map((a) => a.title).join(', ')}`;
  }

  // ---- theme ----
  if (/theme|colou?r|dark|light/.test(q)) {
    const raw = localStorage.getItem('modernos:v1:theme');
    const theme = raw ? JSON.parse(raw) : null;
    if (!theme) return 'No theme is stored yet.';
    if (/dark|light/.test(q) && /switch|make|set|turn/.test(q)) {
      return `Open Settings › Personalization to switch — the desktop agent does not write theme state directly, ` +
        `so the change stays somewhere you can see and undo it.`;
    }
    return `${theme.name} (${theme.mode}). accent ${theme.colors.accent}, ${theme.radius}px radius, ` +
      `${theme.borderWidth}px border, ${theme.shadow} shadow, motion ${theme.motion.level} at ${theme.motion.speed}x.`;
  }

  // ---- keys ----
  if (/shortcut|keybind|binding|hotkey|keys/.test(q)) {
    const list = keymap.list().filter((b) => b.description);
    return `The window-manager modifier is ${modLabel()}.\n\n` +
      list.slice(0, 14).map((b) => `${b.id.padEnd(20)} ${b.description}`).join('\n');
  }

  // ---- routing to an app ----
  const routed = /^(ask|tell)\s+(\w+)/.exec(q);
  if (routed) {
    const app = findApp(routed[2]);
    if (!app) return `I do not know an app called "${routed[2]}".`;
    const open = state.windows.find((w) => w.appId === app.id);
    if (!open) return `${app.title} is not open. Say "open ${app.title.toLowerCase()}" first.`;
    dispatch(actions.focusWindow(open.id));
    eventBus.publish(APP_CONSOLE_ASK, {
      appId: app.id,
      text: text.replace(/^(ask|tell)\s+\w+\s*/i, ''),
    });
    return `Passed that to ${app.title}. Its console has the answer.`;
  }

  // ---- status ----
  if (/status|summary|state|how many/.test(q)) {
    const { windows, workspaces } = state;
    return [
      `${windows.length} window${windows.length === 1 ? '' : 's'} across ${workspaces.count} workspaces.`,
      `On workspace ${workspaces.current}: ${windows.filter((w) => w.ws === workspaces.current).length}.`,
      `${windows.filter((w) => w.floating).length} floating, ${windows.filter((w) => w.m).length} minimized.`,
      `Modifier: ${modLabel()}.`,
    ].join('\n');
  }

  return null;
}

/** The greeting and prompts the global agent opens with. */
export const DESKTOP_AGENT_INTRO =
  'Desktop agent. I can open and close apps, move around workspaces, describe the ' +
  'layout, read the theme and the keymap, and hand a question to the focused app.';

export const DESKTOP_AGENT_SUGGESTIONS = [
  'what is open?',
  'open settings',
  'workspaces',
  'shortcuts',
];
