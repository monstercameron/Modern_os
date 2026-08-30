import React, { useMemo, useState } from 'react';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle, Stat, Meter } from './AppFrame.jsx';
import { TASKS, NOTES, EVENTS, personById } from './demoData.js';

/* ----------------------------------------------------------------- Tasks */

export function TasksApp() {
  const [tasks, setTasks] = useState(TASKS);
  const [filter, setFilter] = useState('open');
  const [draft, setDraft] = useState('');

  const shown = useMemo(() => tasks.filter((t) =>
    filter === 'all' ? true : filter === 'open' ? !t.done : t.done), [tasks, filter]);

  const done = tasks.filter((t) => t.done).length;

  const toggle = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const add = (title) => {
    if (!title.trim()) return;
    setTasks((prev) => [{ id: `t${Date.now()}`, title: title.trim(), done: false, priority: 'medium', due: 'Today', tag: 'new' }, ...prev]);
    setDraft('');
  };

  return (
    <AppFrame
      appId="tasks"
      title="Tasks"
      subtitle={`${tasks.length - done} open · ${done} done`}
      console={{
        intro: 'Tasks console. Add, complete, or ask what is due.',
        suggestions: ['add draggable split ratios', "what's due today?", 'complete 2'],
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
            return `There is no task ${n} in the current view.`;
          }
          if (q.includes('high')) return tasks.filter((x) => x.priority === 'high').map((x) => `- ${x.title}`).join('\n');
          return null;
        },
      }}
      toolbar={
        <div className="flex gap-1">
          {['open', 'done', 'all'].map((f) => (
            <Button key={f} active={filter === f} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        <div className="grid gap-2 app-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
          <Stat label="Open" value={tasks.length - done} />
          <Stat label="Done" value={done} />
          <Stat label="High priority" value={tasks.filter((t) => !t.done && t.priority === 'high').length} />
        </div>

        <div>
          <SectionTitle>Progress</SectionTitle>
          <Meter value={done} max={tasks.length} tone="success" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); add(draft); }} className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task" />
          <Button variant="accent" type="submit"><Plus size={13} /></Button>
        </form>

        <div>
          {shown.length === 0 && <Empty title="Nothing here" hint="Change the filter or add a task." />}
          {shown.map((t, i) => (
            <Card key={t.id} className="flex items-center gap-2 px-2.5 py-2 mb-1.5">
              <button onClick={() => toggle(t.id)} aria-label="Toggle" className="w-4 h-4 grid place-items-center border shrink-0"
                style={{
                  borderColor: t.done ? 'var(--theme-success)' : 'var(--theme-border)',
                  backgroundColor: t.done ? 'var(--theme-success)' : 'transparent',
                  borderRadius: 'var(--theme-radius-sm)',
                }}>
                {t.done && <Check size={11} color="#fff" />}
              </button>
              <Muted className="text-[10px] font-mono w-4 shrink-0">{i + 1}</Muted>
              <span className={`flex-1 min-w-0 truncate text-[12px] ${t.done ? 'line-through opacity-60' : ''}`}>{t.title}</span>
              <Tag tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'accent' : 'default'}>{t.priority}</Tag>
              <Muted className="text-[10px] shrink-0 app-hide-sm">{t.due}</Muted>
            </Card>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- Notes */

export function NotesApp() {
  const [notes, setNotes] = useState(NOTES);
  const [selected, setSelected] = useState(NOTES[0].id);
  const note = notes.find((n) => n.id === selected);

  const update = (body) => setNotes((prev) => prev.map((n) => (n.id === selected ? { ...n, body, updated: 'just now' } : n)));

  return (
    <AppFrame
      appId="notes"
      title="Notes"
      subtitle={`${notes.length} notes`}
      console={{
        intro: 'Notes console. Search the notes or ask for a summary.',
        suggestions: ['search tiling', 'summarise this note'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.startsWith('search ')) {
            const term = q.slice(7);
            const hits = notes.filter((n) => (n.title + n.body).toLowerCase().includes(term));
            return hits.length ? hits.map((n) => `- ${n.title} (${n.tag})`).join('\n') : `Nothing matches "${term}".`;
          }
          if (q.includes('summar')) return `"${note.title}" — ${note.body.split('\n').filter(Boolean).slice(0, 2).join(' ')}`;
          return null;
        },
      }}
      toolbar={
        <Button onClick={() => {
          const n = { id: `n${Date.now()}`, title: 'Untitled', updated: 'just now', tag: 'new', body: '' };
          setNotes((prev) => [n, ...prev]);
          setSelected(n.id);
        }}><Plus size={13} /> New</Button>
      }
      sidebar={
        <div className="py-2">
          {notes.map((n) => (
            <Row key={n.id} selected={n.id === selected} onClick={() => setSelected(n.id)}>
              <div className="text-[12px] font-medium truncate">{n.title}</div>
              <Muted className="text-[10px] truncate block">{n.updated} · {n.tag}</Muted>
            </Row>
          ))}
        </div>
      }
    >
      {!note ? <Empty title="No note selected" /> : (
        <div className="h-full flex flex-col p-3 gap-2">
          <input
            value={note.title}
            onChange={(e) => setNotes((prev) => prev.map((n) => (n.id === selected ? { ...n, title: e.target.value } : n)))}
            className="bg-transparent outline-none text-base font-semibold"
            style={{ color: 'var(--theme-text)' }}
          />
          <textarea
            value={note.body}
            onChange={(e) => update(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent outline-none resize-none text-[13px] leading-relaxed font-mono"
            style={{ color: 'var(--theme-text)' }}
          />
        </div>
      )}
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Calendar */

export function CalendarApp() {
  const [day, setDay] = useState(0);
  const labels = ['Today', 'Tomorrow', 'Wednesday'];
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i);
  const events = day === 0 ? EVENTS : day === 1 ? EVENTS.slice(0, 2) : EVENTS.slice(2);

  return (
    <AppFrame
      appId="calendar"
      title="Calendar"
      subtitle={`${labels[day]} · ${events.length} events`}
      console={{
        intro: 'Calendar console. Ask what is next or who is in a meeting.',
        suggestions: ["what's next?", 'when am I free?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('next')) return events.length ? `${events[0].title} at ${events[0].start}` : 'Nothing scheduled.';
          if (q.includes('free')) {
            const busy = events.map((e) => `${e.start}–${e.end}`).join(', ');
            return `Booked: ${busy}. Everything else in the working day is free.`;
          }
          if (q.includes('who')) return events.flatMap((e) => e.people).map((p) => personById(p).name).join(', ') || 'No attendees listed.';
          return null;
        },
      }}
      toolbar={
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => setDay((d) => Math.max(0, d - 1))}><ChevronLeft size={13} /></Button>
          <span className="text-[12px] px-1">{labels[day]}</span>
          <Button variant="ghost" onClick={() => setDay((d) => Math.min(2, d + 1))}><ChevronRight size={13} /></Button>
        </div>
      }
    >
      <div className="p-3">
        {hours.map((h) => {
          const at = events.filter((e) => parseInt(e.start, 10) === h);
          return (
            <div key={h} className="flex gap-2 min-h-[38px] border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <Muted className="text-[10px] w-10 shrink-0 pt-1 font-mono">{String(h).padStart(2, '0')}:00</Muted>
              <div className="flex-1 py-1 space-y-1">
                {at.map((e) => (
                  <div key={e.id} className="px-2 py-1"
                    style={{
                      backgroundColor: e.tone === 'accent' ? 'var(--theme-accent)' : 'var(--theme-surface-alt)',
                      color: e.tone === 'accent' ? 'var(--theme-accent-text)' : 'var(--theme-text)',
                      borderLeft: '3px solid var(--theme-accent)',
                      borderRadius: 'var(--theme-radius-sm)',
                    }}>
                    <div className="text-[12px] font-medium">{e.title}</div>
                    <div className="text-[10px] opacity-80">
                      {e.start}–{e.end}
                      {e.people.length > 0 && ` · ${e.people.map((p) => personById(p).name.split(' ')[0]).join(', ')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <AppFrame
      appId="text"
      title="Text"
      subtitle={`${words} words · ${text.split('\n').length} lines`}
      console={{
        intro: 'Text console. Ask for a word count, or append a line.',
        suggestions: ['word count', 'append - draggable ratios'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('count')) return `${words} words, ${text.length} characters, ${text.split('\n').length} lines.`;
          if (q.startsWith('append ')) { setText((prev) => `${prev}\n${t.slice(7)}`); return 'Appended.'; }
          if (q.includes('headings')) return text.split('\n').filter((l) => l.startsWith('#')).join('\n') || 'No headings.';
          return null;
        },
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-[13px] leading-relaxed"
        style={{ color: 'var(--theme-text)' }}
      />
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Slide deck */

export function PresentationApp() {
  const slides = [
    { title: 'Modern OS', body: 'A desktop that runs in a browser tab' },
    { title: 'The bet', body: 'The system is the product.\nApps are tenants on shared services.' },
    { title: 'Tiling', body: 'Dwindle BSP.\nFirst window owns the viewport.\nEach new window halves the last.' },
    { title: 'Theming', body: 'Colours, shape, depth and motion.\nOne token set, one write.' },
    { title: 'Input', body: 'One keymap, scoped bindings.\nCtrl+Shift, because Super never arrives.' },
  ];
  const [i, setI] = useState(0);

  return (
    <AppFrame
      appId="slides"
      title="Slides"
      subtitle={`${i + 1} of ${slides.length}`}
      console={{
        intro: 'Slides console. Jump to a slide or list the deck.',
        suggestions: ['go to 3', 'outline'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('outline') || q.includes('list')) return slides.map((s, n) => `${n + 1}. ${s.title}`).join('\n');
          const n = parseInt(q.replace(/\D+/g, ''), 10);
          if (n >= 1 && n <= slides.length) { setI(n - 1); return `Showing slide ${n}: ${slides[n - 1].title}`; }
          return null;
        },
      }}
      toolbar={
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setI((v) => Math.max(0, v - 1))}><ChevronLeft size={13} /></Button>
          <Button variant="ghost" onClick={() => setI((v) => Math.min(slides.length - 1, v + 1))}><ChevronRight size={13} /></Button>
        </div>
      }
      sidebar={
        <div className="py-2">
          {slides.map((s, n) => (
            <Row key={s.title} selected={n === i} onClick={() => setI(n)}>
              <span className="text-[11px]"><Muted className="font-mono mr-1">{n + 1}</Muted>{s.title}</span>
            </Row>
          ))}
        </div>
      }
    >
      <div className="h-full p-6 grid place-items-center">
        <div className="w-full max-w-lg aspect-[16/10] p-6 flex flex-col justify-center border"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius)' }}>
          <h2 className="text-xl font-semibold mb-3">{slides[i].title}</h2>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            {slides[i].body}
          </pre>
        </div>
      </div>
    </AppFrame>
  );
}
