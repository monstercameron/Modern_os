import React, { useEffect, useMemo, useState } from 'react';
import {
  Folder, FileText, FileCode, Image as ImageIcon, Table, Cloud, MapPin, Play,
} from 'lucide-react';
import { AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle, Stat, Meter } from './AppFrame.jsx';
import { FILES, WEATHER, NEWS, DB_TABLES } from './demoData.js';
import { store } from '../../kernel/index.js';

/* ----------------------------------------------------------------- Files */

const FILE_ICON = { folder: Folder, code: FileCode, doc: FileText, image: ImageIcon, sheet: Table };

export function FilesApp() {
  const [path, setPath] = useState(['src']);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const shown = FILES.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppFrame
      appId="files"
      title="Files"
      subtitle={`/${path.join('/')} · ${shown.length} items`}
      toolbar={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" className="w-28 app-hide-sm" />}
      console={{
        intro: 'Files console. Filter, or ask what is largest or most recent.',
        suggestions: ['what changed today?', 'largest file', 'find bsp'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('today') || q.includes('recent')) return FILES.filter((f) => /Today|min|hour/.test(f.modified)).map((f) => `- ${f.name} (${f.modified})`).join('\n');
          if (q.includes('largest') || q.includes('biggest')) {
            const parse = (s) => (s.includes('MB') ? parseFloat(s) * 1024 : parseFloat(s) || 0);
            const big = [...FILES].sort((a, b) => parse(b.size) - parse(a.size))[0];
            return `${big.name} at ${big.size}.`;
          }
          if (q.startsWith('find ')) { setQuery(q.slice(5)); return `Filtering by "${q.slice(5)}".`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {['src', 'docs', 'public', 'node_modules'].map((p) => (
            <Row key={p} selected={path[0] === p} onClick={() => setPath([p])}>
              <span className="text-[12px] flex items-center gap-1.5"><Folder size={12} /> {p}</span>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-2">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {shown.map((f) => {
            const Icon = FILE_ICON[f.type] || FileText;
            return (
              <Card key={f.id} accent={selected === f.id} onClick={() => setSelected(f.id)}
                className="p-2 cursor-pointer flex items-center gap-2">
                <Icon size={15} style={{ color: 'var(--theme-accent)' }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] truncate">{f.name}</div>
                  <Muted className="text-[10px] truncate block">{f.size} · {f.modified}</Muted>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------- Activity monitor */

export function ActivityMonitorApp() {
  const [history, setHistory] = useState(() => Array.from({ length: 40 }, () => 20 + Math.round(Math.sin(Date.now()) * 5 + 15)));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setHistory((h) => [...h.slice(1), 15 + Math.round(Math.abs(Math.sin(Date.now() / 700)) * 55)]);
    }, 900);
    return () => clearInterval(id);
  }, []);

  const windows = store.getState().windows;
  const cpu = history[history.length - 1];
  const mem = 40 + (windows.length * 7) % 40;

  return (
    <AppFrame
      appId="activity"
      title="Activity Monitor"
      subtitle={`${windows.length} windows · CPU ${cpu}%`}
      console={{
        intro: 'Activity console. Ask about load or what is running.',
        suggestions: ['what is running?', 'cpu'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('running') || q.includes('window')) return windows.length
            ? windows.map((w) => `- ${w.t} (workspace ${w.ws}${w.floating ? ', floating' : ''})`).join('\n')
            : 'No windows open.';
          if (q.includes('cpu') || q.includes('load')) return `CPU ${cpu}%, memory ${mem}%, ${windows.length} windows.`;
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
          <Stat label="CPU" value={`${cpu}%`} />
          <Stat label="Memory" value={`${mem}%`} />
          <Stat label="Windows" value={windows.length} />
        </div>

        <Card className="p-3">
          <SectionTitle>CPU, last 40 samples</SectionTitle>
          <div className="flex items-end gap-[2px] h-20">
            {history.map((v, i) => (
              <div key={i} className="flex-1" style={{ height: `${v}%`, backgroundColor: 'var(--theme-accent)', opacity: 0.35 + (i / history.length) * 0.65 }} />
            ))}
          </div>
        </Card>

        <Card className="p-3">
          <SectionTitle>Open windows</SectionTitle>
          {windows.length === 0 && <Muted className="text-[12px]">Nothing running.</Muted>}
          {windows.map((w) => (
            <div key={w.id} className="flex items-center gap-2 py-1">
              <span className="text-[12px] flex-1 truncate">{w.t}</span>
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

export function DiskUtilityApp() {
  const volumes = [
    { name: 'System', total: 512, used: 318, fs: 'APFS' },
    { name: 'Projects', total: 1024, used: 640, fs: 'APFS' },
    { name: 'Backup', total: 2048, used: 410, fs: 'exFAT' },
  ];
  const [selected, setSelected] = useState(volumes[0].name);
  const vol = volumes.find((v) => v.name === selected);

  return (
    <AppFrame
      appId="disk"
      title="Disk Utility"
      subtitle={`${volumes.length} volumes`}
      console={{
        intro: 'Disk console. Ask about free space.',
        suggestions: ['how much free space?', 'which volume is fullest?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('free')) return volumes.map((v) => `${v.name}: ${v.total - v.used} GB free of ${v.total} GB`).join('\n');
          if (q.includes('full')) {
            const worst = [...volumes].sort((a, b) => b.used / b.total - a.used / a.total)[0];
            return `${worst.name} is ${Math.round((worst.used / worst.total) * 100)}% full.`;
          }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {volumes.map((v) => (
            <Row key={v.name} selected={v.name === selected} onClick={() => setSelected(v.name)}>
              <div className="text-[12px]">{v.name}</div>
              <Muted className="text-[10px]">{v.total} GB · {v.fs}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
          <Stat label="Capacity" value={`${vol.total} GB`} />
          <Stat label="Used" value={`${vol.used} GB`} />
          <Stat label="Free" value={`${vol.total - vol.used} GB`} />
        </div>
        <Card className="p-3">
          <SectionTitle>{vol.name}</SectionTitle>
          <Meter value={vol.used} max={vol.total} tone={vol.used / vol.total > 0.8 ? 'danger' : 'accent'} />
          <Muted className="text-[11px] mt-2 block">{Math.round((vol.used / vol.total) * 100)}% used · {vol.fs}</Muted>
        </Card>
        <div className="flex gap-2">
          <Button>Verify</Button>
          <Button>Repair</Button>
          <Button variant="danger">Erase</Button>
        </div>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Calculator */

export function CalculatorApp() {
  const [expr, setExpr] = useState('');
  const [history, setHistory] = useState([]);

  const evaluate = (input) => {
    // A deliberately small evaluator: digits and operators only, no identifiers.
    if (!/^[\d\s+\-*/().%]+$/.test(input)) throw new Error('only numbers and + - * / ( ) are allowed');
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${input})`)();
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('that does not come out to a number');
    return value;
  };

  const run = (input) => {
    try {
      const value = evaluate(input);
      setHistory((h) => [{ expr: input, value }, ...h].slice(0, 12));
      setExpr(String(value));
      return value;
    } catch (err) {
      setHistory((h) => [{ expr: input, error: err.message }, ...h].slice(0, 12));
      return null;
    }
  };

  const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];

  return (
    <AppFrame
      appId="calculator"
      title="Calculator"
      subtitle={history.length ? `${history.length} in history` : 'Ready'}
      console={{
        intro: 'Calculator console. Type an expression and I will work it out.',
        suggestions: ['12 * (3 + 4)', '1024 / 8'],
        handler: async (t) => {
          try {
            const value = evaluate(t);
            setHistory((h) => [{ expr: t, value }, ...h].slice(0, 12));
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
            className="w-full bg-transparent outline-none text-right text-2xl font-mono"
            style={{ color: 'var(--theme-text)' }}
          />
        </Card>
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
            <SectionTitle>History</SectionTitle>
            {history.map((h, i) => (
              <div key={i} className="flex justify-between text-[12px] font-mono py-0.5">
                <Muted>{h.expr}</Muted>
                <span style={{ color: h.error ? 'var(--theme-danger)' : 'var(--theme-text)' }}>
                  {h.error ? 'error' : h.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Weather */

export function WeatherApp() {
  const w = WEATHER;
  const max = Math.max(...w.hourly.map((h) => h.t));
  const min = Math.min(...w.hourly.map((h) => h.t));

  return (
    <AppFrame
      appId="weather"
      title="Weather"
      subtitle={`${w.place} · ${w.now.condition}`}
      console={{
        intro: 'Weather console. Ask about today or the week.',
        suggestions: ['will it rain?', 'warmest day'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('rain')) return 'No rain in the five-day outlook. Fog on Tuesday morning.';
          if (q.includes('warm') || q.includes('hot')) {
            const best = [...w.days].sort((a, b) => b.hi - a.hi)[0];
            return `${best.d} at ${best.hi}°, ${best.condition.toLowerCase()}.`;
          }
          if (q.includes('now') || q.includes('today')) return `${w.now.temp}°, feels like ${w.now.feels}°. ${w.now.condition}, wind ${w.now.wind} mph, humidity ${w.now.humidity}%.`;
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-4 flex items-center gap-4">
          <Cloud size={40} style={{ color: 'var(--theme-accent)' }} />
          <div>
            <div className="text-3xl font-semibold leading-none">{w.now.temp}°</div>
            <Muted className="text-[12px]">{w.now.condition} · feels like {w.now.feels}°</Muted>
          </div>
        </Card>

        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))' }}>
          <Stat label="Wind" value={`${w.now.wind} mph`} />
          <Stat label="Humidity" value={`${w.now.humidity}%`} />
          <Stat label="UV index" value={w.now.uv} />
        </div>

        <Card className="p-3">
          <SectionTitle>Next eight hours</SectionTitle>
          <div className="flex items-end gap-1.5 h-20">
            {w.hourly.map((h) => (
              <div key={h.h} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px]">{h.t}°</span>
                <div className="w-full" style={{
                  height: `${20 + ((h.t - min) / Math.max(1, max - min)) * 60}%`,
                  backgroundColor: 'var(--theme-accent)',
                  borderRadius: 'var(--theme-radius-sm)',
                }} />
                <Muted className="text-[9px]">{h.h}</Muted>
              </div>
            ))}
          </div>
        </Card>

        <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
          {w.days.map((d) => (
            <div key={d.d} className="flex items-center gap-3 px-3 py-2 text-[12px]" style={{ borderColor: 'var(--theme-border)' }}>
              <span className="w-8">{d.d}</span>
              <Muted className="flex-1 truncate">{d.condition}</Muted>
              <span className="font-mono">{d.hi}° / {d.lo}°</span>
            </div>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ Maps */

export function MapsApp() {
  const places = [
    { id: 1, name: 'Work', eta: '12 min', via: 'Market St', traffic: 'Light' },
    { id: 2, name: 'Home', eta: '18 min', via: 'Highway 84', traffic: 'Moderate' },
    { id: 3, name: 'Coffee Shop', eta: '5 min', via: '3rd St', traffic: 'Light' },
  ];
  const [dest, setDest] = useState(places[0]);

  return (
    <AppFrame
      appId="maps"
      title="Maps"
      subtitle={`${dest.name} · ${dest.eta} via ${dest.via}`}
      console={{
        intro: 'Maps console. Ask for a route.',
        suggestions: ['route to home', 'how is traffic?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hit = places.find((p) => q.includes(p.name.toLowerCase()));
          if (hit) { setDest(hit); return `${hit.name}: ${hit.eta} via ${hit.via}, traffic ${hit.traffic.toLowerCase()}.`; }
          if (q.includes('traffic')) return places.map((p) => `${p.name}: ${p.traffic}`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {places.map((p) => (
            <Row key={p.id} selected={p.id === dest.id} onClick={() => setDest(p)}>
              <div className="text-[12px] flex items-center gap-1.5"><MapPin size={11} /> {p.name}</div>
              <Muted className="text-[10px]">{p.eta} · {p.traffic}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: 'var(--theme-surface-alt)' }}>
          {/* A schematic map: grid streets plus a highlighted route. */}
          <svg className="w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-label="Schematic map">
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
          </svg>
        </div>
        <div className="p-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <div className="text-[12px] font-medium">{dest.name}</div>
            <Muted className="text-[11px]">{dest.eta} · via {dest.via} · traffic {dest.traffic.toLowerCase()}</Muted>
          </div>
          <Button variant="accent" className="ml-auto"><Play size={12} /> Start</Button>
        </div>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ News */

export function NewsApp() {
  const [selected, setSelected] = useState(NEWS[0]);
  return (
    <AppFrame
      appId="news"
      title="News"
      subtitle={`${NEWS.length} stories`}
      console={{
        intro: 'News console. Ask for a topic or a summary.',
        suggestions: ['anything about design?', 'summarise'],
        handler: async (t) => {
          const q = t.toLowerCase();
          const hits = NEWS.filter((n) => (n.title + n.tag).toLowerCase().includes(q.replace(/[^a-z ]/g, '').trim()));
          if (q.includes('summar')) return `${selected.title} — ${selected.source}, ${selected.time} ago. Filed under ${selected.tag}.`;
          if (hits.length && q.length > 4) return hits.map((n) => `- ${n.title} (${n.source})`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {NEWS.map((n) => (
            <Row key={n.id} selected={n.id === selected.id} onClick={() => setSelected(n)}>
              <div className="text-[12px] truncate">{n.title}</div>
              <Muted className="text-[10px]">{n.source} · {n.time}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-4">
        <Tag tone="accent">{selected.tag}</Tag>
        <h2 className="text-base font-semibold mt-2 mb-1">{selected.title}</h2>
        <Muted className="text-[12px] block mb-3">{selected.source} · {selected.time} ago</Muted>
        <p className="text-[13px] leading-relaxed">
          A sample article body. The demo apps carry enough real structure to judge
          layout, density and theming without pretending to be a live feed — nothing
          here talks to a network.
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
  const data = DB_TABLES[table];

  const run = (query) => {
    const m = /from\s+(\w+)/i.exec(query);
    const name = m?.[1];
    if (name && DB_TABLES[name]) {
      setTable(name);
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
      subtitle={`${Object.keys(DB_TABLES).length} tables · ${data.rows.length} rows`}
      console={{
        intro: 'Database console. Run a SELECT or list the tables.',
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
            <Row key={t} selected={t === table} onClick={() => setTable(t)}>
              <span className="text-[12px] font-mono">{t}</span>
              <Muted className="text-[10px] block">{DB_TABLES[t].rows.length} rows</Muted>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Input value={sql} onChange={(e) => setSql(e.target.value)} className="font-mono"
            onKeyDown={(e) => { if (e.key === 'Enter') run(sql); }} />
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
                  <th key={c} className="text-left px-2 py-1.5 font-medium font-mono whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  {r.map((cell, j) => (
                    <td key={j} className="px-2 py-1.5 font-mono whitespace-nowrap">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- Clock */

export function ClockApp() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const zones = [
    { city: 'San Francisco', offset: 0 },
    { city: 'New York', offset: 3 },
    { city: 'London', offset: 8 },
    { city: 'Tokyo', offset: 16 },
  ];
  const shift = (h) => new Date(now.getTime() + h * 3600_000);

  return (
    <AppFrame
      appId="clock"
      title="Clock"
      subtitle={now.toLocaleTimeString()}
      console={{
        intro: 'Clock console. Ask the time somewhere.',
        suggestions: ['time in tokyo', 'time in london'],
        handler: async (t) => {
          const hit = zones.find((z) => t.toLowerCase().includes(z.city.toLowerCase().split(' ')[0]));
          if (hit) return `${hit.city}: ${shift(hit.offset).toLocaleTimeString()}`;
          if (/time/i.test(t)) return zones.map((z) => `${z.city}: ${shift(z.offset).toLocaleTimeString()}`).join('\n');
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <Card className="p-5 text-center">
          <div className="text-4xl font-mono font-semibold tabular-nums">{now.toLocaleTimeString()}</div>
          <Muted className="text-[12px]">{now.toDateString()}</Muted>
        </Card>
        <div>
          <SectionTitle>World clocks</SectionTitle>
          <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
            {zones.map((z) => (
              <div key={z.city} className="flex items-center px-3 py-2 text-[12px]" style={{ borderColor: 'var(--theme-border)' }}>
                <span className="flex-1">{z.city}</span>
                <span className="font-mono tabular-nums">{shift(z.offset).toLocaleTimeString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------------- Code / PDF ---- */

export function CodeEditorApp() {
  const files = {
    'bsp.js': `export function insert(tree, id, targetId, rects) {\n  if (!tree) return leaf(id);\n  const rect = rects.get(targetId);\n  const dir = !rect || rect.w >= rect.h ? 'v' : 'h';\n  // split the target, the new window takes half\n}`,
    'reducer.js': `case T.WINDOW_OPEN: {\n  const win = { id, appId: app.id, ws: workspace, floating: false };\n  return reconcileActive(raise(retile(withWindow, workspace), id));\n}`,
    'theme.js': `export function themeToCssVars(input) {\n  const t = normalizeTheme(input);\n  vars['--theme-radius'] = t.radius + 'px';\n  return vars;\n}`,
  };
  const [file, setFile] = useState('bsp.js');

  return (
    <AppFrame
      appId="code"
      title="Code"
      subtitle={`${file} · ${files[file].split('\n').length} lines`}
      console={{
        intro: 'Code console. Open a file or count lines.',
        suggestions: ['open reducer.js', 'line count'],
        handler: async (t) => {
          const hit = Object.keys(files).find((f) => t.toLowerCase().includes(f.split('.')[0]));
          if (hit) { setFile(hit); return `Opened ${hit}.`; }
          if (/line|count/i.test(t)) return Object.entries(files).map(([f, c]) => `${f}: ${c.split('\n').length} lines`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(files).map((f) => (
            <Row key={f} selected={f === file} onClick={() => setFile(f)}>
              <span className="text-[12px] font-mono flex items-center gap-1.5"><FileCode size={11} /> {f}</span>
            </Row>
          ))}
        </div>
      }
    >
      <pre className="p-3 text-[12px] font-mono leading-relaxed overflow-auto" style={{ color: 'var(--theme-text)' }}>
        {files[file].split('\n').map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="select-none w-6 text-right" style={{ color: 'var(--theme-text-muted)' }}>{i + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </AppFrame>
  );
}

export function PDFViewerApp() {
  const [page, setPage] = useState(12);
  const total = 24;
  return (
    <AppFrame
      appId="pdf"
      title="PDF"
      subtitle={`Q3 Report.pdf · page ${page} of ${total}`}
      console={{
        intro: 'PDF console. Jump to a page.',
        suggestions: ['go to page 20', 'how many pages?'],
        handler: async (t) => {
          if (/how many|total/i.test(t)) return `${total} pages.`;
          const n = parseInt(t.replace(/\D+/g, ''), 10);
          if (n >= 1 && n <= total) { setPage(n); return `Showing page ${n}.`; }
          return null;
        },
      }}
      toolbar={
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="ghost" onClick={() => setPage((p) => Math.min(total, p + 1))}>Next</Button>
        </div>
      }
    >
      <div className="p-4 grid place-items-center">
        <div className="w-full max-w-sm aspect-[3/4] p-5 border"
          style={{ backgroundColor: 'var(--theme-surface-alt)', borderColor: 'var(--theme-border)', borderRadius: 'var(--theme-radius-sm)' }}>
          <div className="text-[11px] font-semibold mb-3">Q3 Report — page {page}</div>
          <div className="space-y-1.5">
            {Array.from({ length: 12 }, (_, i) => (
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
