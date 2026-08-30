/**
 * Live tile feeds.
 *
 * The desktop had one hardcoded timer that incremented the email badge every
 * ten seconds, buried in useWindowManager. Live tiles need more than that and
 * they need it in one place: this module owns every simulated data source, the
 * schedule they fire on, and the animation each update asks for.
 *
 * Two rules shape it:
 *
 *   Tiles do not all move at once. A start screen where thirty tiles flip on
 *   the same frame is a slot machine, not a desktop. One scheduler ticks, and
 *   it lets at most MAX_CONCURRENT updates through per tick, so movement reads
 *   as things happening rather than as a wave.
 *
 *   The data is real to the rest of the desktop. Feeds that represent messages
 *   push their counts into the kernel's badges and post to the notification
 *   bus, so a tile, its taskbar badge and the notification centre never
 *   disagree about how many unread emails there are.
 */

import { store, dispatch, actions } from '../../kernel/index.js';
import eventBus, { TOPICS } from '../../utils/eventBus.js';

/** How often the scheduler looks for work. */
const TICK_MS = 1100;

/** Updates allowed to start on any one tick. */
const MAX_CONCURRENT = 2;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const round = (n, dp = 0) => Number(n.toFixed(dp));

/* ---------------------------------------------------------------- sources */

const SENDERS = ['Sarah Chen', 'Marcus Webb', 'Priya Raman', 'Tom Alvarez', 'Dana Okoye'];
const SUBJECTS = [
  'Re: Project update', 'Invoice #4471', 'Design review notes',
  'Lunch tomorrow?', 'Deploy went out', 'Q3 numbers',
];
const CHATS = [
  'Let us sync at 3', 'Pushed the fix', 'Are you seeing this?',
  'Ready when you are', 'Nice work on that', 'Call in 5',
];
const HEADLINES = [
  'Markets close higher for a third day',
  'New telescope image released',
  'City transit adds two night routes',
  'Open source project hits 1.0',
  'Storm expected to clear by Friday',
];
const CONDITIONS = ['Clear', 'Partly cloudy', 'Light rain', 'Overcast', 'Breezy'];
const TRACKS = [
  ['Summer Vibes', 'Kite Season'], ['Low Tide', 'Marbles'],
  ['Night Drive', 'Ceramic'], ['Paper Lanterns', 'Ivy & Co'],
];

/**
 * Each feed says how often it fires, what it produces, and how the tile should
 * play the change. `effect` is a request, not a guarantee: the motion settings
 * get the last word.
 */
const FEEDS = {
  email: {
    every: [14000, 26000],
    effect: 'flip',
    build: () => ({
      headline: pick(SENDERS),
      sub: pick(SUBJECTS),
      status: 'unread',
      badgeDelta: 1,
      notify: { app: 'Email', title: 'New message', message: pick(SUBJECTS) },
    }),
  },
  messages: {
    every: [12000, 22000],
    effect: 'slide',
    build: () => ({
      headline: pick(SENDERS).split(' ')[0],
      sub: pick(CHATS),
      status: 'unread',
      badgeDelta: 1,
      notify: { app: 'Messages', title: pick(SENDERS).split(' ')[0], message: pick(CHATS) },
    }),
  },
  chat: {
    every: [15000, 30000],
    effect: 'slide',
    build: () => ({ headline: pick(SENDERS).split(' ')[0], sub: pick(CHATS), status: 'live' }),
  },
  weather: {
    every: [16000, 28000],
    effect: 'roll',
    build: (prev) => {
      const base = prev?.value ?? 72;
      const next = Math.min(96, Math.max(48, base + Math.round(rand(-3, 3))));
      return { value: next, unit: '°', headline: pick(CONDITIONS), sub: 'San Francisco' };
    },
  },
  activity: {
    every: [4000, 7000],
    effect: 'roll',
    build: (prev) => {
      const base = prev?.value ?? 34;
      const next = Math.min(99, Math.max(4, base + Math.round(rand(-12, 12))));
      return {
        value: next, unit: '%', headline: 'CPU', sub: `${round(rand(2.1, 7.8), 1)} GB in use`,
        progress: next / 100, status: next > 85 ? 'alert' : 'live',
      };
    },
  },
  files: {
    every: [9000, 18000],
    effect: 'progress',
    build: (prev) => {
      const p = prev?.progress ?? 0;
      const next = p >= 1 ? 0 : Math.min(1, p + rand(0.12, 0.34));
      return {
        headline: next >= 1 ? 'Download complete' : 'modern-os-0.4.tar.gz',
        sub: next >= 1 ? '48.2 MB' : `${Math.round(next * 100)}% of 48.2 MB`,
        progress: next,
        status: next >= 1 ? 'ok' : 'sync',
      };
    },
  },
  news: {
    every: [10000, 19000],
    effect: 'flip',
    build: () => ({ headline: pick(HEADLINES), sub: 'Top stories', status: 'live' }),
  },
  music: {
    every: [20000, 34000],
    effect: 'slide',
    build: () => { const [t, a] = pick(TRACKS); return { headline: t, sub: a, status: 'live' }; },
  },
  photos: {
    every: [11000, 20000],
    effect: 'flip',
    build: (prev) => ({ value: (prev?.value ?? 1234) + Math.round(rand(1, 4)), headline: 'New photos', sub: 'Camera roll' }),
  },
  calendar: {
    every: [18000, 30000],
    effect: 'slide',
    build: () => ({
      headline: pick(['Standup', 'Design review', '1:1 with Dana', 'Retro']),
      sub: `in ${Math.round(rand(5, 55))} min`,
      status: 'live',
    }),
  },
  tasks: {
    every: [17000, 32000],
    effect: 'roll',
    build: (prev) => {
      const next = Math.max(0, (prev?.value ?? 7) + (Math.random() < 0.5 ? -1 : 1));
      return { value: next, unit: '', headline: 'Pending', sub: `${next} open` };
    },
  },
  database: {
    every: [8000, 15000],
    effect: 'roll',
    build: () => ({ value: Math.round(rand(120, 900)), unit: '/s', headline: 'Queries', sub: 'primary', status: 'live' }),
  },
  voice: {
    every: [22000, 40000],
    effect: 'attention',
    build: () => ({ headline: 'Voicemail', sub: pick(SENDERS), status: 'alert', badgeDelta: 1 }),
  },
  disk: {
    every: [13000, 24000],
    effect: 'progress',
    build: (prev) => {
      const p = Math.min(0.97, (prev?.progress ?? 0.62) + rand(-0.03, 0.05));
      return { headline: 'Macintosh HD', sub: `${Math.round((1 - p) * 500)} GB free`, progress: p, value: Math.round(p * 100), unit: '%', status: p > 0.9 ? 'alert' : 'ok' };
    },
  },
  podcast: {
    every: [21000, 38000],
    effect: 'slide',
    build: () => ({ headline: pick(['The Long Now', 'Field Notes', 'Signal & Noise', 'Deep Work']), sub: `Episode ${Math.round(rand(12, 240))}`, status: 'live' }),
  },
  videocall: {
    every: [19000, 33000],
    effect: 'attention',
    build: () => ({ headline: 'Incoming call', sub: pick(SENDERS), status: 'alert' }),
  },
  code: {
    every: [10000, 20000],
    effect: 'flip',
    build: () => {
      const ok = Math.random() > 0.25;
      return { headline: ok ? 'Build passed' : 'Build failed', sub: `main · ${Math.round(rand(1, 40))}s ago`, status: ok ? 'ok' : 'alert' };
    },
  },
  recorder: {
    every: [24000, 44000],
    effect: 'roll',
    build: (prev) => ({ value: (prev?.value ?? 3) + 1, unit: '', headline: 'Clips', sub: 'voice memos' }),
  },
  taskmgr: {
    every: [6000, 11000],
    effect: 'roll',
    build: () => ({ value: Math.round(rand(38, 96)), unit: '', headline: 'Processes', sub: 'running', status: 'live' }),
  },
};

/* ------------------------------------------------------------------ store */

/** appId -> { data, revision, effect, at } */
let state = Object.create(null);
const listeners = new Set();
let snapshot = state;

const emit = () => {
  snapshot = { ...state };
  for (const l of [...listeners]) l();
};

export function subscribeFeeds(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFeedSnapshot() {
  return snapshot;
}

/** The current entry for one tile, or undefined if it has no feed. */
export function getFeed(appId) {
  return snapshot[appId];
}

/** Every app id that has a feed, for anything that wants to show the set. */
export const FEED_IDS = Object.keys(FEEDS);

/* -------------------------------------------------------------- scheduler */

let timer = 0;
let due = Object.create(null);
let revision = 0;

const schedule = (id, now) => {
  const [lo, hi] = FEEDS[id].every;
  due[id] = now + rand(lo, hi);
};

function runOne(id, now) {
  const feed = FEEDS[id];
  const prev = state[id]?.data;
  const data = feed.build(prev);
  revision += 1;

  state[id] = { data, revision, effect: feed.effect, at: now };

  // Counts belong to the kernel, so the taskbar and the tile agree.
  if (data.badgeDelta) {
    const current = store.getState().badges[id] ?? 0;
    dispatch([actions.setBadge(id, current + data.badgeDelta), actions.animateBadge(id)]);
    setTimeout(() => {
      if (store.getState().animatingBadge === id) dispatch(actions.animateBadge(null));
    }, 600);
  }

  // Anything that would really notify you, does.
  if (data.notify) {
    eventBus.publish(TOPICS.NOTIFICATION_NEW, { ...data.notify, at: Date.now() });
  }

  schedule(id, now);
}

/**
 * Start the feeds. Idempotent, and returns a stop function.
 *
 * The first fire of each feed is spread across its own interval rather than
 * starting them all at zero, so the board does not erupt a second after the
 * start screen opens.
 */
export function startFeeds() {
  if (timer) return () => stopFeeds();

  const now = Date.now();
  for (const id of FEED_IDS) {
    const [lo, hi] = FEEDS[id].every;
    due[id] = now + rand(lo * 0.25, hi);
  }

  timer = setInterval(() => {
    const tickAt = Date.now();
    // Oldest-due first, so a feed that has been waiting is not starved by a
    // fast one that keeps jumping the queue.
    const ready = FEED_IDS
      .filter((id) => due[id] <= tickAt)
      .sort((a, b) => due[a] - due[b])
      .slice(0, MAX_CONCURRENT);

    if (ready.length === 0) return;
    for (const id of ready) runOne(id, tickAt);
    emit();
  }, TICK_MS);

  return () => stopFeeds();
}

export function stopFeeds() {
  clearInterval(timer);
  timer = 0;
}

/** Test seam: push a value straight in. */
export function __setFeed(id, data, effect = 'flip') {
  revision += 1;
  state[id] = { data, revision, effect, at: Date.now() };
  emit();
}
