import React, { useEffect, useMemo, useState } from 'react';
import {
  Folder, FileText, FileCode, Image as ImageIcon, Table, Cloud, MapPin, Play,
  Grid3x3, List, ArrowUpDown, Pause, Search, Timer, Flag, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle,
  Stat, Meter, Segmented, Sparkline, Field, Toggle, Kbd,
} from './AppFrame.jsx';
import { FILES, WEATHER, NEWS, DB_TABLES } from './demoData.js';
import { store } from '../../kernel/index.js';

/* ----------------------------------------------------------------- Files */

const FILE_ICON = { folder: Folder, code: FileCode, doc: FileText, image: ImageIcon, sheet: Table };
const sizeToKb = (s) => (s.includes('MB') ? parseFloat(s) * 1024 : parseFloat(s) || 0);

export function FilesApp() {
  const [path, setPath] = useState('src');
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('name');

  const shown = useMemo(() => {
    const list = FILES.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
    const sorted = [...list].sort((a, b) => {
      if (sort === 'size') return sizeToKb(b.size) - sizeToKb(a.size);
      if (sort === 'type') return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    // Folders first, always.
    return sorted.sort((a, b) => (a.type === 'folder' ? -1 : 0) - (b.type === 'folder' ? -1 : 0));
  }, [query, sort]);

  const file = FILES.find((f) => f.id === selected);

  return (
    <AppFrame
      appId="files"
      title="Files"
      subtitle={`/${path} · ${shown.length} items`}
      toolbar={
        <>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" className="w-24 app-hide-sm" />
          <Segmented options={[{ value: 'name', label: 'Name' }, { value: 'size', label: 'Size' }, { value: 'type', label: 'Type' }]}
            value={sort} onChange={setSort} />
          <Button variant="ghost" onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
            title={view === 'grid' ? 'List view' : 'Grid view'}>
            {view === 'grid' ? <List size={13} /> : <Grid3x3 size={13} />}
          </Button>
        </>
      }
      console={{
        intro: 'Files console. Filter, sort, or ask what changed.',
        suggestions: ['what changed today?', 'largest file', 'sort by size'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/today|recent|changed/.test(q)) {
            return FILES.filter((f) => /Today|min|hour/.test(f.modified)).map((f) => `- ${f.name} (${f.modified})`).join('\n');
          }
          if (/largest|biggest/.test(q)) {
            const big = [...FILES].sort((a, b) => sizeToKb(b.size) - sizeToKb(a.size))[0];
            return `${big.name} at ${big.size}.`;
          }
          if (/sort/.test(q)) {
            const k = ['name', 'size', 'type'].find((x) => q.includes(x));
            if (k) { setSort(k); return `Sorted by ${k}.`; }
          }
          if (/^find /.test(q)) { setQuery(q.slice(5)); return `Filtering by "${q.slice(5)}".`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {['src', 'docs', 'public', 'node_modules'].map((p) => (
            <Row key={p} selected={path === p} onClick={() => setPath(p)}>
              <span className="text-[12px] flex items-center gap-1.5"><Folder size={12} /> {p}</span>
            </Row>
          ))}
          {file && (
            <div className="px-3 pt-4">
              <SectionTitle>Details</SectionTitle>
              <div className="text-[11px] space-y-1">
                <div className="truncate font-medium">{file.name}</div>
                <Muted className="block">{file.size}</Muted>
                <Muted className="block">{file.modified}</Muted>
                <Tag>{file.type}</Tag>
              </div>
            </div>
          )}
        </div>
      }
    >
      {shown.length === 0 ? <Empty title="Nothing matches" hint="Clear the filter to see everything." /> : view === 'grid' ? (
        <div className="p-2 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
          {shown.map((f) => {
            const Icon = FILE_ICON[f.type] || FileText;
            return (
              <Card key={f.id} accent={selected === f.id} onClick={() => setSelected(f.id)}
                className="p-2 cursor-pointer flex items-center gap-2 transition-transform hover:-translate-y-px"
                style={{ transitionDuration: 'var(--motion-fast)' }}>
                <Icon size={15} style={{ color: 'var(--theme-accent)' }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate">{f.name}</div>
                  <Muted className="text-[10px] truncate block">{f.size} · {f.modified}</Muted>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex px-3 py-1.5 text-[10px] uppercase tracking-wider border-b sticky top-0"
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)', color: 'var(--theme-text-muted)' }}>
            <span className="flex-1">Name</span><span className="w-16 text-right">Size</span><span className="w-24 text-right app-hide-sm">Modified</span>
          </div>
          {shown.map((f) => {
            const Icon = FILE_ICON[f.type] || FileText;
            return (
              <Row key={f.id} selected={selected === f.id} onClick={() => setSelected(f.id)} className="flex items-center gap-2">
                <Icon size={13} style={{ color: 'var(--theme-accent)' }} className="shrink-0" />
                <span className="flex-1 truncate text-[12px]">{f.name}</span>
                <Muted className="w-16 text-right text-[11px]">{f.size}</Muted>
                <Muted className="w-24 text-right text-[11px] app-hide-sm">{f.modified}</Muted>
              </Row>
            );
          })}
        </div>
      )}
    </AppFrame>
  );
}

/* ------------------------------------------------------- Activity monitor */

export function ActivityMonitorApp() {
  const [cpu, setCpu] = useState(() => Array.from({ length: 48 }, (_, i) => 20 + Math.round(Math.abs(Math.sin(i / 4)) * 30)));
  const [mem, setMem] = useState(() => Array.from({ length: 48 }, (_, i) => 40 + Math.round(Math.abs(Math.cos(i / 6)) * 18)));
  const [paused, setPaused] = useState(false);
  const [windows, setWindows] = useState(() => store.getState().windows);

  useEffect(() => {
    const unsub = store.subscribe(() => setWindows(store.getState().windows));
    return unsub;
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      setCpu((h) => [...h.slice(1), 12 + Math.round(Math.abs(Math.sin(Date.now() / 640)) * 62)]);
      setMem((h) => [...h.slice(1), 38 + Math.round(Math.abs(Math.cos(Date.now() / 900)) * 26)]);
    }, 850);
    return () => clearInterval(id);
  }, [paused]);

  const nowCpu = cpu[cpu.length - 1];
  const nowMem = mem[mem.length - 1];

  return (
    <AppFrame
      appId="activity"
      title="Activity Monitor"
      subtitle={`${windows.length} windows · CPU ${nowCpu}%${paused ? ' · paused' : ''}`}
      toolbar={
        <Button active={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={12} /> : <Pause size={12} />} {paused ? 'Resume' : 'Pause'}
        </Button>
      }
      console={{
        intro: 'Activity console. Ask about load, or what is running.',
        suggestions: ['what is running?', 'cpu', 'pause sampling'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/pause|freeze/.test(q)) { setPaused(true); return 'Sampling paused.'; }
          if (/resume|start/.test(q)) { setPaused(false); return 'Sampling resumed.'; }
          if (/running|window/.test(q)) return windows.length
            ? windows.map((w) => `- ${w.t} (workspace ${w.ws}${w.floating ? ', floating' : ''}${w.m ? ', minimized' : ''})`).join('\n')
            : 'No windows open.';
          if (/cpu|load|memory/.test(q)) return `CPU ${nowCpu}%, memory ${nowMem}%, ${windows.length} windows.`;
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))' }}>
          <Stat label="CPU" value={`${nowCpu}%`} hint={`peak ${Math.max(...cpu)}%`} />
          <Stat label="Memory" value={`${nowMem}%`} hint={`${Math.round(nowMem * 81)} MB`} />
          <Stat label="Windows" value={windows.length} hint={`${windows.filter((w) => w.floating).length} floating`} />
        </div>

        <Card className="p-3">
          <SectionTitle action={<Muted className="text-[10px]">48 samples</Muted>}>CPU</SectionTitle>
          <Sparkline values={cpu} height={48} tone={nowCpu > 70 ? 'danger' : 'accent'} />
        </Card>

        <Card className="p-3">
          <SectionTitle>Memory</SectionTitle>
          <Sparkline values={mem} height={38} tone="success" />
        </Card>

        <Card className="p-3">
          <SectionTitle>Open windows</SectionTitle>
          {windows.length === 0 && <Muted className="text-[12px]">Nothing running.</Muted>}
          {windows.map((w) => (
            <div key={w.id} className="flex items-center gap-2 py-1">
              <span className="text-[12px] flex-1 truncate">{w.t}</span>
              <Muted className="text-[10px] font-mono app-hide-sm">{w.id}</Muted>
              <Tag>{`ws ${w.ws}`}</Tag>
              <Tag tone={w.floating ? 'accent' : 'default'}>{w.floating ? 'floating' : 'tiled'}</Tag>
            </div>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
}

/* ---------------------------------------------------------- Disk utility */

const VOLUMES = [
  { name: 'System', total: 512, used: 318, fs: 'APFS' },
  { name: 'Projects', total: 1024, used: 640, fs: 'APFS' },
  { name: 'Backup', total: 2048, used: 410, fs: 'exFAT' },
];

export function DiskUtilityApp() {
  const [selected, setSelected] = useState(VOLUMES[0].name);
  const [scan, setScan] = useState(null);
  const vol = VOLUMES.find((v) => v.name === selected);

  const runScan = () => {
    setScan(0);
    const id = setInterval(() => {
      setScan((p) => {
        if (p === null) { clearInterval(id); return null; }
        if (p >= 100) { clearInterval(id); return 100; }
        return p + 8;
      });
    }, 130);
  };

  const breakdown = [
    { label: 'Apps', pct: 0.42, tone: 'var(--theme-accent)' },
    { label: 'Documents', pct: 0.28, tone: 'var(--theme-success)' },
    { label: 'Media', pct: 0.22, tone: 'var(--theme-danger)' },
    { label: 'System', pct: 0.08, tone: 'var(--theme-text-muted)' },
  ];

  return (
    <AppFrame
      appId="disk"
      title="Disk Utility"
      subtitle={`${VOLUMES.length} volumes · ${vol.name} selected`}
      toolbar={<Button variant="accent" onClick={runScan} disabled={scan !== null && scan < 100}>
        {scan !== null && scan < 100 ? `Scanning ${scan}%` : 'Verify'}
      </Button>}
      console={{
        intro: 'Disk console. Ask about space, or run a verify.',
        suggestions: ['how much free space?', 'which volume is fullest?', 'verify'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/verify|scan|check/.test(q)) { runScan(); return `Verifying ${vol.name}…`; }
          if (/free/.test(q)) return VOLUMES.map((v) => `${v.name}: ${v.total - v.used} GB free of ${v.total} GB`).join('\n');
          if (/full/.test(q)) {
            const worst = [...VOLUMES].sort((a, b) => b.used / b.total - a.used / a.total)[0];
            return `${worst.name} is ${Math.round((worst.used / worst.total) * 100)}% full.`;
          }
          const hit = VOLUMES.find((v) => q.includes(v.name.toLowerCase()));
          if (hit) { setSelected(hit.name); return `${hit.name}: ${hit.used} GB used of ${hit.total} GB (${hit.fs}).`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {VOLUMES.map((v) => (
            <Row key={v.name} selected={v.name === selected} onClick={() => setSelected(v.name)}>
              <div className="text-[12px]">{v.name}</div>
              <Muted className="text-[10px]">{v.total} GB · {v.fs}</Muted>
              <div className="mt-1"><Meter value={v.used} max={v.total} tone={v.used / v.total > 0.8 ? 'danger' : 'accent'} /></div>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))' }}>
          <Stat label="Capacity" value={`${vol.total} GB`} />
          <Stat label="Used" value={`${vol.used} GB`} hint={`${Math.round((vol.used / vol.total) * 100)}%`} />
          <Stat label="Free" value={`${vol.total - vol.used} GB`} />
        </div>

        <Card className="p-3">
          <SectionTitle>{vol.name} — what is on it</SectionTitle>
          <div className="flex h-3 overflow-hidden mb-2" style={{ borderRadius: 'var(--theme-radius-sm)' }}>
            {breakdown.map((b) => (
              <div key={b.label} style={{ width: `${b.pct * (vol.used / vol.total) * 100}%`, backgroundColor: b.tone }} title={b.label} />
            ))}
            <div style={{ flex: 1, backgroundColor: 'var(--theme-surface-alt)' }} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2" style={{ backgroundColor: b.tone }} />
                <span>{b.label}</span>
                <Muted>{Math.round(vol.used * b.pct)} GB</Muted>
              </div>
            ))}
          </div>
        </Card>

        {scan !== null && (
          <Card className="p-3">
            <SectionTitle>{scan >= 100 ? 'Verification complete' : 'Verifying'}</SectionTitle>
            <Meter value={scan} tone={scan >= 100 ? 'success' : 'accent'} />
            <Muted className="text-[11px] mt-1 block">
              {scan >= 100 ? 'No errors found on this volume.' : `Checking structures… ${scan}%`}
            </Muted>
          </Card>
        )}
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Calculator */

export function CalculatorApp() {
  const [expr, setExpr] = useState('');
  const [history, setHistory] = useState([]);
  const [memory, setMemory] = useState(0);

  const evaluate = (input) => {
    if (!/^[\d\s+\-*/().%]+$/.test(input)) throw new Error('only numbers and + - * / ( ) are allowed');
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${input})`)();
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('that does not come out to a number');
    return value;
  };

  const run = (input) => {
    try {
      const value = evaluate(input);
      setHistory((h) => [{ expr: input, value }, ...h].slice(0, 14));
      setExpr(String(value));
      return value;
    } catch (err) {
      setHistory((h) => [{ expr: input, error: err.message }, ...h].slice(0, 14));
      return null;
    }
  };

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];

  return (
    <AppFrame
      appId="calculator"
      title="Calculator"
      subtitle={memory ? `Memory: ${memory}` : `${history.length} in history`}
      console={{
        intro: 'Calculator console. Type an expression and I will work it out.',
        suggestions: ['12 * (3 + 4)', '1024 / 8'],
        handler: async (t) => {
          try {
            const value = evaluate(t);
            setHistory((h) => [{ expr: t, value }, ...h].slice(0, 14));
            setExpr(String(value));
            return `${t} = ${value}`;
          } catch (err) {
            return `I can't evaluate that — ${err.message}.`;
          }
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-3">
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(expr); }}
            placeholder="0"
            aria-label="Expression"
            className="w-full bg-transparent outline-none text-right text-2xl font-mono tabular-nums"
            style={{ color: 'var(--theme-text)' }}
          />
        </Card>

        <div className="flex gap-1.5">
          <Button className="flex-1 justify-center" onClick={() => setMemory(Number(expr) || 0)}>MS</Button>
          <Button className="flex-1 justify-center" onClick={() => setExpr((v) => v + String(memory))}>MR</Button>
          <Button className="flex-1 justify-center" onClick={() => setMemory(0)}>MC</Button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <Button className="col-span-2 justify-center" onClick={() => setExpr('')}>Clear</Button>
          <Button className="justify-center" onClick={() => setExpr((v) => v.slice(0, -1))}>←</Button>
          <Button className="justify-center" onClick={() => setExpr((v) => `${v}(`)}>(</Button>
          {keys.map((k) => (
            <Button key={k} variant={k === '=' ? 'accent' : 'default'} className="justify-center font-mono"
              onClick={() => (k === '=' ? run(expr) : setExpr((v) => v + k))}>
              {k}
            </Button>
          ))}
        </div>

        {history.length > 0 && (
          <div>
            <SectionTitle action={<button className="text-[10px]" onClick={() => setHistory([])} style={{ color: 'var(--theme-text-muted)' }}>Clear</button>}>
              History
            </SectionTitle>
            {history.map((h, i) => (
              <button key={i} onClick={() => setExpr(h.error ? h.expr : String(h.value))}
                className="flex justify-between w-full text-[12px] font-mono py-0.5 text-left">
                <Muted>{h.expr}</Muted>
                {/*
                  The reason, not just the word "error". The message was
                  already there — evaluate() throws "only numbers and + - * /
                  ( ) are allowed" — and the history threw it away, so a
                  refused expression looked like a broken calculator.
                */}
                <span
                  title={h.error || undefined}
                  className="truncate pl-3"
                  style={{ color: h.error ? 'var(--theme-danger)' : 'var(--theme-text)' }}
                >
                  {h.error || h.value}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Weather */

export function WeatherApp() {
  const [unit, setUnit] = useState('F');
  const [day, setDay] = useState(0);
  const w = WEATHER;
  const conv = (f) => (unit === 'F' ? f : Math.round(((f - 32) * 5) / 9));
  const selected = w.days[day];

  return (
    <AppFrame
      appId="weather"
      title="Weather"
      subtitle={`${w.place} · ${w.now.condition}`}
      toolbar={<Segmented options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} value={unit} onChange={setUnit} />}
      console={{
        intro: 'Weather console. Ask about now, the week, or switch units.',
        suggestions: ['will it rain?', 'warmest day', 'celsius'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/celsius|metric/.test(q)) { setUnit('C'); return 'Switched to Celsius.'; }
          if (/fahrenheit|imperial/.test(q)) { setUnit('F'); return 'Switched to Fahrenheit.'; }
          if (/rain/.test(q)) return 'No rain in the five-day outlook. Fog on Tuesday morning.';
          if (/warm|hot/.test(q)) {
            const best = [...w.days].sort((a, b) => b.hi - a.hi)[0];
            setDay(w.days.indexOf(best));
            return `${best.d} at ${conv(best.hi)}°${unit}, ${best.condition.toLowerCase()}.`;
          }
          if (/now|today|current/.test(q)) return `${conv(w.now.temp)}°${unit}, feels like ${conv(w.now.feels)}°. ${w.now.condition}, wind ${w.now.wind} mph, humidity ${w.now.humidity}%.`;
          const d = w.days.find((x) => q.includes(x.d.toLowerCase()));
          if (d) { setDay(w.days.indexOf(d)); return `${d.d}: ${conv(d.hi)}°/${conv(d.lo)}°, ${d.condition.toLowerCase()}.`; }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-4 flex items-center gap-4">
          <Cloud size={40} style={{ color: 'var(--theme-accent)' }} />
          <div>
            <div className="text-3xl font-semibold leading-none tabular-nums">{conv(w.now.temp)}°{unit}</div>
            <Muted className="text-[12px]">{w.now.condition} · feels like {conv(w.now.feels)}°</Muted>
          </div>
        </Card>

        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(94px, 1fr))' }}>
          <Stat label="Wind" value={`${w.now.wind} mph`} />
          <Stat label="Humidity" value={`${w.now.humidity}%`} />
          <Stat label="UV index" value={w.now.uv} hint={w.now.uv > 5 ? 'high' : 'moderate'} />
        </div>

        <Card className="p-3">
          <SectionTitle>Next eight hours</SectionTitle>
          <Sparkline values={w.hourly.map((h) => h.t)} height={44} />
          <div className="flex justify-between mt-1">
            {w.hourly.map((h) => (
              <div key={h.h} className="text-center">
                <div className="text-[10px] tabular-nums">{conv(h.t)}°</div>
                <Muted className="text-[9px]">{h.h}</Muted>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          {w.days.map((d, i) => (
            <Row key={d.d} selected={i === day} onClick={() => setDay(i)} className="flex items-center gap-3 text-[12px]">
              <span className="w-8">{d.d}</span>
              <Muted className="flex-1 truncate">{d.condition}</Muted>
              <span className="font-mono tabular-nums">{conv(d.hi)}° / {conv(d.lo)}°</span>
            </Row>
          ))}
        </Card>

        <Card className="p-3">
          <SectionTitle>{selected.d}</SectionTitle>
          <div className="text-[12px]">
            {selected.condition}. High {conv(selected.hi)}°{unit}, low {conv(selected.lo)}°{unit}.
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ Maps */

const PLACES = [
  { id: 1, name: 'Work', eta: 12, via: 'Market St', traffic: 'Light', steps: ['Head north on 3rd', 'Right onto Market St', 'Arrive on the left'] },
  { id: 2, name: 'Home', eta: 18, via: 'Highway 84', traffic: 'Moderate', steps: ['Merge onto Highway 84', 'Exit 12 toward Oak', 'Arrive on the right'] },
  { id: 3, name: 'Coffee Shop', eta: 5, via: '3rd St', traffic: 'Light', steps: ['Walk south on 3rd', 'Arrive on the corner'] },
];

export function MapsApp() {
  const [dest, setDest] = useState(PLACES[0]);
  const [zoom, setZoom] = useState(1);
  const [navigating, setNavigating] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!navigating) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1 < dest.steps.length ? s + 1 : (setNavigating(false), 0))), 2200);
    return () => clearInterval(id);
  }, [navigating, dest]);

  return (
    <AppFrame
      appId="maps"
      title="Maps"
      subtitle={`${dest.name} · ${dest.eta} min via ${dest.via}`}
      toolbar={
        <>
          <Button variant="ghost" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out"><ZoomOut size={13} /></Button>
          <Button variant="ghost" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in"><ZoomIn size={13} /></Button>
        </>
      }
      console={{
        intro: 'Maps console. Ask for a route, traffic, or start navigation.',
        suggestions: ['route to home', 'how is traffic?', 'start'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hit = PLACES.find((p) => q.includes(p.name.toLowerCase()));
          if (hit) { setDest(hit); setStep(0); return `${hit.name}: ${hit.eta} min via ${hit.via}, traffic ${hit.traffic.toLowerCase()}.`; }
          if (/traffic/.test(q)) return PLACES.map((p) => `${p.name}: ${p.traffic}`).join('\n');
          if (/start|navigate|go/.test(q)) { setNavigating(true); setStep(0); return `Navigating to ${dest.name}.`; }
          if (/stop|cancel/.test(q)) { setNavigating(false); return 'Navigation cancelled.'; }
          if (/step|direction/.test(q)) return dest.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {PLACES.map((p) => (
            <Row key={p.id} selected={p.id === dest.id} onClick={() => { setDest(p); setStep(0); }}>
              <div className="text-[12px] flex items-center gap-1.5"><MapPin size={11} /> {p.name}</div>
              <Muted className="text-[10px]">{p.eta} min · {p.traffic}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: 'var(--theme-surface-alt)' }}>
          <svg className="w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-label="Schematic map"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform var(--motion-normal)' }}>
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="260" stroke="var(--theme-border)" strokeWidth="1" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 52} x2="400" y2={i * 52} stroke="var(--theme-border)" strokeWidth="1" />
            ))}
            <polyline points="50,210 50,104 200,104 200,52 350,52" fill="none"
              stroke="var(--theme-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="210" r="6" fill="var(--theme-accent)" />
            <circle cx="350" cy="52" r="6" fill="var(--theme-success)" />
            {navigating && <circle r="5" fill="var(--theme-text)">
              <animateMotion dur="6s" repeatCount="indefinite" path="M50,210 L50,104 L200,104 L200,52 L350,52" />
            </circle>}
          </svg>
          <div className="absolute top-2 left-2 px-2 py-1 text-[10px]"
            style={{ backgroundColor: 'var(--theme-surface)', borderRadius: 'var(--theme-radius-sm)' }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div className="border-t shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="p-3 flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-[12px] font-medium">{dest.name}</div>
              <Muted className="text-[11px]">{dest.eta} min · via {dest.via} · traffic {dest.traffic.toLowerCase()}</Muted>
            </div>
            <Button variant={navigating ? 'danger' : 'accent'} className="ml-auto"
              onClick={() => { setNavigating((n) => !n); setStep(0); }}>
              {navigating ? 'Stop' : <><Play size={12} /> Start</>}
            </Button>
          </div>
          {navigating && (
            <div className="px-3 pb-3">
              {dest.steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2 py-0.5 text-[12px]"
                  style={{ opacity: i === step ? 1 : 0.45 }}>
                  <span className="w-4 text-center font-mono text-[10px]"
                    style={{ color: i === step ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}>{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ News */

export function NewsApp() {
  const [selected, setSelected] = useState(NEWS[0]);
  const [tag, setTag] = useState('All');
  const [saved, setSaved] = useState(() => new Set());
  const [read, setRead] = useState(() => new Set([NEWS[0].id]));

  const tags = ['All', ...new Set(NEWS.map((n) => n.tag))];
  const list = tag === 'All' ? NEWS : NEWS.filter((n) => n.tag === tag);

  const open = (n) => { setSelected(n); setRead((prev) => new Set(prev).add(n.id)); };

  return (
    <AppFrame
      appId="news"
      title="News"
      subtitle={`${list.length} stories · ${NEWS.length - read.size} unread`}
      toolbar={<Segmented options={tags} value={tag} onChange={setTag} />}
      console={{
        intro: 'News console. Filter by topic, save a story, or summarise.',
        suggestions: ['anything about design?', 'summarise', 'save this'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/save|bookmark/.test(q)) { setSaved((p) => new Set(p).add(selected.id)); return `Saved "${selected.title}".`; }
          if (/summar/.test(q)) return `${selected.title} — ${selected.source}, ${selected.time} ago. Filed under ${selected.tag}.`;
          const hitTag = tags.find((x) => q.includes(x.toLowerCase()));
          if (hitTag) { setTag(hitTag); return `Showing ${hitTag}.`; }
          const hits = NEWS.filter((n) => n.title.toLowerCase().includes(q.replace(/[^a-z ]/g, '').trim()));
          if (hits.length && q.length > 4) return hits.map((n) => `- ${n.title} (${n.source})`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {list.map((n) => (
            <Row key={n.id} selected={n.id === selected.id} onClick={() => open(n)}>
              <div className={`text-[12px] truncate ${read.has(n.id) ? '' : 'font-semibold'}`}>{n.title}</div>
              <div className="flex items-center gap-1.5">
                <Muted className="text-[10px]">{n.source} · {n.time}</Muted>
                {saved.has(n.id) && <Tag tone="accent">saved</Tag>}
              </div>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Tag tone="accent">{selected.tag}</Tag>
          <Button className="ml-auto" onClick={() => setSaved((p) => {
            const next = new Set(p);
            next.has(selected.id) ? next.delete(selected.id) : next.add(selected.id);
            return next;
          })}>
            {saved.has(selected.id) ? 'Saved' : 'Save'}
          </Button>
        </div>
        <h2 className="text-base font-semibold mb-1">{selected.title}</h2>
        <Muted className="text-[12px] block mb-3">{selected.source} · {selected.time} ago</Muted>
        <p className="text-[13px] leading-relaxed mb-3">
          A sample article body. The demo apps carry enough real structure to judge
          layout, density and theming without pretending to be a live feed — nothing
          here talks to a network.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Reading this in a tiled quarter-window is the point: the layout responds to the
          window rather than the screen, so the same article stays legible at any size.
        </p>
      </div>
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Database */

export function DatabaseApp() {
  const [table, setTable] = useState('windows');
  const [sql, setSql] = useState('SELECT * FROM windows;');
  const [result, setResult] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [asc, setAsc] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);

  const data = DB_TABLES[table];
  const rows = useMemo(() => {
    if (sortCol === null) return data.rows;
    const i = data.columns.indexOf(sortCol);
    return [...data.rows].sort((a, b) => (a[i] > b[i] ? 1 : -1) * (asc ? 1 : -1));
  }, [data, sortCol, asc]);

  const run = (query) => {
    const m = /from\s+(\w+)/i.exec(query);
    const name = m?.[1];
    if (name && DB_TABLES[name]) {
      setTable(name);
      setSortCol(null);
      setResult({ ok: true, rows: DB_TABLES[name].rows.length });
      return `${DB_TABLES[name].rows.length} rows from ${name}.`;
    }
    setResult({ ok: false, message: `No table named "${name || '?'}". Try: ${Object.keys(DB_TABLES).join(', ')}.` });
    return `No table named "${name || '?'}".`;
  };

  return (
    <AppFrame
      appId="database"
      title="Database"
      subtitle={`${Object.keys(DB_TABLES).length} tables · ${rows.length} rows in ${table}`}
      console={{
        intro: 'Database console. Run a SELECT or list the schema.',
        suggestions: ['select * from themes', 'list tables'],
        handler: async (t) => {
          if (/list|tables|schema/i.test(t)) {
            return Object.entries(DB_TABLES).map(([n, v]) => `${n}(${v.columns.join(', ')})`).join('\n');
          }
          if (/select/i.test(t)) { setSql(t); return run(t); }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(DB_TABLES).map((t) => (
            <Row key={t} selected={t === table} onClick={() => { setTable(t); setSortCol(null); }}>
              <span className="text-[12px] font-mono">{t}</span>
              <Muted className="text-[10px] block">{DB_TABLES[t].rows.length} rows · {DB_TABLES[t].columns.length} cols</Muted>
            </Row>
          ))}
          {selectedRow && (
            <div className="px-3 pt-4">
              <SectionTitle>Row</SectionTitle>
              {data.columns.map((c, i) => (
                <div key={c} className="text-[11px] flex gap-2">
                  <Muted className="w-16 shrink-0 truncate font-mono">{c}</Muted>
                  <span className="truncate">{String(selectedRow[i])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Input value={sql} onChange={(e) => setSql(e.target.value)} className="font-mono"
            aria-label="SQL" onKeyDown={(e) => { if (e.key === 'Enter') run(sql); }} />
          <Button variant="accent" onClick={() => run(sql)}>Run</Button>
        </div>

        {result && !result.ok && (
          <Card className="p-2 text-[12px]" style={{ borderColor: 'var(--theme-danger)' }}>
            <span style={{ color: 'var(--theme-danger)' }}>{result.message}</span>
          </Card>
        )}

        <Card className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--theme-surface-alt)' }}>
                {data.columns.map((c) => (
                  <th key={c} className="text-left px-2 py-1.5 font-medium font-mono whitespace-nowrap cursor-pointer select-none"
                    onClick={() => { setSortCol(c); setAsc((a) => (sortCol === c ? !a : true)); }}>
                    <span className="inline-flex items-center gap-1">
                      {c}
                      {sortCol === c && <ArrowUpDown size={9} style={{ color: 'var(--theme-accent)' }} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} onClick={() => setSelectedRow(r)}
                  className="border-t cursor-pointer"
                  style={{
                    borderColor: 'var(--theme-border)',
                    backgroundColor: selectedRow === r ? 'var(--theme-accent-soft)' : 'transparent',
                  }}>
                  {r.map((cell, j) => (
                    <td key={j} className="px-2 py-1.5 font-mono whitespace-nowrap">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Muted className="text-[11px]">Click a column to sort, a row to inspect it.</Muted>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- Clock */

export function ClockApp() {
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState('clock');
  const [stopwatch, setStopwatch] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setStopwatch((s) => s + 0.1), 100);
    return () => clearInterval(id);
  }, [running]);

  const zones = [
    { city: 'San Francisco', offset: 0 },
    { city: 'New York', offset: 3 },
    { city: 'London', offset: 8 },
    { city: 'Tokyo', offset: 16 },
  ];
  const shift = (h) => new Date(now.getTime() + h * 3600_000);
  const sw = `${String(Math.floor(stopwatch / 60)).padStart(2, '0')}:${String(Math.floor(stopwatch % 60)).padStart(2, '0')}.${String(Math.floor((stopwatch % 1) * 10))}`;

  return (
    <AppFrame
      appId="clock"
      title="Clock"
      subtitle={tab === 'clock' ? now.toLocaleTimeString() : sw}
      toolbar={<Segmented options={[{ value: 'clock', label: 'Clock' }, { value: 'stopwatch', label: 'Stopwatch' }]} value={tab} onChange={setTab} />}
      console={{
        intro: 'Clock console. Ask the time somewhere, or run the stopwatch.',
        suggestions: ['time in tokyo', 'start stopwatch', 'lap'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/start/.test(q)) { setTab('stopwatch'); setRunning(true); return 'Stopwatch running.'; }
          if (/stop|pause/.test(q)) { setRunning(false); return `Stopped at ${sw}.`; }
          if (/lap/.test(q)) { setLaps((l) => [sw, ...l]); return `Lap at ${sw}.`; }
          if (/reset/.test(q)) { setStopwatch(0); setLaps([]); setRunning(false); return 'Stopwatch reset.'; }
          const hit = zones.find((z) => q.includes(z.city.toLowerCase().split(' ')[0]));
          if (hit) return `${hit.city}: ${shift(hit.offset).toLocaleTimeString()}`;
          if (/time/.test(q)) return zones.map((z) => `${z.city}: ${shift(z.offset).toLocaleTimeString()}`).join('\n');
          return null;
        },
      }}
    >
      {tab === 'clock' ? (
        <div className="p-3 space-y-3">
          <Card className="p-5 text-center">
            <div className="text-4xl font-mono font-semibold tabular-nums">{now.toLocaleTimeString()}</div>
            <Muted className="text-[12px]">{now.toDateString()}</Muted>
          </Card>
          <div>
            <SectionTitle>World clocks</SectionTitle>
            <Card>
              {zones.map((z) => (
                <Row key={z.city} className="flex items-center text-[12px]">
                  <span className="flex-1">{z.city}</span>
                  <Muted className="text-[10px] mr-2 app-hide-sm">{z.offset === 0 ? 'local' : `+${z.offset}h`}</Muted>
                  <span className="font-mono tabular-nums">{shift(z.offset).toLocaleTimeString()}</span>
                </Row>
              ))}
            </Card>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <Card className="p-6 text-center">
            <div className="text-4xl font-mono font-semibold tabular-nums">{sw}</div>
          </Card>
          <div className="flex gap-2">
            <Button variant="accent" className="flex-1 justify-center" onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={13} /> Stop</> : <><Play size={13} /> Start</>}
            </Button>
            <Button className="flex-1 justify-center" onClick={() => setLaps((l) => [sw, ...l])} disabled={!running}>
              <Flag size={13} /> Lap
            </Button>
            <Button className="flex-1 justify-center" onClick={() => { setStopwatch(0); setLaps([]); setRunning(false); }}>
              Reset
            </Button>
          </div>
          {laps.length > 0 && (
            <Card>
              {laps.map((l, i) => (
                <Row key={i} className="flex items-center text-[12px] font-mono">
                  <Muted className="w-10">#{laps.length - i}</Muted>
                  <span className="tabular-nums">{l}</span>
                </Row>
              ))}
            </Card>
          )}
        </div>
      )}
    </AppFrame>
  );
}

/* ---------------------------------------------------------- Code and PDF */

const CODE_FILES = {
  'bsp.js': `export function insert(tree, id, targetId, rects) {
  if (!tree) return leaf(id);
  const rect = rects.get(targetId);
  // Split along the longer axis so panes trend toward square.
  const dir = !rect || rect.w >= rect.h ? 'v' : 'h';
  return replace(tree, targetId, split(dir, leaf(targetId), leaf(id)));
}`,
  'reducer.js': `case T.WINDOW_OPEN: {
  const win = { id, appId: app.id, ws: workspace, floating: false };
  const withWindow = { ...state, windows: [...state.windows, win] };
  return reconcileActive(raise(retile(withWindow, workspace), id));
}`,
  'theme.js': `export function themeToCssVars(input) {
  const t = normalizeTheme(input);
  vars['--theme-radius'] = t.radius + 'px';
  vars['--theme-border-width-focus'] =
    (t.borderWidth > 1 ? t.borderWidth + 2 : t.borderWidth) + 'px';
  return vars;
}`,
};

export function CodeEditorApp() {
  const [file, setFile] = useState('bsp.js');
  const [line, setLine] = useState(null);
  const lines = CODE_FILES[file].split('\n');

  return (
    <AppFrame
      appId="code"
      title="Code"
      subtitle={`${file} · ${lines.length} lines${line ? ` · line ${line}` : ''}`}
      console={{
        intro: 'Code console. Open a file, count lines, or jump to one.',
        suggestions: ['open reducer.js', 'line count', 'go to line 3'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hit = Object.keys(CODE_FILES).find((f) => q.includes(f.split('.')[0]));
          if (hit) { setFile(hit); setLine(null); return `Opened ${hit}.`; }
          if (/line \d/.test(q)) { const n = parseInt(q.replace(/\D+/g, ''), 10); setLine(n); return `Line ${n}: ${lines[n - 1] || '(past the end)'}`; }
          if (/count/.test(q)) return Object.entries(CODE_FILES).map(([f, c]) => `${f}: ${c.split('\n').length} lines`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(CODE_FILES).map((f) => (
            <Row key={f} selected={f === file} onClick={() => { setFile(f); setLine(null); }}>
              <span className="text-[12px] font-mono flex items-center gap-1.5"><FileCode size={11} /> {f}</span>
              <Muted className="text-[10px] block ml-4">{CODE_FILES[f].split('\n').length} lines</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <pre className="p-3 text-[12px] font-mono leading-relaxed overflow-auto m-0" style={{ color: 'var(--theme-text)' }}>
        {lines.map((l, i) => (
          <div key={i} onClick={() => setLine(i + 1)}
            className="flex gap-3 cursor-pointer"
            style={{ backgroundColor: line === i + 1 ? 'var(--theme-accent-soft)' : 'transparent' }}>
            <span className="select-none w-6 text-right shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</span>
            <span style={{ color: /^\s*\/\//.test(l) ? 'var(--theme-text-muted)' : 'var(--theme-text)' }}>{l || ' '}</span>
          </div>
        ))}
      </pre>
    </AppFrame>
  );
}

export function PDFViewerApp() {
  const [page, setPage] = useState(12);
  const [zoom, setZoom] = useState(1);
  const total = 24;

  return (
    <AppFrame
      appId="pdf"
      title="PDF"
      subtitle={`Q3 Report.pdf · page ${page} of ${total} · ${Math.round(zoom * 100)}%`}
      toolbar={
        <>
          <Button variant="ghost" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out"><ZoomOut size={13} /></Button>
          <Button variant="ghost" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in"><ZoomIn size={13} /></Button>
          <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="ghost" onClick={() => setPage((p) => Math.min(total, p + 1))}>Next</Button>
        </>
      }
      console={{
        intro: 'PDF console. Jump to a page or zoom.',
        suggestions: ['go to page 20', 'how many pages?', 'zoom in'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/how many|total/.test(q)) return `${total} pages.`;
          if (/zoom in/.test(q)) { setZoom((z) => Math.min(2, z + 0.2)); return 'Zoomed in.'; }
          if (/zoom out/.test(q)) { setZoom((z) => Math.max(0.6, z - 0.2)); return 'Zoomed out.'; }
          const n = parseInt(q.replace(/\D+/g, ''), 10);
          if (n >= 1 && n <= total) { setPage(n); return `Showing page ${n}.`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2 grid grid-cols-2 gap-1.5 px-2">
          {Array.from({ length: 8 }, (_, i) => page - 2 + i).filter((n) => n >= 1 && n <= total).map((n) => (
            <button key={n} onClick={() => setPage(n)} className="aspect-[3/4] text-[10px] grid place-items-center border"
              style={{
                borderColor: n === page ? 'var(--theme-accent)' : 'var(--theme-border)',
                backgroundColor: 'var(--theme-surface)',
                color: 'var(--theme-text-muted)',
              }}>
              {n}
            </button>
          ))}
        </div>
      }
    >
      <div className="p-4 grid place-items-center">
        <div className="p-5 border transition-transform"
          style={{
            width: `${340 * zoom}px`,
            backgroundColor: 'var(--theme-surface-alt)',
            borderColor: 'var(--theme-border)',
            borderRadius: 'var(--theme-radius-sm)',
            transitionDuration: 'var(--motion-normal)',
          }}>
          <div className="text-[11px] font-semibold mb-3">Q3 Report — page {page}</div>
          <div className="space-y-1.5">
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{
                height: 6,
                width: `${55 + ((page * 7 + i * 13) % 45)}%`,
                backgroundColor: 'var(--theme-border)',
                borderRadius: 2,
              }} />
            ))}
          </div>
        </div>
        <div className="mt-3 w-full max-w-sm"><Meter value={page} max={total} /></div>
      </div>
    </AppFrame>
  );
}
