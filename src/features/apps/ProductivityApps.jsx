import React, { useMemo, useState } from 'react';
import {
  Plus, Check, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  Eye, Pencil, Play, Maximize2,
} from 'lucide-react';
import {
  AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle,
  Stat, Meter, Segmented, Avatar, Modal, Kbd, Toggle,
} from './AppFrame.jsx';
import { TASKS, NOTES, EVENTS, PEOPLE, personById } from './demoData.js';

/* ----------------------------------------------------------------- Tasks */

const PRIORITIES = ['low', 'medium', 'high'];

export function TasksApp() {
  const [tasks, setTasks] = useState(TASKS);
  const [filter, setFilter] = useState('open');
  const [tag, setTag] = useState('all');
  const [draft, setDraft] = useState('');

  const tags = useMemo(() => ['all', ...new Set(tasks.map((t) => t.tag))], [tasks]);

  const shown = useMemo(() => tasks
    .filter((t) => (filter === 'all' ? true : filter === 'open' ? !t.done : t.done))
    .filter((t) => tag === 'all' || t.tag === tag), [tasks, filter, tag]);

  const done = tasks.filter((t) => t.done).length;

  const toggle = (id) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTasks((p) => p.filter((t) => t.id !== id));
  const cyclePriority = (id) => setTasks((p) => p.map((t) => (
    t.id === id ? { ...t, priority: PRIORITIES[(PRIORITIES.indexOf(t.priority) + 1) % 3] } : t)));
  const reorder = (id, dir) => setTasks((p) => {
    const i = p.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const add = (title) => {
    if (!title.trim()) return;
    setTasks((p) => [{ id: `t${Date.now()}`, title: title.trim(), done: false, priority: 'medium', due: 'Today', tag: tag === 'all' ? 'new' : tag }, ...p]);
    setDraft('');
  };

  return (
    <AppFrame
      appId="tasks"
      title="Tasks"
      subtitle={`${tasks.length - done} open · ${done} done`}
      toolbar={<Segmented options={['open', 'done', 'all']} value={filter} onChange={setFilter} />}
      sidebar={
        <div className="py-2">
          <div className="px-3"><SectionTitle>Tags</SectionTitle></div>
          {tags.map((t) => (
            <Row key={t} selected={tag === t} onClick={() => setTag(t)} className="flex items-center">
              <span className="text-[12px] flex-1 capitalize">{t}</span>
              <Muted className="text-[10px]">{t === 'all' ? tasks.length : tasks.filter((x) => x.tag === t).length}</Muted>
            </Row>
          ))}
        </div>
      }
      console={{
        intro: 'Tasks console. Add, complete, reprioritise, or ask what is due.',
        suggestions: ['add draggable split ratios', "what's due today?", 'complete 1'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.startsWith('add ')) { add(t.slice(4)); return `Added "${t.slice(4)}".`; }
          if (q.includes('due')) {
            const due = tasks.filter((x) => !x.done && x.due === 'Today');
            return due.length ? `Due today:\n${due.map((x) => `- ${x.title}`).join('\n')}` : 'Nothing due today.';
          }
          if (q.startsWith('complete')) {
            const n = parseInt(q.replace(/\D+/g, ''), 10);
            const target = shown[n - 1];
            if (target) { toggle(target.id); return `Completed "${target.title}".`; }
            return `There is no task ${n} in this view.`;
          }
          if (q.includes('high')) {
            const hi = tasks.filter((x) => x.priority === 'high' && !x.done);
            return hi.length ? hi.map((x) => `- ${x.title}`).join('\n') : 'No open high-priority tasks.';
          }
          return null;
        },
      }}
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))' }}>
          <Stat label="Open" value={tasks.length - done} />
          <Stat label="Done" value={done} />
          <Stat label="High" value={tasks.filter((t) => !t.done && t.priority === 'high').length} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <SectionTitle>Progress</SectionTitle>
            <Muted className="text-[10px]">{Math.round((done / tasks.length) * 100)}%</Muted>
          </div>
          <Meter value={done} max={tasks.length} tone="success" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); add(draft); }} className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task and press Enter" />
          <Button variant="accent" type="submit" disabled={!draft.trim()}><Plus size={13} /></Button>
        </form>

        <div>
          {shown.length === 0 && <Empty title="Nothing here" hint="Change the filter, or add a task above." />}
          {shown.map((t, i) => (
            <Card key={t.id} className="flex items-center gap-2 px-2.5 py-2 mb-1.5 group">
              <button onClick={() => toggle(t.id)} aria-label={t.done ? 'Mark open' : 'Mark done'}
                className="w-4 h-4 grid place-items-center border shrink-0 transition-colors"
                style={{
                  borderColor: t.done ? 'var(--theme-success)' : 'var(--theme-border)',
                  backgroundColor: t.done ? 'var(--theme-success)' : 'transparent',
                  borderRadius: 'var(--theme-radius-sm)',
                  transitionDuration: 'var(--motion-fast)',
                }}>
                {t.done && <Check size={11} color="#fff" />}
              </button>
              <Muted className="text-[10px] font-mono w-4 shrink-0">{i + 1}</Muted>
              <span className={`flex-1 min-w-0 truncate text-[12px] ${t.done ? 'line-through opacity-55' : ''}`}>{t.title}</span>

              <button onClick={() => cyclePriority(t.id)} title="Change priority">
                <Tag tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'accent' : 'default'}>{t.priority}</Tag>
              </button>
              <Muted className="text-[10px] shrink-0 app-hide-sm">{t.due}</Muted>

              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ transitionDuration: 'var(--motion-fast)' }}>
                <button onClick={() => reorder(t.id, -1)} aria-label="Move up"><ArrowUp size={11} /></button>
                <button onClick={() => reorder(t.id, 1)} aria-label="Move down"><ArrowDown size={11} /></button>
                <button onClick={() => remove(t.id)} aria-label="Delete" style={{ color: 'var(--theme-danger)' }}><Trash2 size={11} /></button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- Notes */

/** A deliberately small markdown renderer: headings, bullets, code and rules. */
function renderMarkdown(src) {
  return src.split('\n').map((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s/, '');
      const size = level === 1 ? 'text-base' : level === 2 ? 'text-sm' : 'text-[13px]';
      return <div key={i} className={`${size} font-semibold mt-2 mb-1`}>{text}</div>;
    }
    if (/^\s*[-*]\s/.test(line)) {
      return (
        <div key={i} className="flex gap-2 text-[13px]">
          <span style={{ color: 'var(--theme-accent)' }}>•</span>
          <span>{line.replace(/^\s*[-*]\s/, '')}</span>
        </div>
      );
    }
    if (/^\s*$/.test(line)) return <div key={i} className="h-2" />;
    return <div key={i} className="text-[13px] leading-relaxed">{line}</div>;
  });
}

export function NotesApp() {
  const [notes, setNotes] = useState(NOTES);
  const [selected, setSelected] = useState(NOTES[0].id);
  const [mode, setMode] = useState('write');
  const [query, setQuery] = useState('');

  const list = notes.filter((n) => (n.title + n.body).toLowerCase().includes(query.toLowerCase()));
  const note = notes.find((n) => n.id === selected);

  const update = (changes) => setNotes((p) => p.map((n) => (n.id === selected ? { ...n, ...changes, updated: 'just now' } : n)));

  return (
    <AppFrame
      appId="notes"
      title="Notes"
      subtitle={note ? `${note.title} · ${note.body.split(/\s+/).filter(Boolean).length} words` : `${notes.length} notes`}
      toolbar={
        <>
          <Segmented
            options={[{ value: 'write', label: 'Write' }, { value: 'preview', label: 'Preview' }]}
            value={mode} onChange={setMode}
          />
          <Button onClick={() => {
            const n = { id: `n${Date.now()}`, title: 'Untitled', updated: 'just now', tag: 'new', body: '# Untitled\n\n' };
            setNotes((p) => [n, ...p]);
            setSelected(n.id);
            setMode('write');
          }}><Plus size={12} /></Button>
        </>
      }
      sidebar={
        <div className="py-2">
          <div className="px-2 pb-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" />
          </div>
          {list.map((n) => (
            <Row key={n.id} selected={n.id === selected} onClick={() => setSelected(n.id)}>
              <div className="text-[12px] font-medium truncate">{n.title}</div>
              <Muted className="text-[10px] truncate block">{n.updated} · {n.tag}</Muted>
            </Row>
          ))}
          {list.length === 0 && <div className="px-3 py-2"><Muted className="text-[11px]">No matches.</Muted></div>}
        </div>
      }
      console={{
        intro: 'Notes console. Search, summarise, or append a line.',
        suggestions: ['search tiling', 'summarise this note', 'append - check gaps'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.startsWith('search ')) {
            const term = q.slice(7);
            setQuery(term);
            const hits = notes.filter((n) => (n.title + n.body).toLowerCase().includes(term));
            return hits.length ? hits.map((n) => `- ${n.title} (${n.tag})`).join('\n') : `Nothing matches "${term}".`;
          }
          if (q.startsWith('append ') && note) { update({ body: `${note.body}\n${t.slice(7)}` }); return 'Appended.'; }
          if (q.includes('summar') && note) return `"${note.title}" — ${note.body.split('\n').filter((l) => l && !l.startsWith('#')).slice(0, 2).join(' ')}`;
          return null;
        },
      }}
    >
      {!note ? <Empty title="No note selected" hint="Pick one from the list, or create a new note." /> : (
        <div className="h-full flex flex-col">
          <input
            value={note.title}
            onChange={(e) => update({ title: e.target.value })}
            className="bg-transparent outline-none text-base font-semibold px-3 pt-3 pb-1"
            style={{ color: 'var(--theme-text)' }}
            aria-label="Note title"
          />
          {mode === 'write' ? (
            <textarea
              value={note.body}
              onChange={(e) => update({ body: e.target.value })}
              spellCheck={false}
              className="flex-1 bg-transparent outline-none resize-none text-[13px] leading-relaxed font-mono px-3 pb-3"
              style={{ color: 'var(--theme-text)' }}
              aria-label="Note body"
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-3 pb-3">{renderMarkdown(note.body)}</div>
          )}
        </div>
      )}
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Calendar */

export function CalendarApp() {
  const [day, setDay] = useState(0);
  const [events, setEvents] = useState(EVENTS);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', start: '10:00', end: '11:00' });
  const [selected, setSelected] = useState(null);

  const labels = ['Today', 'Tomorrow', 'Wednesday'];
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  const forDay = events.filter((e) => (e.day ?? 0) === day);

  const add = () => {
    if (!form.title.trim()) return;
    setEvents((p) => [...p, { id: `e${Date.now()}`, ...form, day, people: [], tone: 'default' }]);
    setAdding(false);
    setForm({ title: '', start: '10:00', end: '11:00' });
  };

  return (
    <AppFrame
      appId="calendar"
      title="Calendar"
      subtitle={`${labels[day]} · ${forDay.length} events`}
      toolbar={
        <>
          <Button variant="ghost" onClick={() => setDay((d) => Math.max(0, d - 1))} aria-label="Previous day"><ChevronLeft size={13} /></Button>
          <span className="text-[12px] px-1 whitespace-nowrap">{labels[day]}</span>
          <Button variant="ghost" onClick={() => setDay((d) => Math.min(2, d + 1))} aria-label="Next day"><ChevronRight size={13} /></Button>
          <Button variant="accent" onClick={() => setAdding(true)}><Plus size={12} /></Button>
        </>
      }
      console={{
        intro: 'Calendar console. Ask what is next, when you are free, or add an event.',
        suggestions: ["what's next?", 'when am I free?', 'add lunch at 12'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/^add /.test(q)) {
            const at = q.match(/at\s+(\d{1,2})/);
            const hour = at ? `${String(at[1]).padStart(2, '0')}:00` : '10:00';
            const title = t.slice(4).replace(/\s+at\s+\d{1,2}.*$/i, '').trim() || 'New event';
            setEvents((p) => [...p, { id: `e${Date.now()}`, title, start: hour, end: `${String(Number(hour.slice(0, 2)) + 1).padStart(2, '0')}:00`, day, people: [], tone: 'default' }]);
            return `Added "${title}" at ${hour}.`;
          }
          if (q.includes('next')) return forDay.length ? `${forDay[0].title} at ${forDay[0].start}` : 'Nothing scheduled.';
          if (q.includes('free')) return `Booked: ${forDay.map((e) => `${e.start}–${e.end}`).join(', ') || 'nothing'}. The rest of the day is open.`;
          if (q.includes('who')) {
            const names = [...new Set(forDay.flatMap((e) => e.people))].map((p) => personById(p).name);
            return names.length ? names.join(', ') : 'No attendees listed.';
          }
          return null;
        },
      }}
    >
      <div className="p-3 relative">
        {hours.map((h) => {
          const at = forDay.filter((e) => parseInt(e.start, 10) === h);
          return (
            <div key={h} className="flex gap-2 min-h-[38px] border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <Muted className="text-[10px] w-10 shrink-0 pt-1 font-mono">{String(h).padStart(2, '0')}:00</Muted>
              <div className="flex-1 py-1 space-y-1">
                {at.map((e) => (
                  <button key={e.id} onClick={() => setSelected(e)} className="w-full text-left px-2 py-1 transition-transform"
                    style={{
                      backgroundColor: e.tone === 'accent' ? 'var(--theme-accent)' : 'var(--theme-surface-alt)',
                      color: e.tone === 'accent' ? 'var(--theme-accent-text)' : 'var(--theme-text)',
                      borderLeft: '3px solid var(--theme-accent)',
                      borderRadius: 'var(--theme-radius-sm)',
                    }}>
                    <div className="text-[12px] font-medium">{e.title}</div>
                    <div className="text-[10px] opacity-80 flex items-center gap-1">
                      {e.start}–{e.end}
                      {e.people.length > 0 && (
                        <span className="flex -space-x-1 ml-1">
                          {e.people.map((p) => <Avatar key={p} person={personById(p)} size={14} />)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <Modal open={adding} title="New event" onClose={() => setAdding(false)}
          footer={<><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="accent" onClick={add}>Add</Button></>}>
          <div className="space-y-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What is it?" />
            <div className="flex gap-2">
              <Input value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} placeholder="Start" />
              <Input value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} placeholder="End" />
            </div>
          </div>
        </Modal>

        <Modal open={!!selected} title={selected?.title || ''} onClose={() => setSelected(null)}
          footer={<>
            <Button variant="danger" onClick={() => { setEvents((p) => p.filter((e) => e.id !== selected.id)); setSelected(null); }}>Delete</Button>
            <Button onClick={() => setSelected(null)}>Close</Button>
          </>}>
          {selected && (
            <div className="space-y-1 text-[12px]">
              <div>{selected.start} – {selected.end}</div>
              <Muted>{selected.people.length ? selected.people.map((p) => personById(p).name).join(', ') : 'No attendees'}</Muted>
            </div>
          )}
        </Modal>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Text editor */

export function TextApp({ init }) {
  const [text, setText] = useState(
    init?.body ||
    '# Metro OS design\n\n' +
    'The shell is the product. Apps are tenants that sit on shared services:\n' +
    'an event bus, a window kernel, a theme engine and one keymap.\n\n' +
    '## Open questions\n\n' +
    '- Should split ratios be draggable?\n' +
    '- Does monocle mode belong in the layout or the window state?\n'
  );
  const [mode, setMode] = useState('write');

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  const reading = Math.max(1, Math.round(words / 200));

  const wrap = (before, after = before) => {
    setText((t) => `${t}${t.endsWith('\n') ? '' : '\n'}${before}text${after}`);
  };

  return (
    <AppFrame
      appId="text"
      title="Text"
      subtitle={`${words} words · ${lines} lines · ~${reading} min read`}
      toolbar={
        <>
          <Button onClick={() => wrap('**')} title="Bold">B</Button>
          <Button onClick={() => wrap('_')} title="Italic"><em>i</em></Button>
          <Button onClick={() => setText((t) => `${t}\n- `)} title="Bullet">•</Button>
          <Segmented
            options={[{ value: 'write', label: 'Write' }, { value: 'preview', label: 'Preview' }]}
            value={mode} onChange={setMode}
          />
        </>
      }
      console={{
        intro: 'Text console. Count words, list headings, or append a line.',
        suggestions: ['word count', 'headings', 'append - draggable ratios'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('count')) return `${words} words, ${text.length} characters, ${lines} lines, about ${reading} minute${reading === 1 ? '' : 's'} to read.`;
          if (q.startsWith('append ')) { setText((prev) => `${prev}\n${t.slice(7)}`); return 'Appended.'; }
          if (q.includes('heading')) {
            const hs = text.split('\n').filter((l) => l.startsWith('#'));
            return hs.length ? hs.join('\n') : 'No headings.';
          }
          return null;
        },
      }}
    >
      {mode === 'write' ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-[13px] leading-relaxed"
          style={{ color: 'var(--theme-text)' }}
          aria-label="Document"
        />
      ) : (
        <div className="p-4 max-w-2xl">{renderMarkdown(text)}</div>
      )}
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Slide deck */

const SLIDES = [
  { title: 'Modern OS', body: 'A desktop that runs in a browser tab', notes: 'Open on the live demo.' },
  { title: 'The bet', body: 'The system is the product.\nApps are tenants on shared services.', notes: 'Kernel, event bus, theme engine, keymap.' },
  { title: 'Tiling', body: 'Dwindle BSP.\nFirst window owns the viewport.\nEach new window halves the last.', notes: 'Floating is a per-window flag.' },
  { title: 'Theming', body: 'Colours, shape, depth and motion.\nOne token set, one write.', notes: 'Seven presets ship.' },
  { title: 'Input', body: 'One keymap, scoped bindings.\nCtrl+Shift, because Super never arrives.', notes: 'Windows takes Meta+digit first.' },
];

export function PresentationApp() {
  const [i, setI] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  const go = (n) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));

  return (
    <AppFrame
      appId="presentation"
      title="Slides"
      subtitle={`${i + 1} of ${SLIDES.length}${presenting ? ' · presenting' : ''}`}
      toolbar={
        <>
          <Button variant="ghost" onClick={() => go(i - 1)} aria-label="Previous slide"><ChevronLeft size={13} /></Button>
          <Button variant="ghost" onClick={() => go(i + 1)} aria-label="Next slide"><ChevronRight size={13} /></Button>
          <Button active={presenting} onClick={() => setPresenting((p) => !p)}>
            {presenting ? <Maximize2 size={12} /> : <Play size={12} />} {presenting ? 'Exit' : 'Present'}
          </Button>
        </>
      }
      sidebar={presenting ? null : (
        <div className="py-2">
          {SLIDES.map((s, n) => (
            <Row key={s.title} selected={n === i} onClick={() => go(n)}>
              <div className="flex gap-2 items-center">
                <Muted className="font-mono text-[10px]">{n + 1}</Muted>
                <span className="text-[11px] truncate">{s.title}</span>
              </div>
            </Row>
          ))}
        </div>
      )}
      console={{
        intro: 'Slides console. Jump to a slide, list the deck, or present.',
        suggestions: ['go to 3', 'outline', 'present'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/outline|list/.test(q)) return SLIDES.map((s, n) => `${n + 1}. ${s.title}`).join('\n');
          if (/present/.test(q)) { setPresenting(true); return 'Presenting.'; }
          if (/exit|stop/.test(q)) { setPresenting(false); return 'Exited presenting.'; }
          const n = parseInt(q.replace(/\D+/g, ''), 10);
          if (n >= 1 && n <= SLIDES.length) { go(n - 1); return `Slide ${n}: ${SLIDES[n - 1].title}`; }
          return null;
        },
      }}
    >
      <div className="h-full flex flex-col p-4 gap-3">
        <div
          className="w-full flex-1 min-h-0 p-6 flex flex-col justify-center border cursor-pointer"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: presenting ? 'var(--theme-background)' : 'var(--theme-surface-alt)',
            borderRadius: 'var(--theme-radius)',
          }}
          onClick={() => go(i + 1)}
          title="Click for the next slide"
        >
          <h2 className={`${presenting ? 'text-2xl' : 'text-xl'} font-semibold mb-3`}>{SLIDES[i].title}</h2>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            {SLIDES[i].body}
          </pre>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {SLIDES.map((_, n) => (
              <button key={n} onClick={() => go(n)} aria-label={`Slide ${n + 1}`}
                className="h-1 flex-1 transition-colors"
                style={{ backgroundColor: n === i ? 'var(--theme-accent)' : 'var(--theme-border)', transitionDuration: 'var(--motion-fast)' }} />
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-[11px] shrink-0">
            <Toggle checked={showNotes} onChange={setShowNotes} label="Presenter notes" /> Notes
          </label>
        </div>

        {showNotes && (
          <Card className="p-2.5 shrink-0">
            <Muted className="text-[10px] uppercase tracking-wider block mb-1">Presenter note</Muted>
            <div className="text-[12px]">{SLIDES[i].notes}</div>
          </Card>
        )}
      </div>
    </AppFrame>
  );
}
