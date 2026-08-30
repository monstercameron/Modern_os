/**
 * The three apps that predate the shared frame: Settings, Task Manager and the
 * tile configurator. They draw their own chrome, so they get the console and
 * the container-query context through withConsole rather than the full frame.
 */

import { withConsole } from './AppFrame.jsx';
import { SettingsApp as RawSettingsApp } from '../../apps/SettingsApp.jsx';
import { TaskManagerApp as RawTaskManagerApp } from '../../apps/TaskManagerApp.jsx';
import { TileConfiguratorApp as RawTileConfiguratorApp } from '../../apps/TileConfiguratorApp.jsx';
import { store, dispatch, actions } from '../../kernel/index.js';
import keymap, { MOD_CHOICES } from '../../services/keymap.js';

export const SettingsApp = withConsole(RawSettingsApp, {
  appId: 'settings',
  title: 'Settings',
  console: {
    intro: 'Settings console. Change the theme, motion or the window-manager modifier.',
    suggestions: ['dark mode', 'motion reduced', 'what is the modifier?'],
    handler: async (text) => {
      const q = text.toLowerCase();
      const raw = localStorage.getItem('modernos:v1:theme');
      const theme = raw ? JSON.parse(raw) : null;

      if (/modifier|shortcut key|\$mod/.test(q)) {
        return `The window-manager modifier is ${MOD_CHOICES[keymap.getMod()]?.label || keymap.getMod()}. ` +
          'Super is unavailable because Windows takes Meta+digit before the page sees it.';
      }
      if (/theme|colou?r|preset/.test(q) && theme) {
        return `Current theme: ${theme.name} (${theme.mode}).\n` +
          `accent ${theme.colors.accent}, surface ${theme.colors.surface}, ` +
          `${theme.radius}px radius, ${theme.borderWidth}px border, ${theme.shadow} shadow.`;
      }
      if (/motion|animation/.test(q) && theme) {
        return `Motion is ${theme.motion.level} at ${theme.motion.speed}x. ` +
          'The system reduce-motion preference is a floor over whatever is set here.';
      }
      if (/binding|keys|shortcut/.test(q)) {
        return keymap.list().filter((b) => b.description).slice(0, 12)
          .map((b) => `${b.id.padEnd(22)} ${b.description}`).join('\n');
      }
      return null;
    },
  },
});

export const TaskManagerApp = withConsole(RawTaskManagerApp, {
  appId: 'taskmgr',
  title: 'Task Manager',
  console: {
    intro: 'Task Manager console. List windows, or close one by name.',
    suggestions: ['what is running?', 'close notes', 'busiest workspace'],
    handler: async (text) => {
      const q = text.toLowerCase();
      const state = store.getState();

      if (/^close /.test(q)) {
        const name = q.slice(6).trim();
        const hit = state.windows.find((w) => w.appId.includes(name) || w.t.toLowerCase().includes(name));
        if (hit) { dispatch(actions.closeWindow(hit.id)); return `Closed ${hit.t}.`; }
        return `Nothing open matches "${name}".`;
      }
      if (/running|list|window/.test(q)) {
        return state.windows.length
          ? state.windows.map((w) => `${w.id}  ${w.t} — workspace ${w.ws}${w.floating ? ', floating' : ''}${w.m ? ', minimized' : ''}`).join('\n')
          : 'Nothing is running.';
      }
      if (/busiest|most/.test(q)) {
        const counts = {};
        state.windows.forEach((w) => { counts[w.ws] = (counts[w.ws] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return top ? `Workspace ${top[0]} has the most, with ${top[1]} windows.` : 'No windows open.';
      }
      return null;
    },
  },
});

export const TileConfiguratorApp = withConsole(RawTileConfiguratorApp, {
  appId: 'tileconfig',
  title: 'Tile Config',
  console: {
    intro: 'Tile configurator console. Ask about the grid or how slots are budgeted.',
    suggestions: ['how big is a 2x2 tile?', 'how many slots?'],
    handler: async (text) => {
      const q = text.toLowerCase();
      const m = q.match(/(\d)\s*[x×]\s*(\d)/);
      if (m) {
        const [cols, rows] = [Number(m[1]), Number(m[2])];
        const w = cols * 181 + (cols - 1) * 8 + 12;
        const h = rows * 96 + (rows - 1) * 8;
        return `A ${cols}x${rows} tile is about ${w}x${h}px, with ${Math.max(0, cols * rows * 2 - 2)} widget slots ` +
          `(a 1x1 has none — there is only room for the title and its action controls).`;
      }
      if (/grid|column|row/.test(q)) {
        return 'The desktop is a six-column grid with 96px rows and a themed gap. ' +
          'Tiles claim spans of it; the board fills downward and grows to the right.';
      }
      if (/slot|widget/.test(q)) {
        return 'Size buys a slot budget. Widgets spend it — a 2x1 clock takes two, a 2x2 analog clock takes four. ' +
          'A 1x1 tile has no slots at all.';
      }
      return null;
    },
  },
});
