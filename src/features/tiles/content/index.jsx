/**
 * Tile Content Registry
 *
 * One real component per tile face, looked up by app id. Previously this was a
 * single if-chain inside a useCallback in Tile.jsx, which meant a tile face
 * could not hold state of its own without breaking the rules of hooks — the
 * Photos face tried, and only survived because an earlier duplicate branch
 * shadowed it.
 *
 * Every component here receives the same props, so adding a face is adding a
 * file and a line in the map at the bottom.
 *
 * @typedef {object} TileFaceProps
 * @property {object} app          - the APPS entry
 * @property {number} badge        - unread count for this app
 * @property {boolean} hovered     - pointer is over the tile
 * @property {boolean} badgePulse  - badge just changed, play the pulse
 * @property {boolean} playing     - media tiles: transport state
 * @property {Function} setPlaying
 * @property {Function} onQuick    - quick action from the tile face
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MessageCircle, Calendar, FileText, Image, Cloud, Play, Pause,
} from 'lucide-react';
import { Flip, Slide, Roll, Peek, Marquee } from '../motionKit.jsx';
import { useTileFeed } from '../useTileFeed.js';

const REVEAL = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
};

const NUDGE = {
  transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
};

/** Small pill button used across the tile faces. */
function QuickButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium ${className}`}
    >
      {children}
    </button>
  );
}

const Frame = ({ children }) => (
  <div className="h-full flex flex-col justify-between">{children}</div>
);

const Head = ({ children }) => (
  <div className="flex items-start justify-between">{children}</div>
);

/**
 * The two-line preview a live tile shows under its title.
 *
 * The animation is chosen by the feed, not by the face: a headline that
 * replaces the last one flips, another message in a thread slides, a number
 * rolls. Faces pass the feed straight through and get the right movement.
 */
function LiveLine({ feed, fallback = null }) {
  const { data, revision, effect } = feed;
  if (!data) return fallback;

  const body = (
    <>
      <Marquee className="font-medium text-[10px]">{data.headline}</Marquee>
      {data.sub && <div className="text-white/70 text-[10px] truncate">{data.sub}</div>}
    </>
  );

  if (effect === 'flip') return <Flip trigger={revision} className="mt-1">{body}</Flip>;
  if (effect === 'slide') return <Slide trigger={revision} className="mt-1 h-[26px]">{body}</Slide>;
  return <Peek trigger={revision} className="mt-1">{body}</Peek>;
}

const Hint = ({ children, mono = false }) => (
  <div className={`text-[9px] text-white/80 bg-black/20 px-2 py-1 ${mono ? 'font-mono' : ''}`}>
    {children}
  </div>
);

// ---------------------------------------------------------------- email

function EmailTile({ app, badge, hovered, badgePulse, onQuick }) {
  const feed = useTileFeed('email');
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {app.title}
            {badge > 0 && (
              <motion.span
                className="text-xs bg-white/30 px-1.5 py-0.5 rounded"
                animate={badgePulse ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {badge}
              </motion.span>
            )}
          </div>
          {badge > 0 && (
            <div className="text-white/90">
              <LiveLine
                feed={feed}
                fallback={<div className="text-[10px] mt-1 text-white/70">Nothing new</div>}
              />
            </div>
          )}
        </div>
        <Mail className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL}>
          <QuickButton onClick={() => onQuick?.({ action: 'compose' })}>✉️ Compose New</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------- messages

function MessagesTile({ app, badge, hovered, onQuick }) {
  const feed = useTileFeed('messages');
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {app.title}
            {badge > 0 && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">{badge}</span>}
          </div>
          {badge > 0 && <div className="text-white/90"><LiveLine feed={feed} /></div>}
        </div>
        <MessageCircle className="opacity-90" size={24} />
      </Head>
      {hovered && badge > 0 && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>⏰ 2 min ago</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'reply', contact: 'Sarah Johnson' })}>
            💬 Reply to Sarah
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ----------------------------------------------------------------- chat

function ChatTile({ app, hovered, onQuick }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[10px] mt-1">
            <div className="font-medium">Team Standup</div>
            <div className="text-white/70 truncate">Alex: "Let's sync up at 3pm"</div>
          </div>
        </div>
        <MessageCircle className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>👥 12 members • 5 new</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'openChat', chat: 'team-standup' })}>
            💬 Open Chat
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------- calendar

function CalendarTile({ app, hovered, onQuick }) {
  const feed = useTileFeed('calendar');
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <Slide trigger={feed.revision} className="text-white/70 text-[11px] mt-1 h-[15px]">
            {feed.data ? `${feed.data.headline} ${feed.data.sub}` : 'Today: 3 events'}
          </Slide>
        </div>
        <Calendar className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>9:00 Team Meeting</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'addEvent' })}>➕ Add Event</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- tasks

function TasksTile({ app, hovered, onQuick, Icon }) {
  const feed = useTileFeed('tasks');
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1 flex items-baseline gap-1">
            <span>Pending:</span><Roll value={feed.data?.value ?? 7} /><span>tasks</span>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>✓ Finish presentation</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'addTask' })}>➕ Add Task</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- notes

function NotesTile({ app, hovered, onQuick }) {
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">12 notes</div>
        </div>
        <FileText className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>📝 Meeting notes...</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'newNote' })}>➕ New Note</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- music

function MusicTile({ playing, setPlaying }) {
  return (
    <Frame>
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-white/30 grid place-items-center text-white/80 text-[10px] font-semibold flex-shrink-0">🎵</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">Summer Vibes</div>
          <div className="text-white/70 text-[11px] truncate">Artist Name</div>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }}
          className="flex-1 px-2 py-1.5 bg-black/30 border border-white/30 text-[11px] font-medium flex items-center justify-center gap-1"
        >
          {playing ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Play</>}
        </button>
        <button onClick={(e) => e.stopPropagation()} className="px-2 py-1.5 bg-black/30 border border-white/30 text-[11px]">
          ⏭️
        </button>
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------- video

function VideoTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[10px] mt-1">
            <div className="font-medium truncate">Nature Documentary</div>
            <div className="text-white/70">⏱️ 23:45 / 45:00</div>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      <div className="space-y-1">
        <div className="h-1 bg-black/30 rounded-full overflow-hidden">
          <div className="h-full bg-white/80" style={{ width: '52%' }} />
        </div>
        {hovered && (
          <motion.div {...REVEAL}>
            <QuickButton onClick={() => onQuick?.({ action: 'resume', video: 'nature-doc' })}>
              ▶️ Continue Watching
            </QuickButton>
          </motion.div>
        )}
      </div>
    </Frame>
  );
}

// --------------------------------------------------------------- photos

const PHOTO_ICONS = ['📷', '🏖️', '🌄', '🌆', '🎨', '📸', '🖼️', '🎭', '🌅', '🗻'];

/**
 * The face that motivated this registry: it keeps a cycling index, which is
 * only legal now that it is a component in its own right.
 */
function PhotosTile({ app, hovered }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!hovered) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHOTO_ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">1,234 photos</div>
        </div>
        <Image className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={`${i}-${index}`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="aspect-square bg-white/30 grid place-items-center text-[10px]"
            >
              {PHOTO_ICONS[(index + i) % PHOTO_ICONS.length]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </Frame>
  );
}

// ----------------------------------------------------------------- maps

function MapsTile({ app, hovered, onQuick, Icon }) {
  const hour = new Date().getHours();
  const destination = hour >= 17 ? 'Home' : hour >= 8 ? 'Work' : 'Coffee Shop';
  const eta = hour >= 17 ? '15 min' : hour >= 8 ? '12 min' : '5 min';

  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[10px] mt-1">
            <div className="font-medium">📍 {destination}</div>
            <div className="text-white/70">🚗 {eta} via Market St</div>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint>Traffic: Light</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'navigate', destination })}>
            🗺️ Start Navigation
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// --------------------------------------------------------------- weather

function WeatherTile({ app }) {
  const feed = useTileFeed('weather');
  const temp = feed.data?.value ?? 72;
  const condition = feed.data?.headline ?? 'Partly cloudy';
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">{feed.data?.sub ?? 'San Francisco'}</div>
        </div>
        <Cloud className="opacity-90" size={24} />
      </Head>
      <div>
        {/* The temperature rolls in the direction it moved. */}
        <div className="text-3xl font-bold flex items-baseline">
          <Roll value={temp} />
          <span>°</span>
        </div>
        <Flip trigger={condition} className="text-[11px] text-white/80">{condition}</Flip>
      </div>
    </Frame>
  );
}

// ----------------------------------------------------------------- files

function FilesTile({ app, hovered, Icon }) {
  const feed = useTileFeed('files');
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <Flip trigger={feed.revision} className="text-white/70 text-[11px] mt-1">
            {feed.data ? feed.data.sub : 'Quick access'}
          </Flip>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 truncate">📄 Project.docx</div>
          <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 truncate">📊 Report.xlsx</div>
        </motion.div>
      )}
    </Frame>
  );
}

// -------------------------------------------------------------- terminal

function TerminalTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[9px] mt-1 font-mono bg-black/20 px-1 py-0.5 truncate">
            $ npm run dev
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <Hint mono>✓ Exit code: 0</Hint>
          <QuickButton onClick={() => onQuick?.({ action: 'rerun', command: 'npm run dev' })}>
            🔄 Re-run Command
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// --------------------------------------------------------------- browser

function BrowserTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">Bookmarks</div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="flex gap-1">
          <QuickButton onClick={() => onQuick?.({ url: 'https://www.msn.com' })} className="flex-1">MSN</QuickButton>
          <QuickButton onClick={() => onQuick?.({ url: 'https://news.google.com' })} className="flex-1">News</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------ code

function CodeTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[9px] mt-1 space-y-0.5">
            <div className="font-mono bg-black/20 px-1 py-0.5 truncate">📄 App.jsx:142</div>
            <div className="font-mono bg-black/20 px-1 py-0.5 truncate text-white/70">📄 utils.js:56</div>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL}>
          <QuickButton onClick={() => onQuick?.({ action: 'openRecent', file: 'App.jsx' })}>
            📝 Open Recent
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------- pdf

function PdfTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[10px] mt-1">
            <div className="font-medium truncate">Q3 Report.pdf</div>
            <div className="text-white/70">📄 Page 12 of 24</div>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="space-y-1">
          <div className="h-1 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-white/80" style={{ width: '50%' }} />
          </div>
          <QuickButton onClick={() => onQuick?.({ action: 'continue', file: 'Q3-report.pdf', page: 12 })}>
            📖 Continue Reading
          </QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// -------------------------------------------------------------- contacts

function ContactsTile({ app, hovered, onQuick, Icon }) {
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/90 text-[10px] mt-1 space-y-0.5">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white/30 rounded-full grid place-items-center text-[8px]">SJ</div>
              <span className="text-white/90">Sarah Johnson</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white/30 rounded-full grid place-items-center text-[8px]">MC</div>
              <span className="text-white/70">Mike Chen</span>
            </div>
          </div>
        </div>
        <Icon className="opacity-90" size={24} />
      </Head>
      {hovered && (
        <motion.div {...REVEAL} className="flex gap-1">
          <QuickButton onClick={() => onQuick?.({ action: 'call', contact: 'Sarah Johnson' })} className="flex-1">📞 Call</QuickButton>
          <QuickButton onClick={() => onQuick?.({ action: 'message', contact: 'Sarah Johnson' })} className="flex-1">💬 Text</QuickButton>
        </motion.div>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------ text

function TextTile({ app, hovered, Icon }) {
  return (
    <Frame>
      <Icon className="opacity-90" size={28} />
      <motion.div animate={hovered ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} {...NUDGE}>
        <div className="font-semibold">{app.title}</div>
        <div className="mt-2 p-2 bg-black/15 text-white/80 text-[10px] font-mono leading-snug">
          project.md — "Metro OS design..."
        </div>
      </motion.div>
    </Frame>
  );
}

// --------------------------------------------------------------- default

/**
 * The fallback face.
 *
 * It is not a placeholder any more: any app with a feed gets its live value
 * here without needing a face of its own, which is what makes the whole board
 * move rather than the eight tiles someone hand-wrote.
 */
export function DefaultTile({ app, hovered, Icon }) {
  const feed = useTileFeed(app.id);
  const value = feed.data?.value;

  return (
    <>
      <Icon className="opacity-90" size={28} />
      <motion.div animate={hovered ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} {...NUDGE}>
        <div className="font-semibold">{app.title}</div>
        {value != null ? (
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold leading-none"><Roll value={value} /></span>
            {feed.data.unit && <span className="text-[11px] text-white/70">{feed.data.unit}</span>}
            <span className="text-[10px] text-white/60 ml-1 truncate">{feed.data.headline}</span>
          </div>
        ) : feed.data ? (
          <LiveLine feed={feed} />
        ) : (
          <div className="text-white/70 text-[11px]">Tile</div>
        )}
      </motion.div>
    </>
  );
}

/**
 * app id -> tile face. Anything not listed falls back to DefaultTile.
 */
export const TILE_CONTENT = {
  email: EmailTile,
  messages: MessagesTile,
  chat: ChatTile,
  calendar: CalendarTile,
  tasks: TasksTile,
  notes: NotesTile,
  music: MusicTile,
  video: VideoTile,
  photos: PhotosTile,
  maps: MapsTile,
  weather: WeatherTile,
  files: FilesTile,
  terminal: TerminalTile,
  browser: BrowserTile,
  code: CodeTile,
  pdf: PdfTile,
  contacts: ContactsTile,
  text: TextTile,
};

export function getTileContent(appId) {
  return TILE_CONTENT[appId] || DefaultTile;
}

/** Renders the face registered for this app. */
export function TileContent(props) {
  const Face = getTileContent(props.app.id);
  return <Face {...props} />;
}

export default TileContent;
