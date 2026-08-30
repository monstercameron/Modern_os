/**
 * Sample data for the demo apps.
 *
 * Kept in one place so the apps stay presentation code, and so the content is
 * consistent across them — the same people appear in Mail, Messages, Contacts
 * and Calendar, which is what makes the desktop feel like one machine rather
 * than a folder of unrelated screens.
 *
 * Everything here is invented. No app talks to a network.
 */

export const PEOPLE = [
  { id: 'sarah', name: 'Sarah Johnson', role: 'Design lead', initials: 'SJ', color: '#e3008c' },
  { id: 'mike', name: 'Mike Chen', role: 'Backend', initials: 'MC', color: '#0078d4' },
  { id: 'alex', name: 'Alex Rivera', role: 'Product', initials: 'AR', color: '#7fba00' },
  { id: 'priya', name: 'Priya Nair', role: 'Data', initials: 'PN', color: '#f7a600' },
  { id: 'tom', name: 'Tom Okafor', role: 'QA', initials: 'TO', color: '#8b5cf6' },
];

export const personById = (id) => PEOPLE.find((p) => p.id === id);

export const MAIL = [
  {
    id: 'm1', from: 'sarah', subject: 'Re: Tiling layout review',
    preview: 'The dwindle split feels right at three windows. Past four it gets cramped on a laptop.',
    body:
      'The dwindle split feels right at three windows. Past four it gets cramped on a laptop screen.\n\n' +
      'Two things I would change:\n\n' +
      '1. Let the split ratio be dragged, not just 50/50.\n' +
      '2. A "monocle" mode that zooms the focused pane to full and back.\n\n' +
      'Neither blocks the release.',
    time: '09:12', unread: true, folder: 'inbox', starred: true,
  },
  {
    id: 'm2', from: 'mike', subject: 'Event bus subscriber audit',
    preview: 'Half the topics still publish to nobody. Listing them so we can decide what to wire.',
    body:
      'I went through every publish call. Half the topics still have zero subscribers.\n\n' +
      'Live: window.open, window.close, window.focus, taskbar.window.action\n' +
      'Dead: media.*, notification.clearAll, contextMenu.action (partly)\n\n' +
      'Suggest we either wire them or delete them before adding more.',
    time: '08:40', unread: true, folder: 'inbox',
  },
  {
    id: 'm3', from: 'priya', subject: 'Usage numbers for the demo',
    preview: 'Pulled the session data. Median session is 4 minutes, which is about a tour.',
    body:
      'Pulled the session data for the public demo.\n\n' +
      'Median session: 4m 12s\nMedian windows opened: 3\nMost opened app: Terminal, then Settings.\n\n' +
      'People are touring, not working. Worth optimising the first sixty seconds.',
    time: 'Yesterday', unread: false, folder: 'inbox',
  },
  {
    id: 'm4', from: 'alex', subject: 'Keyboard shortcut collisions',
    preview: 'Ctrl+Shift+N and +T are gone to the browser. Confirmed on Chrome and Edge.',
    body:
      'Confirmed on Chrome and Edge: Ctrl+Shift+N, +T, +W, +I, +J and +R never reach the page.\n\n' +
      'Whatever we bind has to avoid those or it silently does nothing.',
    time: 'Yesterday', unread: false, folder: 'inbox',
  },
  {
    id: 'm5', from: 'tom', subject: 'Sent: regression pass results',
    preview: 'Ran the full pass after the kernel change. Everything green except the drag test.',
    body: 'Ran the full pass after the kernel change. Everything green except the drag test, which needs real pointer events.',
    time: 'Mon', unread: false, folder: 'sent',
  },
];

export const MESSAGES = {
  sarah: [
    { id: 1, from: 'sarah', text: 'Did the tilt land?', time: '10:02' },
    { id: 2, from: 'me', text: 'Yes — eight degrees, gloss follows the pointer.', time: '10:03' },
    { id: 3, from: 'sarah', text: 'Does it respect reduce-motion?', time: '10:03' },
    { id: 4, from: 'me', text: 'It does. System preference is a floor over the theme.', time: '10:04' },
    { id: 5, from: 'sarah', text: 'Good. See you at the review.', time: '10:05' },
  ],
  mike: [
    { id: 1, from: 'mike', text: 'Kernel reducer is in?', time: '09:20' },
    { id: 2, from: 'me', text: 'In, and the three duplicate window models are down to one.', time: '09:22' },
    { id: 3, from: 'mike', text: 'That was overdue.', time: '09:22' },
  ],
  alex: [
    { id: 1, from: 'alex', text: "Let's sync up at 3pm about the roadmap", time: '08:15' },
  ],
};

export const EVENTS = [
  { id: 'e1', title: 'Standup', start: '09:00', end: '09:15', people: ['sarah', 'mike', 'alex'], tone: 'accent' },
  { id: 'e2', title: 'Layout review', start: '11:00', end: '12:00', people: ['sarah'], tone: 'default' },
  { id: 'e3', title: 'Focus block — tiling engine', start: '13:00', end: '15:00', people: [], tone: 'success' },
  { id: 'e4', title: 'Roadmap sync', start: '15:00', end: '15:30', people: ['alex'], tone: 'default' },
];

export const TASKS = [
  { id: 't1', title: 'Wire the dead event-bus topics', done: false, priority: 'high', due: 'Today', tag: 'kernel' },
  { id: 't2', title: 'Draggable split ratios', done: false, priority: 'medium', due: 'Thu', tag: 'tiling' },
  { id: 't3', title: 'Monocle mode for the focused pane', done: false, priority: 'low', due: 'Next week', tag: 'tiling' },
  { id: 't4', title: 'Convert apps off the theme bridge', done: false, priority: 'medium', due: 'Thu', tag: 'theming' },
  { id: 't5', title: 'Ctrl+Shift collision audit', done: true, priority: 'high', due: 'Mon', tag: 'input' },
  { id: 't6', title: 'Tile content registry', done: true, priority: 'high', due: 'Mon', tag: 'tiles' },
  { id: 't7', title: 'Persist theme across reloads', done: true, priority: 'low', due: 'Mon', tag: 'theming' },
];

export const NOTES = [
  {
    id: 'n1', title: 'Tiling rules', updated: '10 min ago', tag: 'design',
    body:
      'Dwindle, not master-stack.\n\n' +
      '- First window owns the viewport.\n' +
      '- Each new window splits the focused one along its longer axis.\n' +
      '- Floating is a per-window flag, not a separate mode.\n' +
      '- Snapping or dragging by hand implies floating.\n',
  },
  {
    id: 'n2', title: 'Why Ctrl+Shift', updated: '1 hour ago', tag: 'input',
    body:
      'Super is unreachable: Windows takes Meta+digit for taskbar activation before\n' +
      'the page sees it. Ctrl+Shift is the next best thing that a browser tab\n' +
      'actually receives, minus the dozen combinations Chrome keeps for itself.\n',
  },
  {
    id: 'n3', title: 'Theme token list', updated: 'Yesterday', tag: 'theming',
    body:
      'colors: accent, accentText, background, surface, surfaceAlt, text,\n' +
      'textMuted, border, danger, success\n\n' +
      'shape: radius, borderWidth, tileGap, windowGap\n' +
      'depth: shadow\n' +
      'motion: level, speed, per-effect switches\n',
  },
];

export const FILES = [
  { id: 'f1', name: 'kernel', type: 'folder', size: '—', modified: 'Today' },
  { id: 'f2', name: 'features', type: 'folder', size: '—', modified: 'Today' },
  { id: 'f3', name: 'services', type: 'folder', size: '—', modified: 'Today' },
  { id: 'f4', name: 'reducer.js', type: 'code', size: '18 KB', modified: '10 min ago' },
  { id: 'f5', name: 'bsp.js', type: 'code', size: '4 KB', modified: '1 hour ago' },
  { id: 'f6', name: 'theme.js', type: 'code', size: '9 KB', modified: '1 hour ago' },
  { id: 'f7', name: 'design-notes.md', type: 'doc', size: '12 KB', modified: 'Yesterday' },
  { id: 'f8', name: 'layout-sketch.png', type: 'image', size: '840 KB', modified: 'Yesterday' },
  { id: 'f9', name: 'session-data.csv', type: 'sheet', size: '2.1 MB', modified: 'Mon' },
];

export const TRACKS = [
  { id: 1, title: 'Electric Dreams', artist: 'Neon Lights', album: 'Synthwave City', len: '4:05' },
  { id: 2, title: 'Midnight Drive', artist: 'Retro Wave', album: 'Highway 84', len: '3:18' },
  { id: 3, title: 'Starlight', artist: 'Cosmic Ray', album: 'Galaxy Tour', len: '5:12' },
  { id: 4, title: 'Ocean Breeze', artist: 'Chill Beats', album: 'Summer Vibes', len: '4:27' },
  { id: 5, title: 'Tokyo Nights', artist: 'City Pop', album: 'Urban Dreams', len: '3:43' },
  { id: 6, title: 'Neon Paradise', artist: 'Retro Wave', album: 'Highway 84', len: '3:09' },
];

export const PHOTOS = [
  { id: 'p1', title: 'Harbour at dusk', album: 'Trips', tone: '#0e7490', date: 'Aug 2026' },
  { id: 'p2', title: 'Studio desk', album: 'Work', tone: '#7c3aed', date: 'Aug 2026' },
  { id: 'p3', title: 'Kitchen window', album: 'Home', tone: '#b45309', date: 'Jul 2026' },
  { id: 'p4', title: 'Rooftop', album: 'Trips', tone: '#be123c', date: 'Jul 2026' },
  { id: 'p5', title: 'Ferns', album: 'Walks', tone: '#15803d', date: 'Jun 2026' },
  { id: 'p6', title: 'Night bus', album: 'Walks', tone: '#1e40af', date: 'Jun 2026' },
  { id: 'p7', title: 'Market stall', album: 'Trips', tone: '#c2410c', date: 'May 2026' },
  { id: 'p8', title: 'Long exposure', album: 'Walks', tone: '#4338ca', date: 'May 2026' },
  { id: 'p9', title: 'Cat, unimpressed', album: 'Home', tone: '#a16207', date: 'Apr 2026' },
];

export const WEATHER = {
  place: 'San Francisco',
  now: { temp: 72, feels: 70, condition: 'Partly cloudy', wind: 11, humidity: 64, uv: 5 },
  hourly: [
    { h: '10', t: 68 }, { h: '11', t: 70 }, { h: '12', t: 72 }, { h: '13', t: 74 },
    { h: '14', t: 75 }, { h: '15', t: 74 }, { h: '16', t: 72 }, { h: '17', t: 69 },
  ],
  days: [
    { d: 'Mon', hi: 74, lo: 58, condition: 'Partly cloudy' },
    { d: 'Tue', hi: 71, lo: 57, condition: 'Fog then sun' },
    { d: 'Wed', hi: 69, lo: 56, condition: 'Overcast' },
    { d: 'Thu', hi: 73, lo: 58, condition: 'Sunny' },
    { d: 'Fri', hi: 76, lo: 60, condition: 'Sunny' },
  ],
};

export const NEWS = [
  { id: 'a1', title: 'Tiling window managers reach the browser', source: 'Interface Weekly', time: '2h', tag: 'Desktop' },
  { id: 'a2', title: 'The case against hamburger menus, again', source: 'Design Notes', time: '4h', tag: 'Design' },
  { id: 'a3', title: 'Container queries land everywhere', source: 'Platform Status', time: '6h', tag: 'Web' },
  { id: 'a4', title: 'What a keyboard shortcut owes the user', source: 'Input Journal', time: '1d', tag: 'Input' },
  { id: 'a5', title: 'Reduce-motion is not an edge case', source: 'A11y Digest', time: '1d', tag: 'Access' },
];

export const CONTACTS = PEOPLE.map((p, i) => ({
  ...p,
  email: `${p.id}@example.com`,
  phone: `+1 555 010${i + 1}`,
  starred: i < 2,
}));

/** Rows for the database demo. */
export const DB_TABLES = {
  windows: {
    columns: ['id', 'app_id', 'workspace', 'floating', 'width', 'height'],
    rows: [
      ['1-a4f2', 'terminal', 1, false, 538, 1025],
      ['2-b81c', 'files', 1, false, 538, 509],
      ['3-c93d', 'music', 1, false, 538, 509],
      ['4-d21e', 'settings', 2, true, 760, 500],
    ],
  },
  themes: {
    columns: ['name', 'mode', 'radius', 'border', 'shadow'],
    rows: [
      ['Dark', 'dark', 0, 1, 'medium'],
      ['Light', 'light', 0, 1, 'soft'],
      ['Purple Haze', 'dark', 8, 2, 'strong'],
      ['High Contrast', 'dark', 0, 3, 'none'],
    ],
  },
};
