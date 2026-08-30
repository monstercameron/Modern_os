import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, CornerDownLeft, Trash2 } from 'lucide-react';
import { AppFrame, Button, Card, Muted, SectionTitle, Kbd } from '../apps/AppFrame.jsx';
import { useKernel, select } from '../../kernel/index.js';
import keymap, { MOD_CHOICES } from '../../services/keymap.js';
import { runDesktopAgent, DESKTOP_AGENT_SUGGESTIONS } from './desktopAgent.js';

/**
 * The desktop agent, as an app.
 *
 * It was a floating palette; it is a window now, which means the tiling engine
 * places it like anything else and it can sit alongside the work it is talking
 * about instead of covering it. Nothing about it needs to float, so nothing
 * about it does — $mod+V still pops it out if you want it over the top.
 *
 * Its own `~` console is the same brain, so asking it there and asking it in the
 * transcript give the same answers.
 */

let idCounter = 0;
const nextId = () => `a-${++idCounter}`;

export function AgentApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const windows = useKernel(select.allWindows);
  const workspace = useKernel(select.currentWorkspace);
  const modName = MOD_CHOICES[keymap.getMod()]?.label || keymap.getMod();

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const submit = useCallback(async (raw) => {
    const value = (raw ?? input).trim();
    if (!value || busy) return;

    setMessages((prev) => [...prev, { id: nextId(), from: 'you', text: value }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await runDesktopAgent(value);
      setMessages((prev) => [...prev, {
        id: nextId(),
        from: 'agent',
        text: reply || (
          'I did not understand that. I can open and close apps, switch or list ' +
          'workspaces, describe the layout, read the theme and shortcuts, and pass ' +
          'a question through with "ask <app> …".'
        ),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: nextId(), from: 'agent', text: `That failed: ${err?.message || 'unknown error'}` }]);
    } finally {
      setBusy(false);
    }
  }, [input, busy]);

  return (
    <AppFrame
      appId="agent"
      title="Agent"
      subtitle={`${windows.length} windows · workspace ${workspace}`}
      toolbar={
        <Button onClick={() => setMessages([])} disabled={messages.length === 0}>
          <Trash2 size={12} /> Clear
        </Button>
      }
      console={{
        intro: 'This is the same agent as the transcript beside it — ask in either place.',
        suggestions: DESKTOP_AGENT_SUGGESTIONS,
        handler: async (t) => runDesktopAgent(t),
      }}
    >
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="h-full grid place-items-center">
              <div className="text-center max-w-sm">
                <Sparkles size={22} style={{ color: 'var(--theme-accent)' }} className="mx-auto mb-2" />
                <div className="font-medium mb-1">Desktop agent</div>
                <Muted className="text-[12px] block mb-4">
                  I read the running desktop — windows, workspaces, the theme and the keymap —
                  and I can act on it. Nothing here is invented; every answer comes from
                  live state.
                </Muted>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {DESKTOP_AGENT_SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => submit(s)} className="px-2 py-1 text-[11px] border"
                      style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', borderRadius: 'var(--theme-radius-sm)' }}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                  <Kbd>{modName}+G</Kbd> opens this from anywhere
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex gap-2">
              <span className="text-[10px] font-mono shrink-0 pt-0.5 w-11 text-right"
                style={{ color: m.from === 'you' ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}>
                {m.from}
              </span>
              <pre className="text-[12px] whitespace-pre-wrap break-words font-sans m-0 leading-relaxed flex-1"
                style={{ color: 'var(--theme-text)' }}>{m.text}</pre>
            </div>
          ))}

          {busy && (
            <div className="flex gap-2">
              <span className="text-[10px] font-mono w-11 text-right" style={{ color: 'var(--theme-text-muted)' }}>agent</span>
              <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>thinking…</span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <span className="font-mono text-[12px]" style={{ color: 'var(--theme-accent)' }}>&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the desktop something"
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: 'var(--theme-text)' }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Desktop agent input"
          />
          <button type="submit" aria-label="Send" disabled={!input.trim() || busy} className="disabled:opacity-40">
            <CornerDownLeft size={13} />
          </button>
        </form>
      </div>
    </AppFrame>
  );
}

export default AgentApp;
