import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX,
  Mic, Square, Eraser, Undo2, ChevronLeft, ChevronRight, Heart, Gauge,
} from 'lucide-react';
import {
  AppFrame, Button, Card, Row, Muted, Meter, Tag, Empty, SectionTitle,
  Stat, Segmented, Toggle, Sparkline,
} from './AppFrame.jsx';
import { TRACKS, PHOTOS } from './demoData.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const lenToSeconds = (len) => {
  const [m, s] = len.split(':').map(Number);
  return m * 60 + s;
};

/* ----------------------------------------------------------------- Music */

export function MusicApp() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(() => new Set([1]));

  const track = TRACKS[current];
  const total = lenToSeconds(track.len);

  const skip = (n) => {
    setElapsed(0);
    setCurrent((c) => (shuffle
      ? Math.floor(Math.random() * TRACKS.length)
      : (c + n + TRACKS.length) % TRACKS.length));
  };

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          if (repeat) return 0;
          skip(1);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, total, repeat, shuffle]);

  const toggleLike = (id) => setLiked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <AppFrame
      appId="music"
      title="Music"
      subtitle={`${track.title} — ${track.artist}${playing ? ' · playing' : ''}`}
      toolbar={
        <>
          <Button active={shuffle} onClick={() => setShuffle((s) => !s)} title="Shuffle"><Shuffle size={12} /></Button>
          <Button active={repeat} onClick={() => setRepeat((r) => !r)} title="Repeat one"><Repeat size={12} /></Button>
        </>
      }
      console={{
        intro: 'Music console. Play, pause, skip, set the volume, or name a track.',
        suggestions: ['play', 'next', 'volume 30', "what's playing?"],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/pause|stop/.test(q)) { setPlaying(false); return 'Paused.'; }
          if (/play|resume/.test(q) && !/playing/.test(q)) {
            const named = TRACKS.findIndex((x) => q.includes(x.title.toLowerCase()));
            if (named >= 0) { setCurrent(named); setElapsed(0); }
            setPlaying(true);
            return `Playing "${named >= 0 ? TRACKS[named].title : track.title}".`;
          }
          if (/next|skip/.test(q)) { skip(1); return 'Skipped forward.'; }
          if (/previous|back/.test(q)) { skip(-1); return 'Back one track.'; }
          if (/^volume|set volume/.test(q)) {
            const n = parseInt(q.replace(/\D+/g, ''), 10);
            if (!Number.isNaN(n)) { setVolume(Math.min(100, n)); setMuted(false); return `Volume ${Math.min(100, n)}%.`; }
          }
          if (/shuffle/.test(q)) { setShuffle((s) => !s); return `Shuffle ${shuffle ? 'off' : 'on'}.`; }
          if (/playing|what/.test(q)) return `${track.title} — ${track.artist} (${track.album}), ${mmss(elapsed)} of ${track.len}.`;
          if (/liked|favourite|favorite/.test(q)) {
            const l = TRACKS.filter((x) => liked.has(x.id));
            return l.length ? l.map((x) => `- ${x.title}`).join('\n') : 'Nothing liked yet.';
          }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 grid place-items-center text-xl shrink-0"
              style={{ backgroundColor: 'var(--theme-accent-soft)', borderRadius: 'var(--theme-radius-sm)' }}>♪</div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{track.title}</div>
              <Muted className="text-[12px] truncate block">{track.artist} · {track.album}</Muted>
            </div>
            <button onClick={() => toggleLike(track.id)} aria-label="Like">
              <Heart size={15} fill={liked.has(track.id) ? 'currentColor' : 'none'}
                style={{ color: liked.has(track.id) ? 'var(--theme-danger)' : 'var(--theme-text-muted)' }} />
            </button>
          </div>

          <div className="mt-3">
            <input
              type="range" min={0} max={total} value={elapsed}
              onChange={(e) => setElapsed(Number(e.target.value))}
              aria-label="Seek" className="w-full"
            />
            <div className="flex justify-between">
              <Muted className="text-[10px] font-mono">{mmss(elapsed)}</Muted>
              <Muted className="text-[10px] font-mono">{track.len}</Muted>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2 flex-1">
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input type="range" min={0} max={100} value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                aria-label="Volume" className="w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => skip(-1)} aria-label="Previous"><SkipBack size={15} /></Button>
              <Button variant="accent" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </Button>
              <Button variant="ghost" onClick={() => skip(1)} aria-label="Next"><SkipForward size={15} /></Button>
            </div>
            <div className="flex-1" />
          </div>
        </Card>

        <div>
          <SectionTitle action={<Muted className="text-[10px]">{liked.size} liked</Muted>}>All tracks</SectionTitle>
          {TRACKS.map((t, i) => (
            <Row key={t.id} selected={i === current} onClick={() => { setCurrent(i); setElapsed(0); setPlaying(true); }}
              className="flex items-center gap-2">
              <span className="w-4 shrink-0 grid place-items-center">
                {i === current && playing
                  ? <span className="flex gap-[2px] items-end h-3">
                      {[0, 1, 2].map((b) => (
                        <span key={b} className="w-[2px]" style={{
                          height: `${5 + ((i + b * 3) % 3) * 3}px`,
                          backgroundColor: 'var(--theme-accent)',
                          animation: `pulse .8s ${b * 0.12}s infinite`,
                        }} />
                      ))}
                    </span>
                  : <Muted className="text-[10px] font-mono">{i + 1}</Muted>}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] truncate">{t.title}</div>
                <Muted className="text-[10px] truncate block">{t.artist}</Muted>
              </div>
              {liked.has(t.id) && <Heart size={10} fill="currentColor" style={{ color: 'var(--theme-danger)' }} />}
              <Muted className="text-[10px] font-mono shrink-0">{t.len}</Muted>
            </Row>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

/* ---------------------------------------------------------------- Photos */

export function PhotosApp() {
  const [album, setAlbum] = useState('All');
  const [index, setIndex] = useState(null);
  const [favourites, setFavourites] = useState(() => new Set());
  const albums = ['All', ...new Set(PHOTOS.map((p) => p.album))];
  const shown = album === 'All' ? PHOTOS : PHOTOS.filter((p) => p.album === album);
  const photo = index === null ? null : shown[index];

  const step = (n) => setIndex((i) => (i === null ? 0 : (i + n + shown.length) % shown.length));

  // Arrow keys drive the lightbox once it is open.
  useEffect(() => {
    if (index === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.stopPropagation(); step(1); }
      if (e.key === 'ArrowLeft') { e.stopPropagation(); step(-1); }
      if (e.key === 'Escape') { e.stopPropagation(); setIndex(null); }
    };
    const frame = document.querySelector('[data-app-frame="photos"]');
    frame?.addEventListener('keydown', onKey);
    return () => frame?.removeEventListener('keydown', onKey);
  }, [index, shown.length]);

  const toggleFav = (id) => setFavourites((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <AppFrame
      appId="photos"
      title="Photos"
      subtitle={`${shown.length} in ${album} · ${favourites.size} favourites`}
      console={{
        intro: 'Photos console. Filter by album, or open one.',
        suggestions: ['show trips', 'how many photos?', 'open rooftop'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hitAlbum = albums.find((a) => q.includes(a.toLowerCase()));
          if (hitAlbum) { setAlbum(hitAlbum); setIndex(null); return `Showing ${hitAlbum}.`; }
          const hitPhoto = shown.findIndex((p) => q.includes(p.title.toLowerCase().split(' ')[0]));
          if (hitPhoto >= 0) { setIndex(hitPhoto); return `Opened "${shown[hitPhoto].title}".`; }
          if (/how many|count/.test(q)) return `${PHOTOS.length} photos across ${albums.length - 1} albums.`;
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {albums.map((a) => (
            <Row key={a} selected={album === a} onClick={() => { setAlbum(a); setIndex(null); }}
              className="flex items-center">
              <span className="text-[12px] flex-1">{a}</span>
              <Muted className="text-[10px]">{a === 'All' ? PHOTOS.length : PHOTOS.filter((p) => p.album === a).length}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      {photo ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 grid place-items-center p-4 relative">
            <button onClick={() => step(-1)} aria-label="Previous photo"
              className="absolute left-2 p-2" style={{ color: 'var(--theme-text-muted)' }}><ChevronLeft size={20} /></button>
            <div className="w-full max-w-md aspect-[4/3] grid place-items-center text-white text-sm"
              style={{ backgroundColor: photo.tone, borderRadius: 'var(--theme-radius)' }}>
              {photo.title}
            </div>
            <button onClick={() => step(1)} aria-label="Next photo"
              className="absolute right-2 p-2" style={{ color: 'var(--theme-text-muted)' }}><ChevronRight size={20} /></button>
          </div>
          <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate">{photo.title}</div>
              <Muted className="text-[10px]">{photo.album} · {photo.date} · {index + 1} of {shown.length}</Muted>
            </div>
            <Button className="ml-auto" onClick={() => toggleFav(photo.id)}>
              <Heart size={12} fill={favourites.has(photo.id) ? 'currentColor' : 'none'} />
            </Button>
            <Button onClick={() => setIndex(null)}>Back</Button>
          </div>
        </div>
      ) : (
        <div className="p-3 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(94px, 1fr))' }}>
          {shown.map((p, i) => (
            <button key={p.id} onClick={() => setIndex(i)}
              className="aspect-square relative overflow-hidden text-left transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: p.tone, borderRadius: 'var(--theme-radius-sm)', transitionDuration: 'var(--motion-fast)' }}>
              <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white/90 truncate">{p.title}</span>
              {favourites.has(p.id) && (
                <Heart size={11} fill="currentColor" className="absolute top-1.5 right-1.5" style={{ color: '#fff' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- Video */

export function VideoApp() {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(52);
  const [quality, setQuality] = useState('1080p');
  const [captions, setCaptions] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setPos((p) => (p >= 100 ? 0 : p + 0.6)), 300);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <AppFrame
      appId="video"
      title="Video"
      subtitle={`Nature Documentary · ${quality}${captions ? ' · CC' : ''}`}
      toolbar={<Segmented options={['720p', '1080p', '4K']} value={quality} onChange={setQuality} />}
      console={{
        intro: 'Video console. Play, pause, seek, or change quality.',
        suggestions: ['play', 'seek 75', 'captions on'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/pause/.test(q)) { setPlaying(false); return 'Paused.'; }
          if (/play/.test(q)) { setPlaying(true); return 'Playing.'; }
          if (/caption|subtitle/.test(q)) { const on = !/off/.test(q); setCaptions(on); return `Captions ${on ? 'on' : 'off'}.`; }
          if (/4k|1080|720/.test(q)) { const m = q.match(/4k|1080p?|720p?/)[0]; setQuality(m === '4k' ? '4K' : m.endsWith('p') ? m : `${m}p`); return `Quality ${m}.`; }
          if (/seek/.test(q)) { const n = parseInt(q.replace(/\D+/g, ''), 10); if (!Number.isNaN(n)) { setPos(Math.min(100, n)); return `Seeked to ${n}%.`; } }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="aspect-video grid place-items-center relative overflow-hidden"
          style={{ backgroundColor: '#000', borderRadius: 'var(--theme-radius-sm)' }}>
          <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}
            className="w-12 h-12 grid place-items-center transition-transform hover:scale-110"
            style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)', borderRadius: '50%', transitionDuration: 'var(--motion-fast)' }}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          {captions && (
            <div className="absolute bottom-6 px-2 py-1 text-[11px] text-white" style={{ backgroundColor: 'rgba(0,0,0,.6)' }}>
              …the tide retreats, and the shoreline changes shape overnight.
            </div>
          )}
          <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Seek" className="absolute bottom-1 left-2 right-2 w-auto" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Muted className="text-[11px] font-mono">{mmss(pos * 27)} / 45:00</Muted>
          <Tag tone={playing ? 'accent' : 'default'}>{playing ? 'Playing' : 'Paused'}</Tag>
          <label className="flex items-center gap-1.5 text-[11px] ml-auto">
            <Toggle checked={captions} onChange={setCaptions} label="Captions" /> Captions
          </label>
        </div>
        <Card className="p-3">
          <SectionTitle>Up next</SectionTitle>
          {['Coastlines', 'Deep Forest', 'Night Skies'].map((t, i) => (
            <Row key={t} className="flex items-center gap-2 px-0">
              <Muted className="text-[10px] font-mono w-4">{i + 1}</Muted>
              <span className="text-[12px] flex-1">{t}</span>
              <Muted className="text-[10px]">{38 + i * 4}:00</Muted>
            </Row>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------- Voice / audio recorder */

function RecorderLike({ appId, title }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState(() => Array(28).fill(8));
  const [clips, setClips] = useState([
    { id: 1, name: 'Standup notes', len: '1:04' },
    { id: 2, name: 'Layout idea', len: '0:38' },
  ]);

  useEffect(() => {
    if (!recording) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    const l = setInterval(() => setLevels((prev) => [...prev.slice(1), 10 + Math.round(Math.random() * 75)]), 110);
    return () => { clearInterval(t); clearInterval(l); };
  }, [recording]);

  const stop = () => {
    if (seconds > 0) {
      setClips((prev) => [{ id: Date.now(), name: `Clip ${prev.length + 1}`, len: mmss(seconds) }, ...prev]);
    }
    setRecording(false);
    setSeconds(0);
    setLevels(Array(28).fill(8));
  };

  return (
    <AppFrame
      appId={appId}
      title={title}
      subtitle={recording ? `Recording · ${mmss(seconds)}` : `${clips.length} clips`}
      console={{
        intro: `${title} console. Start and stop recording, or list clips.`,
        suggestions: ['start recording', 'stop', 'list clips'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/start|record/.test(q)) { setRecording(true); return 'Recording started.'; }
          if (/stop/.test(q)) { stop(); return 'Stopped and saved.'; }
          if (/list|clip/.test(q)) return clips.map((c) => `- ${c.name} (${c.len})`).join('\n');
          if (/delete|clear/.test(q)) { setClips([]); return 'Cleared all clips.'; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-4 grid place-items-center gap-3">
          <div className="flex items-end gap-[3px] h-14 w-full justify-center">
            {levels.map((v, i) => (
              <div key={i} className="w-1.5"
                style={{
                  height: `${v}%`,
                  backgroundColor: recording ? 'var(--theme-accent)' : 'var(--theme-border)',
                  transition: 'height var(--motion-fast) linear',
                  borderRadius: 1,
                }} />
            ))}
          </div>
          <div className="font-mono text-lg tabular-nums">{mmss(seconds)}</div>
          {recording
            ? <Button variant="danger" onClick={stop}><Square size={13} /> Stop</Button>
            : <Button variant="accent" onClick={() => setRecording(true)}><Mic size={13} /> Record</Button>}
        </Card>
        <div>
          <SectionTitle>Clips</SectionTitle>
          {clips.length === 0 && <Empty title="No clips" hint="Press Record to make one." />}
          {clips.map((c) => (
            <Card key={c.id} className="flex items-center gap-2 px-3 py-2 mb-1.5">
              <Play size={12} />
              <span className="text-[12px] flex-1 truncate">{c.name}</span>
              <Muted className="text-[10px] font-mono">{c.len}</Muted>
              <button onClick={() => setClips((p) => p.filter((x) => x.id !== c.id))}
                aria-label="Delete clip" style={{ color: 'var(--theme-danger)' }}>×</button>
            </Card>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

export const VoiceApp = () => <RecorderLike appId="voice" title="Voice" />;
export const AudioRecorderApp = () => <RecorderLike appId="recorder" title="Recorder" />;

/* ---------------------------------------------------------------- Camera */

const FILTERS = {
  none: 'none',
  mono: 'grayscale(1)',
  warm: 'sepia(.45) saturate(1.4)',
  cool: 'hue-rotate(180deg) saturate(1.2)',
};

export function CameraApp() {
  const [shots, setShots] = useState([]);
  const [filter, setFilter] = useState('none');
  const [countdown, setCountdown] = useState(0);

  const capture = () => setShots((prev) => [
    { id: Date.now(), tone: `hsl(${(prev.length * 57) % 360} 55% 45%)`, filter },
    ...prev,
  ].slice(0, 12));

  const timed = () => {
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); capture(); return 0; }
        return c - 1;
      });
    }, 700);
  };

  return (
    <AppFrame
      appId="camera"
      title="Camera"
      subtitle={`${shots.length} shots · ${filter} filter`}
      toolbar={<Segmented options={Object.keys(FILTERS)} value={filter} onChange={setFilter} />}
      console={{
        intro: 'Camera console. Take a shot, use the timer, or change filter.',
        suggestions: ['take a photo', 'timer', 'filter mono'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/timer|countdown/.test(q)) { timed(); return 'Three, two, one…'; }
          if (/take|shot|photo|capture/.test(q)) { capture(); return 'Captured.'; }
          if (/clear/.test(q)) { setShots([]); return 'Roll cleared.'; }
          const f = Object.keys(FILTERS).find((k) => q.includes(k));
          if (f) { setFilter(f); return `Filter set to ${f}.`; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="aspect-video grid place-items-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--theme-surface-alt), var(--theme-background))',
            borderRadius: 'var(--theme-radius-sm)',
            filter: FILTERS[filter],
          }}>
          {countdown > 0
            ? <div className="text-5xl font-semibold" style={{ color: 'var(--theme-accent)' }}>{countdown}</div>
            : <Muted className="text-[12px]">Viewfinder (simulated)</Muted>}
          <button onClick={capture} aria-label="Shutter"
            className="absolute bottom-3 w-11 h-11 border-4 transition-transform active:scale-90"
            style={{ borderColor: 'var(--theme-accent)', backgroundColor: 'var(--theme-surface)', borderRadius: '50%' }} />
          <Button className="absolute bottom-4 right-3" onClick={timed}>Timer</Button>
        </div>
        {shots.length === 0
          ? <Empty title="No shots yet" hint="Press the shutter, or say “take a photo” in the console." />
          : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
              {shots.map((s) => (
                <div key={s.id} className="aspect-square"
                  style={{ backgroundColor: s.tone, filter: FILTERS[s.filter], borderRadius: 'var(--theme-radius-sm)' }} />
              ))}
            </div>
          )}
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Drawing */

export function DrawingApp() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const strokes = useRef([]);
  const [color, setColor] = useState('#60a5fa');
  const [size, setSize] = useState(4);
  const palette = ['#60a5fa', '#e3008c', '#7fba00', '#f7a600', '#ffffff', '#111111'];

  const paint = (e) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    strokes.current[strokes.current.length - 1]?.push({ x, y, color, size });
  };

  const redraw = () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    for (const stroke of strokes.current) {
      for (const p of stroke) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const undo = () => { strokes.current.pop(); redraw(); };
  const clear = () => { strokes.current = []; redraw(); };

  return (
    <AppFrame
      appId="drawing"
      title="Drawing"
      subtitle={`${size}px brush · click and drag`}
      toolbar={
        <>
          {palette.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`}
              className="w-4 h-4 border transition-transform hover:scale-125"
              style={{ backgroundColor: c, borderColor: color === c ? 'var(--theme-text)' : 'transparent' }} />
          ))}
          <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))}
            aria-label="Brush size" className="w-16" />
          <Button variant="ghost" onClick={undo} title="Undo"><Undo2 size={13} /></Button>
          <Button variant="ghost" onClick={clear} title="Clear"><Eraser size={13} /></Button>
        </>
      }
      console={{
        intro: 'Drawing console. Change colour or size, undo, or clear.',
        suggestions: ['color pink', 'size 12', 'undo', 'clear'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/clear/.test(q)) { clear(); return 'Canvas cleared.'; }
          if (/undo/.test(q)) { undo(); return 'Undid the last stroke.'; }
          if (/size|brush/.test(q)) { const n = parseInt(q.replace(/\D+/g, ''), 10); if (n) { setSize(Math.min(20, n)); return `Brush is ${Math.min(20, n)}px.`; } }
          const map = { blue: '#60a5fa', pink: '#e3008c', green: '#7fba00', orange: '#f7a600', white: '#ffffff', black: '#111111' };
          const found = Object.keys(map).find((k) => q.includes(k));
          if (found) { setColor(map[found]); return `Brush is now ${found}.`; }
          return null;
        },
      }}
    >
      <canvas
        ref={canvasRef}
        width={900}
        height={560}
        className="w-full h-full cursor-crosshair"
        style={{ backgroundColor: 'var(--theme-surface-alt)' }}
        onPointerDown={(e) => { drawing.current = true; strokes.current.push([]); paint(e); }}
        onPointerMove={paint}
        onPointerUp={() => { drawing.current = false; }}
        onPointerLeave={() => { drawing.current = false; }}
      />
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Podcast */

const SHOWS = [
  { id: 1, title: 'Interface Weekly', ep: 'Tiling in the browser', len: 42, progress: 60 },
  { id: 2, title: 'Design Notes', ep: 'Against hamburger menus', len: 28, progress: 0 },
  { id: 3, title: 'Platform Status', ep: 'Container queries everywhere', len: 35, progress: 100 },
];

export function PodcastApp() {
  const [shows, setShows] = useState(SHOWS);
  const [currentId, setCurrentId] = useState(SHOWS[0].id);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  const current = shows.find((s) => s.id === currentId);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setShows((prev) => prev.map((s) => (s.id === currentId ? { ...s, progress: Math.min(100, s.progress + rate) } : s)));
    }, 600);
    return () => clearInterval(id);
  }, [playing, currentId, rate]);

  return (
    <AppFrame
      appId="podcast"
      title="Podcasts"
      subtitle={`${shows.length} subscriptions · ${rate}× speed`}
      toolbar={<Segmented options={[{ value: 1, label: '1×' }, { value: 1.5, label: '1.5×' }, { value: 2, label: '2×' }]} value={rate} onChange={setRate} />}
      console={{
        intro: 'Podcast console. Play a show, change speed, or see what is unplayed.',
        suggestions: ['what is unplayed?', 'play design notes', 'speed 2'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/unplayed|new/.test(q)) {
            const u = shows.filter((s) => s.progress === 0);
            return u.length ? u.map((s) => `- ${s.title}: ${s.ep}`).join('\n') : 'Everything is started.';
          }
          if (/speed|rate/.test(q)) { const n = parseFloat(q.replace(/[^\d.]/g, '')); if (n) { setRate(n); return `Speed ${n}×.`; } }
          if (/pause/.test(q)) { setPlaying(false); return 'Paused.'; }
          const hit = shows.find((s) => q.includes(s.title.toLowerCase().split(' ')[0]));
          if (hit) { setCurrentId(hit.id); setPlaying(true); return `Playing "${hit.ep}".`; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-3">
          <Muted className="text-[10px] uppercase tracking-wider">Now playing</Muted>
          <div className="font-semibold">{current.ep}</div>
          <Muted className="text-[12px] block mb-2">{current.title} · {current.len} min</Muted>
          <Meter value={current.progress} />
          <div className="flex items-center gap-2 mt-2">
            <Muted className="text-[10px] font-mono">
              {Math.round((current.progress / 100) * current.len)} / {current.len} min
            </Muted>
            <Button variant="accent" className="ml-auto" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? 'Pause' : 'Play'}
            </Button>
          </div>
        </Card>
        <div>
          <SectionTitle>Library</SectionTitle>
          {shows.map((s) => (
            <Row key={s.id} selected={s.id === currentId} onClick={() => { setCurrentId(s.id); setPlaying(true); }}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate">{s.ep}</div>
                  <Muted className="text-[10px] truncate block">{s.title} · {s.len} min</Muted>
                </div>
                <Tag tone={s.progress >= 100 ? 'success' : s.progress > 0 ? 'accent' : 'default'}>
                  {s.progress >= 100 ? 'Played' : s.progress > 0 ? `${Math.round(s.progress)}%` : 'New'}
                </Tag>
              </div>
            </Row>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}
