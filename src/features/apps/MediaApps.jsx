import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Mic, Square, Camera as CameraIcon, Eraser } from 'lucide-react';
import { AppFrame, Button, Card, Row, Muted, Meter, Tag, Empty, SectionTitle, Stat } from './AppFrame.jsx';
import { TRACKS, PHOTOS } from './demoData.js';

/* ----------------------------------------------------------------- Music */

export function MusicApp() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(42);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setPos((p) => (p >= 100 ? 0 : p + 1)), 400);
    return () => clearInterval(id);
  }, [playing]);

  const track = TRACKS[current];
  const skip = (n) => { setCurrent((c) => (c + n + TRACKS.length) % TRACKS.length); setPos(0); };

  return (
    <AppFrame
      appId="music"
      title="Music"
      subtitle={`${track.title} — ${track.artist}`}
      console={{
        intro: 'Music console. Play, pause, skip, or ask what is on.',
        suggestions: ['play', 'next', "what's playing?"],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('pause') || q.includes('stop')) { setPlaying(false); return 'Paused.'; }
          if (q.includes('play') || q.includes('resume')) { setPlaying(true); return `Playing "${track.title}".`; }
          if (q.includes('next') || q.includes('skip')) { skip(1); return 'Skipped forward.'; }
          if (q.includes('previous') || q.includes('back')) { skip(-1); return 'Back one track.'; }
          if (q.includes('playing') || q.includes('what')) return `${track.title} — ${track.artist} (${track.album}), ${track.len}`;
          const byName = TRACKS.findIndex((x) => q.includes(x.title.toLowerCase()));
          if (byName >= 0) { setCurrent(byName); setPlaying(true); setPos(0); return `Playing "${TRACKS[byName].title}".`; }
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
          </div>
          <div className="mt-3">
            <Meter value={pos} />
            <div className="flex justify-between mt-1">
              <Muted className="text-[10px] font-mono">{Math.floor(pos * 0.03)}:{String(Math.floor(pos * 1.8) % 60).padStart(2, '0')}</Muted>
              <Muted className="text-[10px] font-mono">{track.len}</Muted>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button variant="ghost" onClick={() => skip(-1)} aria-label="Previous"><SkipBack size={15} /></Button>
            <Button variant="accent" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </Button>
            <Button variant="ghost" onClick={() => skip(1)} aria-label="Next"><SkipForward size={15} /></Button>
          </div>
        </Card>

        <div>
          <SectionTitle>All tracks</SectionTitle>
          {TRACKS.map((t, i) => (
            <Row key={t.id} selected={i === current} onClick={() => { setCurrent(i); setPos(0); setPlaying(true); }}
              className="flex items-center gap-2">
              <Muted className="text-[10px] font-mono w-4">{i + 1}</Muted>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] truncate">{t.title}</div>
                <Muted className="text-[10px] truncate block">{t.artist}</Muted>
              </div>
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
  const [selected, setSelected] = useState(null);
  const albums = ['All', ...new Set(PHOTOS.map((p) => p.album))];
  const shown = album === 'All' ? PHOTOS : PHOTOS.filter((p) => p.album === album);

  return (
    <AppFrame
      appId="photos"
      title="Photos"
      subtitle={`${shown.length} in ${album}`}
      console={{
        intro: 'Photos console. Filter by album or ask what is here.',
        suggestions: ['show trips', 'how many photos?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hit = albums.find((a) => q.includes(a.toLowerCase()));
          if (hit) { setAlbum(hit); return `Showing ${hit}: ${PHOTOS.filter((p) => hit === 'All' || p.album === hit).length} photos.`; }
          if (q.includes('how many')) return `${PHOTOS.length} photos across ${albums.length - 1} albums.`;
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {albums.map((a) => (
            <Row key={a} selected={album === a} onClick={() => setAlbum(a)}>
              <span className="text-[12px]">{a}</span>
            </Row>
          ))}
        </div>
      }
    >
      {selected ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 grid place-items-center p-4">
            <div className="w-full max-w-md aspect-[4/3] grid place-items-center text-white text-sm"
              style={{ backgroundColor: selected.tone, borderRadius: 'var(--theme-radius)' }}>
              {selected.title}
            </div>
          </div>
          <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="min-w-0">
              <div className="text-[12px] font-medium truncate">{selected.title}</div>
              <Muted className="text-[10px]">{selected.album} · {selected.date}</Muted>
            </div>
            <Button className="ml-auto" onClick={() => setSelected(null)}>Back to grid</Button>
          </div>
        </div>
      ) : (
        <div className="p-3 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
          {shown.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="aspect-square relative overflow-hidden text-left"
              style={{ backgroundColor: p.tone, borderRadius: 'var(--theme-radius-sm)' }}>
              <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white/90 truncate">{p.title}</span>
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
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setPos((p) => (p >= 100 ? 0 : p + 1)), 500);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <AppFrame
      appId="video"
      title="Video"
      subtitle="Nature Documentary · 45:00"
      console={{
        intro: 'Video console. Play, pause, or seek by percentage.',
        suggestions: ['play', 'seek 75'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('pause')) { setPlaying(false); return 'Paused.'; }
          if (q.includes('play')) { setPlaying(true); return 'Playing.'; }
          if (q.startsWith('seek')) { const n = parseInt(q.replace(/\D+/g, ''), 10); if (!Number.isNaN(n)) { setPos(Math.min(100, n)); return `Seeked to ${n}%.`; } }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="aspect-video grid place-items-center relative overflow-hidden"
          style={{ backgroundColor: '#000', borderRadius: 'var(--theme-radius-sm)' }}>
          <button onClick={() => setPlaying((p) => !p)} className="w-12 h-12 grid place-items-center"
            style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-accent-text)', borderRadius: '50%' }}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: 'rgba(255,255,255,.2)' }}>
            <div className="h-full" style={{ width: `${pos}%`, backgroundColor: 'var(--theme-accent)' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Muted className="text-[11px] font-mono">{Math.floor(pos * 0.45)}:00 / 45:00</Muted>
          <Tag tone="accent" >{playing ? 'Playing' : 'Paused'}</Tag>
        </div>
        <Card className="p-3">
          <SectionTitle>Up next</SectionTitle>
          {['Coastlines', 'Deep Forest', 'Night Skies'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 py-1">
              <Muted className="text-[10px] font-mono w-4">{i + 1}</Muted>
              <span className="text-[12px] flex-1">{t}</span>
              <Muted className="text-[10px]">{38 + i * 4}:00</Muted>
            </div>
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
  const [clips, setClips] = useState([
    { id: 1, name: 'Standup notes', len: '1:04' },
    { id: 2, name: 'Layout idea', len: '0:38' },
  ]);

  useEffect(() => {
    if (!recording) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const stop = () => {
    if (seconds > 0) {
      setClips((prev) => [
        { id: Date.now(), name: `Clip ${prev.length + 1}`, len: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` },
        ...prev,
      ]);
    }
    setRecording(false);
    setSeconds(0);
  };

  return (
    <AppFrame
      appId={appId}
      title={title}
      subtitle={recording ? `Recording · ${seconds}s` : `${clips.length} clips`}
      console={{
        intro: `${title} console. Start and stop recording, or list clips.`,
        suggestions: ['start recording', 'stop', 'list clips'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('start') || q.includes('record')) { setRecording(true); return 'Recording started.'; }
          if (q.includes('stop')) { stop(); return 'Stopped and saved.'; }
          if (q.includes('list') || q.includes('clip')) return clips.map((c) => `- ${c.name} (${c.len})`).join('\n');
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-4 grid place-items-center gap-3">
          <div className="flex items-end gap-1 h-12">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-1.5"
                style={{
                  height: recording ? `${20 + ((i * 37 + seconds * 13) % 80)}%` : '18%',
                  backgroundColor: recording ? 'var(--theme-accent)' : 'var(--theme-border)',
                  transition: 'height var(--motion-fast)',
                }} />
            ))}
          </div>
          <div className="font-mono text-lg">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>
          {recording
            ? <Button variant="danger" onClick={stop}><Square size={13} /> Stop</Button>
            : <Button variant="accent" onClick={() => setRecording(true)}><Mic size={13} /> Record</Button>}
        </Card>
        <div>
          <SectionTitle>Clips</SectionTitle>
          {clips.map((c) => (
            <Card key={c.id} className="flex items-center gap-2 px-3 py-2 mb-1.5">
              <Play size={12} />
              <span className="text-[12px] flex-1 truncate">{c.name}</span>
              <Muted className="text-[10px] font-mono">{c.len}</Muted>
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

export function CameraApp() {
  const [shots, setShots] = useState([]);
  const take = () => setShots((prev) => [{ id: Date.now(), tone: `hsl(${(prev.length * 57) % 360} 55% 45%)` }, ...prev].slice(0, 12));

  return (
    <AppFrame
      appId="camera"
      title="Camera"
      subtitle={`${shots.length} shots this session`}
      console={{
        intro: 'Camera console. Take a shot or clear the roll.',
        suggestions: ['take a photo', 'clear'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('take') || q.includes('shot') || q.includes('photo')) { take(); return 'Captured.'; }
          if (q.includes('clear')) { setShots([]); return 'Roll cleared.'; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="aspect-video grid place-items-center relative"
          style={{ backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}>
          <Muted className="text-[12px]">Viewfinder (simulated)</Muted>
          <button onClick={take} aria-label="Shutter"
            className="absolute bottom-3 w-11 h-11 border-4"
            style={{ borderColor: 'var(--theme-accent)', backgroundColor: 'var(--theme-surface)', borderRadius: '50%' }} />
        </div>
        {shots.length === 0
          ? <Empty title="No shots yet" hint="Press the shutter, or say “take a photo” in the console." />
          : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
              {shots.map((s) => <div key={s.id} className="aspect-square" style={{ backgroundColor: s.tone, borderRadius: 'var(--theme-radius-sm)' }} />)}
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
  const [color, setColor] = useState('#60a5fa');
  const palette = ['#60a5fa', '#e3008c', '#7fba00', '#f7a600', '#ffffff'];

  const draw = (e) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
  };

  return (
    <AppFrame
      appId="drawing"
      title="Drawing"
      subtitle="Click and drag to draw"
      console={{
        intro: 'Drawing console. Change colour or clear the canvas.',
        suggestions: ['color pink', 'clear'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('clear')) { clear(); return 'Canvas cleared.'; }
          const map = { blue: '#60a5fa', pink: '#e3008c', green: '#7fba00', orange: '#f7a600', white: '#ffffff' };
          const found = Object.keys(map).find((k) => q.includes(k));
          if (found) { setColor(map[found]); return `Brush is now ${found}.`; }
          return null;
        },
      }}
      toolbar={
        <div className="flex items-center gap-1">
          {palette.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`}
              className="w-4 h-4 border" style={{ backgroundColor: c, borderColor: color === c ? 'var(--theme-text)' : 'transparent' }} />
          ))}
          <Button variant="ghost" onClick={clear}><Eraser size={13} /></Button>
        </div>
      }
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full cursor-crosshair"
        style={{ backgroundColor: 'var(--theme-surface-alt)' }}
        onPointerDown={(e) => { drawing.current = true; draw(e); }}
        onPointerMove={draw}
        onPointerUp={() => { drawing.current = false; }}
        onPointerLeave={() => { drawing.current = false; }}
      />
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Podcast */

export function PodcastApp() {
  const shows = [
    { id: 1, title: 'Interface Weekly', ep: 'Tiling in the browser', len: '42 min', progress: 60 },
    { id: 2, title: 'Design Notes', ep: 'Against hamburger menus', len: '28 min', progress: 0 },
    { id: 3, title: 'Platform Status', ep: 'Container queries everywhere', len: '35 min', progress: 100 },
  ];
  const [current, setCurrent] = useState(shows[0]);

  return (
    <AppFrame
      appId="podcast"
      title="Podcasts"
      subtitle={`${shows.length} subscriptions`}
      console={{
        intro: 'Podcast console. Ask what is unplayed or play a show.',
        suggestions: ['what is unplayed?', 'play design notes'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('unplayed') || q.includes('new')) return shows.filter((s) => s.progress === 0).map((s) => `- ${s.title}: ${s.ep}`).join('\n') || 'Everything is started.';
          const hit = shows.find((s) => q.includes(s.title.toLowerCase().split(' ')[0]));
          if (hit) { setCurrent(hit); return `Playing "${hit.ep}" from ${hit.title}.`; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-3">
          <Muted className="text-[10px] uppercase tracking-wider">Now playing</Muted>
          <div className="font-semibold">{current.ep}</div>
          <Muted className="text-[12px] block mb-2">{current.title} · {current.len}</Muted>
          <Meter value={current.progress} />
        </Card>
        <div>
          <SectionTitle>Library</SectionTitle>
          {shows.map((s) => (
            <Row key={s.id} selected={s.id === current.id} onClick={() => setCurrent(s)}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate">{s.ep}</div>
                  <Muted className="text-[10px] truncate block">{s.title} · {s.len}</Muted>
                </div>
                <Tag tone={s.progress === 100 ? 'success' : s.progress > 0 ? 'accent' : 'default'}>
                  {s.progress === 100 ? 'Played' : s.progress > 0 ? `${s.progress}%` : 'New'}
                </Tag>
              </div>
            </Row>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}
