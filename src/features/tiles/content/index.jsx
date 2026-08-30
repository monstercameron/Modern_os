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

const Hint = ({ children, mono = false }) => (
  <div className={`text-[9px] text-white/80 bg-black/20 px-2 py-1 ${mono ? 'font-mono' : ''}`}>
    {children}
  </div>
);

// ---------------------------------------------------------------- email

function EmailTile({ app, badge, hovered, badgePulse, onQuick }) {
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
            <div className="text-white/90 text-[10px] mt-1">
              <div className="font-medium truncate">📧 Re: Project Update</div>
              <div className="text-white/70">From: team@company.com</div>
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
  return (
    <Frame>
      <Head>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {app.title}
            {badge > 0 && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">{badge}</span>}
          </div>
          {badge > 0 && (
            <div className="text-white/90 text-[10px] mt-1">
              <div className="font-medium">Sarah Johnson</div>
              <div className="text-white/70 truncate">"See you at the meeting..."</div>
            </div>
          )}
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
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">Today: 3 events</div>
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
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">Pending: 7 tasks</div>
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
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">San Francisco</div>
        </div>
        <Cloud className="opacity-90" size={24} />
      </Head>
      <div>
        <div className="text-3xl font-bold">72°</div>
        <div className="text-[11px] text-white/80">Partly Cloudy</div>
      </div>
    </Frame>
  );
}

// ----------------------------------------------------------------- files

function FilesTile({ app, hovered, Icon }) {
  return (
    <Frame>
      <Head>
        <div>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px] mt-1">Quick access</div>
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

export function DefaultTile({ app, hovered, Icon }) {
  return (
    <>
      <Icon className="opacity-90" size={28} />
      <motion.div animate={hovered ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} {...NUDGE}>
        <div className="font-semibold">{app.title}</div>
        <div className="text-white/70 text-[11px]">Tile</div>
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
