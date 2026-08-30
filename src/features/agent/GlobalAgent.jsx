import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CornerDownLeft } from 'lucide-react';
import { useMotion } from '../../hooks/useMotion.js';
import keymap, { SCOPES } from '../../services/keymap.js';
import eventBus from '../../utils/eventBus.js';
import { DESKTOP_AGENT_TOGGLE } from '../../hooks/useDesktopKeymap.js';
import { runDesktopAgent, DESKTOP_AGENT_INTRO, DESKTOP_AGENT_SUGGESTIONS } from './desktopAgent.js';

/**
 * The desktop agent.
 *
 * Where an app's console knows one app, this one knows the machine: it can open
 * and close apps, move around workspaces, read the theme and the keymap, and
 * hand a question to whichever app is focused. It floats over everything rather
 * than living inside a window, because it is not an app.
 */

let idCounter = 0;
const nextId = () => `g-${++idCounter}`;

export function GlobalAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const motionSettings = useMotion();

  useEffect(() => {
    const off = eventBus.subscribe(DESKTOP_AGENT_TOGGLE, () => setOpen((v) => !v));
    return off;
  }, []);

  // While the agent is up it owns Escape, so the launcher does not also react.
  useEffect(() => {
    if (!open) return undefined;
    const release = keymap.pushScope(SCOPES.MODAL);
    // Both closers are registered in the modal scope, which is what lets them
    // fire while the caret is in the agent's own input.
    const off = keymap.bindAll([
      ['escape', () => setOpen(false),
        { scope: SCOPES.MODAL, description: 'Close the desktop agent', owner: 'agent' }],
      ['$mod+g', () => setOpen(false),
        { scope: SCOPES.MODAL, description: 'Close the desktop agent', owner: 'agent' }],
    ]);
    inputRef.current?.focus();
    if (messages.length === 0) {
      setMessages([{ id: nextId(), from: 'agent', text: DESKTOP_AGENT_INTRO }]);
    }
    return () => { off(); release(); };
  }, [open, messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const submit = useCallback(async (raw) => {
    const value = (raw ?? input).trim();
    if (!value || busy) return;

    setMessages((prev) => [...prev, { id: nextId(), from: 'you', text: value }]);
    setInput('');

    if (value === '/clear') { setMessages([]); return; }

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
    <AnimatePresence>
      {open && (
        <motion.div
          key="global-agent"
          data-global-agent
          className="absolute inset-0 z-[1800] grid place-items-start justify-center pt-[12vh]"
          style={{ backgroundColor: 'var(--theme-overlay)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionSettings.tween('fast')}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.div
            className="w-[min(640px,92vw)] flex flex-col overflow-hidden border"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-accent)',
              borderRadius: 'var(--theme-radius)',
              boxShadow: 'var(--theme-shadow)',
            }}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={motionSettings.spring('fast')}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)' }}>
              <Sparkles size={13} style={{ color: 'var(--theme-accent)' }} />
              <span className="text-[12px] font-semibold">Desktop agent</span>
              <span className="text-[10px] ml-auto" style={{ color: 'var(--theme-text-muted)' }}>Esc to close</span>
              <button onClick={() => setOpen(false)} aria-label="Close agent"><X size={12} /></button>
            </div>

            <div ref={scrollRef} className="max-h-[46vh] overflow-y-auto px-3 py-2 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2">
                  <span className="text-[10px] font-mono shrink-0 pt-0.5 w-11 text-right"
                    style={{ color: m.from === 'you' ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}>
                    {m.from}
                  </span>
                  <pre className="text-[12px] whitespace-pre-wrap break-words font-sans m-0 leading-relaxed"
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

            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
                {DESKTOP_AGENT_SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="px-2 py-1 text-[11px] border"
                    style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', borderRadius: 'var(--theme-radius-sm)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
              style={{ borderColor: 'var(--theme-border)' }}>
              <span className="font-mono text-[12px]" style={{ color: 'var(--theme-accent)' }}>&gt;</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the desktop something, or /clear"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GlobalAgent;
