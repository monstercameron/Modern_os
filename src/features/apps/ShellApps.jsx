import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Star, Plus, X, Lock, Info,
} from 'lucide-react';
import {
  AppFrame, Button, Card, Row, Input, Muted, Tag, SectionTitle, Field, Kbd, Empty,
} from './AppFrame.jsx';
import { store } from '../../kernel/index.js';
import keymap, { MOD_CHOICES } from '../../services/keymap.js';

/* -------------------------------------------------------------- Terminal */

/**
 * A small shell over the desktop's own state.
 *
 * The commands are real: they read the kernel, so `windows` and `ws` report
 * what is actually open rather than a canned string. That makes the terminal
 * a genuine way to inspect the running desktop, not a prop.
 */
const FS = {
  '~': ['projects', 'notes.md', 'readme.md'],
  '~/projects': ['modern-os', 'scratch'],
  '~/projects/modern-os': ['src', 'docs', 'package.json'],
};

export function TerminalApp() {
  const [cwd, setCwd] = useState('~');
  const [history, setHistory] = useState([
    { kind: 'out', text: 'Modern OS shell. Type `help` for what this understands.' },
  ]);
  const [input, setInput] = useState('');
  const [past, setPast] = useState([]);
  const [pastIndex, setPastIndex] = useState(-1);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [history.length]);

  const run = (raw) => {
    const line = raw.trim();
    if (!line) return;
    setPast((p) => [line, ...p]);
    setPastIndex(-1);
    setHistory((h) => [...h, { kind: 'in', text: line, cwd }]);

    const [cmd, ...args] = line.split(/\s+/);
    const say = (text) => setHistory((h) => [...h, { kind: 'out', text }]);
    const state = store.getState();

    switch (cmd) {
      case 'help':
        say([
          'help              this list',
          'ls                list the current directory',
          'cd <dir>          change directory (.. to go up)',
          'pwd               print the working directory',
          'windows           list open windows from the kernel',
          'ws                show workspaces and their contents',
          'theme             show the active theme tokens',
          'keys              list the desktop key bindings',
          'echo <text>       print text',
          'clear             clear the screen',
        ].join('\n'));
        break;
      case 'ls':
        say((FS[cwd] || []).join('  ') || '(empty)');
        break;
      case 'pwd':
        say(cwd);
        break;
      case 'cd': {
        const target = args[0];
        if (!target || target === '~') { setCwd('~'); break; }
        if (target === '..') { setCwd((c) => (c === '~' ? '~' : c.split('/').slice(0, -1).join('/') || '~')); break; }
        const next = `${cwd}/${target}`.replace('~/~', '~');
        if (FS[next]) setCwd(next);
        else say(`cd: no such directory: ${target}`);
        break;
      }
      case 'windows':
        say(state.windows.length
          ? state.windows.map((w) => `${w.id.padEnd(10)} ${w.appId.padEnd(12)} ws${w.ws} ${w.floating ? 'floating' : 'tiled'}${w.m ? ' minimized' : ''}`).join('\n')
          : 'No windows open.');
        break;
      case 'ws':
        say(Array.from({ length: state.workspaces.count }, (_, i) => {
          const n = i + 1;
          const on = state.windows.filter((w) => w.ws === n);
          return `${n === state.workspaces.current ? '*' : ' '} ${n}  ${on.length ? on.map((w) => w.appId).join(', ') : '(empty)'}`;
        }).join('\n'));
        break;
      case 'theme': {
        const cs = getComputedStyle(document.documentElement);
        say(['accent', 'background', 'surface', 'text', 'border', 'radius', 'border-width', 'window-gap']
          .map((k) => `--theme-${k}: ${cs.getPropertyValue(`--theme-${k}`).trim()}`).join('\n'));
        break;
      }
      case 'keys':
        say(keymap.list()
          .filter((b) => b.description)
          .slice(0, 14)
          .map((b) => `${b.id.padEnd(22)} ${b.description}`)
          .join('\n') || 'No bindings registered.');
        break;
      case 'echo':
        say(args.join(' '));
        break;
      case 'clear':
        setHistory([]);
        break;
      default:
        say(`${cmd}: command not found. Try \`help\`.`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { run(input); setInput(''); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(past.length - 1, pastIndex + 1);
      if (past[next] !== undefined) { setPastIndex(next); setInput(past[next]); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = pastIndex - 1;
      if (next < 0) { setPastIndex(-1); setInput(''); }
      else { setPastIndex(next); setInput(past[next]); }
    }
  };

  return (
    <AppFrame
      appId="terminal"
      title="Terminal"
      subtitle={`${cwd} · ${past.length} commands`}
      console={{
        intro: 'Terminal console. Ask in plain words and I will run the matching command.',
        suggestions: ['what windows are open?', 'show the theme', 'list keys'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/window/.test(q)) { run('windows'); return 'Ran `windows`.'; }
          if (/workspace/.test(q)) { run('ws'); return 'Ran `ws`.'; }
          if (/theme|colour|color/.test(q)) { run('theme'); return 'Ran `theme`.'; }
          if (/key|shortcut|binding/.test(q)) { run('keys'); return 'Ran `keys`.'; }
          if (/file|list|director/.test(q)) { run('ls'); return 'Ran `ls`.'; }
          return null;
        },
      }}
    >
      <div
        className="h-full w-full p-3 font-mono text-[12px] leading-relaxed overflow-auto cursor-text"
        style={{ backgroundColor: '#0a0a0a', color: '#6ee7a8' }}
        onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
      >
        {history.map((h, i) => (
          h.kind === 'in'
            ? <div key={i}><span style={{ color: '#5eead4' }}>{h.cwd}$</span> {h.text}</div>
            : <pre key={i} className="whitespace-pre-wrap font-mono m-0" style={{ color: '#a7f3d0' }}>{h.text}</pre>
        ))}
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#5eead4' }}>{cwd}$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="bg-transparent outline-none flex-1 font-mono"
            style={{ color: '#6ee7a8' }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
          />
        </div>
        <div ref={endRef} />
      </div>
    </AppFrame>
  );
}

/* --------------------------------------------------------------- Browser */

const PAGES = {
  'modernos:start': {
    title: 'Start',
    render: (go) => (
      <div className="p-5 max-w-xl">
        <h1 className="text-xl font-semibold mb-1">Modern OS</h1>
        <Muted className="text-[13px] block mb-4">
          A demo browser. These pages are rendered locally — nothing here reaches the network.
        </Muted>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {['modernos:docs', 'modernos:changelog', 'modernos:keys'].map((u) => (
            <Card key={u} className="p-3 cursor-pointer" onClick={() => go(u)}>
              <div className="text-[12px] font-medium">{PAGES[u].title}</div>
              <Muted className="text-[11px]">{u}</Muted>
            </Card>
          ))}
        </div>
      </div>
    ),
  },
  'modernos:docs': {
    title: 'Docs',
    render: () => (
      <div className="p-5 max-w-xl space-y-3">
        <h1 className="text-lg font-semibold">Architecture</h1>
        <p className="text-[13px] leading-relaxed">
          The desktop runs on a headless kernel: a pure reducer owns windows, workspaces
          and the launcher, and the UI reads it through selectors. Layout is a binary tree
          per workspace, so opening a window splits the focused pane rather than stacking on top.
        </p>
        <Card className="p-3">
          <SectionTitle>Services</SectionTitle>
          <div className="text-[12px] space-y-1">
            <div>event bus — namespaced pub/sub</div>
            <div>keymap — one listener, scoped bindings</div>
            <div>theme — colours, shape, depth, motion</div>
            <div>persistence — one namespaced store</div>
          </div>
        </Card>
      </div>
    ),
  },
  'modernos:changelog': {
    title: 'Changelog',
    render: () => (
      <div className="p-5 max-w-xl space-y-2">
        <h1 className="text-lg font-semibold mb-2">Changelog</h1>
        {[
          ['Launcher', 'Column flow, type-to-filter, keyboard navigation'],
          ['Apps', 'Shared frame, ~ console, responsive layouts'],
          ['Theme', 'Motion levels, speed and per-effect switches'],
          ['Input', 'Ctrl+Shift keymap with a reserved-chord audit'],
          ['Tiling', 'Dwindle BSP with floating toggle'],
        ].map(([area, what]) => (
          <div key={area} className="flex gap-3 text-[13px]">
            <Tag tone="accent">{area}</Tag>
            <span className="flex-1">{what}</span>
          </div>
        ))}
      </div>
    ),
  },
  'modernos:keys': {
    title: 'Shortcuts',
    render: () => (
      <div className="p-5 max-w-xl">
        <h1 className="text-lg font-semibold mb-3">Keyboard</h1>
        <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
          {keymap.list().filter((b) => b.description).slice(0, 12).map((b) => (
            <Field key={b.id} label={<Kbd>{b.id}</Kbd>}>{b.description}</Field>
          ))}
        </Card>
      </div>
    ),
  },
};

export function BrowserApp() {
  const [url, setUrl] = useState('modernos:start');
  const [address, setAddress] = useState('modernos:start');
  const [stack, setStack] = useState(['modernos:start']);
  const [pointer, setPointer] = useState(0);
  const [bookmarks, setBookmarks] = useState(['modernos:docs']);
  const [loading, setLoading] = useState(false);

  const go = (next) => {
    if (!PAGES[next]) return false;
    setLoading(true);
    setTimeout(() => setLoading(false), 260);
    setStack((s) => [...s.slice(0, pointer + 1), next]);
    setPointer((p) => p + 1);
    setUrl(next);
    setAddress(next);
    return true;
  };

  const back = () => { if (pointer > 0) { setPointer((p) => p - 1); setUrl(stack[pointer - 1]); setAddress(stack[pointer - 1]); } };
  const forward = () => { if (pointer < stack.length - 1) { setPointer((p) => p + 1); setUrl(stack[pointer + 1]); setAddress(stack[pointer + 1]); } };

  const page = PAGES[url];

  return (
    <AppFrame
      appId="browser"
      title="Browser"
      subtitle={`${page?.title || 'Not found'} · ${url}`}
      console={{
        intro: 'Browser console. Open a page, or list what is available.',
        suggestions: ['open docs', 'list pages', 'bookmark this'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/list|pages|available/.test(q)) return Object.entries(PAGES).map(([u, p]) => `${u} — ${p.title}`).join('\n');
          if (/bookmark/.test(q)) { setBookmarks((b) => (b.includes(url) ? b : [...b, url])); return `Bookmarked ${url}.`; }
          const hit = Object.keys(PAGES).find((u) => q.includes(PAGES[u].title.toLowerCase()));
          if (hit) { go(hit); return `Opened ${PAGES[hit].title}.`; }
          return null;
        },
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-1.5 p-2 border-b shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <Button variant="ghost" onClick={back} disabled={pointer === 0} aria-label="Back"><ArrowLeft size={13} /></Button>
          <Button variant="ghost" onClick={forward} disabled={pointer >= stack.length - 1} aria-label="Forward"><ArrowRight size={13} /></Button>
          <Button variant="ghost" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 260); }} aria-label="Reload">
            <RotateCw size={13} />
          </Button>
          <form className="flex-1 flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); go(address); }}>
            <div className="flex items-center gap-1.5 px-2 py-1 border flex-1"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}>
              <Lock size={10} style={{ color: 'var(--theme-success)' }} />
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                className="bg-transparent outline-none text-[12px] w-full" aria-label="Address"
                style={{ color: 'var(--theme-text)' }} spellCheck={false} />
            </div>
          </form>
          <Button variant="ghost" aria-label="Bookmark"
            onClick={() => setBookmarks((b) => (b.includes(url) ? b.filter((x) => x !== url) : [...b, url]))}>
            <Star size={13} fill={bookmarks.includes(url) ? 'currentColor' : 'none'}
              style={{ color: bookmarks.includes(url) ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }} />
          </Button>
        </div>

        <div className="flex gap-1.5 px-2 py-1 border-b shrink-0 overflow-x-auto" style={{ borderColor: 'var(--theme-border)' }}>
          {bookmarks.map((b) => (
            <button key={b} onClick={() => go(b)} className="px-2 py-0.5 text-[11px] whitespace-nowrap border"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', borderRadius: 'var(--theme-radius-sm)' }}>
              {PAGES[b]?.title || b}
            </button>
          ))}
          {bookmarks.length === 0 && <Muted className="text-[11px] px-1">No bookmarks yet.</Muted>}
        </div>

        {loading && <div className="h-0.5 shrink-0" style={{ backgroundColor: 'var(--theme-accent)' }} />}

        <div className="flex-1 overflow-auto">
          {page ? page.render(go) : (
            <Empty title="Page not found" hint={`Nothing is served at "${url}".`}
              action={<Button onClick={() => go('modernos:start')}>Go to start</Button>} />
          )}
        </div>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------------- About */

export function AboutApp({ init = {} }) {
  const { appTitle } = init;
  const state = store.getState();

  return (
    <AppFrame
      appId="about"
      title={appTitle ? `About ${appTitle}` : 'About'}
      subtitle="Modern OS"
      console={{
        intro: 'About console. Ask what this is, or for the current state.',
        suggestions: ['what is this?', 'system state'],
        handler: async (t) => {
          if (/state|status|running/i.test(t)) {
            return `${state.windows.length} windows across ${state.workspaces.count} workspaces, workspace ${state.workspaces.current} on screen.`;
          }
          if (/what|about/i.test(t)) {
            return 'Modern OS is a desktop environment that runs in a browser tab. The shell is the product — the apps are demos sitting on shared services.';
          }
          return null;
        },
      }}
    >
      <div className="p-5 max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 grid place-items-center"
            style={{ backgroundColor: 'var(--theme-accent)', borderRadius: 'var(--theme-radius)' }}>
            <Info size={22} color="var(--theme-accent-text)" />
          </div>
          <div>
            <div className="text-base font-semibold">Modern OS</div>
            <Muted className="text-[12px]">A desktop that runs in a browser tab</Muted>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed">
          The shell is the product. Windows, workspaces, tiling, theming and input all
          run on shared services, and the apps are demos that sit on top of them.
          Everything is local — there is no backend.
        </p>

        <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
          <Field label="Windows">{state.windows.length}</Field>
          <Field label="Workspaces">{state.workspaces.count}, on {state.workspaces.current}</Field>
          <Field label="Modifier">{MOD_CHOICES[keymap.getMod()]?.label || keymap.getMod()}</Field>
          <Field label="Built with">React 19 · Vite · Tailwind · Framer Motion</Field>
        </Card>

        <div className="text-[12px] space-y-1">
          <div className="flex items-center gap-2"><Kbd>~</Kbd> <Muted>opens any app&rsquo;s console</Muted></div>
          <div className="flex items-center gap-2"><Kbd>Ctrl+Shift+1..5</Kbd> <Muted>switch workspace</Muted></div>
          <div className="flex items-center gap-2"><Kbd>Ctrl+Shift+V</Kbd> <Muted>float or tile a window</Muted></div>
        </div>
      </div>
    </AppFrame>
  );
}
