import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, CornerDownLeft } from 'lucide-react';
import { useMotion } from '../../hooks/useMotion.js';

/**
 * The in-app console.
 *
 * Every app gets one, opened with `~`. It is a chat transcript rather than a
 * shell: you type a request in plain words or a slash command, and the app
 * answers. Apps supply a handler that knows their own data; anything the
 * handler does not recognise falls through to a shared set of commands.
 *
 * The point is not to emulate a terminal. It is to give every app one text
 * surface that can explain itself and act on what it is showing.
 */

let idCounter = 0;
const nextId = () => `msg-${++idCounter}`;

/** Commands every app answers, so the console is never empty-handed. */
function baseCommands({ appTitle, suggestions }) {
  return {
    help: () => ({
      text:
        `${appTitle} console. Type a request in plain words, or use a command:\n` +
        `  /help      this list\n` +
        `  /clear     clear the transcript\n` +
        `  /about     what this app is for\n` +
        (suggestions?.length ? `\nTry: ${suggestions.map((s) => `"${s}"`).join(', ')}` : ''),
    }),
    about: () => ({
      text:
        `${appTitle} is one of the demo apps in this desktop. It runs entirely in ` +
        `the browser with no backend, so everything here is local sample data ` +
        `meant to show the app's shape rather than real records.`,
    }),
  };
}

export function AppConsole({
  appId,
  appTitle,
  intro,
  suggestions = [],
  handler,
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const motionSettings = useMotion();

  /*
   * `~` opens the console. The listener is scoped to this app's frame so two
   * open windows do not both react, and it stands down while the caret is in
   * a field — otherwise a tilde could never be typed.
   */
  // `open` is read through a ref so the listener is attached once and never
  // sees a stale value — re-attaching on every toggle was dropping Escape.
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const el = e.target;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

      if (e.key === '~' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
        return;
      }
      if (e.key === 'Escape' && openRef.current) {
        // Stop here so the desktop keymap does not also act on this Escape.
        e.stopPropagation();
        setOpen(false);
      }
    };

    const frame = document.querySelector(`[data-app-frame="${appId}"]`);
    const target = frame || window;
    target.addEventListener('keydown', onKeyDown);
    return () => target.removeEventListener('keydown', onKeyDown);
  }, [appId]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      if (messages.length === 0) {
        setMessages([{
          id: nextId(),
          from: 'app',
          text: intro || `${appTitle} console. Ask a question, or type /help.`,
        }]);
      }
    }
  }, [open, intro, appTitle, messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const say = useCallback((from, text) => {
    setMessages((prev) => [...prev, { id: nextId(), from, text }]);
  }, []);

  const submit = useCallback(async (raw) => {
    const value = raw.trim();
    if (!value || busy) return;

    say('user', value);
    setInput('');

    const commands = baseCommands({ appTitle, suggestions });

    if (value === '/clear') {
      setMessages([]);
      return;
    }
    if (value.startsWith('/')) {
      const name = value.slice(1).split(/\s+/)[0];
      if (commands[name]) {
        say('app', commands[name]().text);
        return;
      }
    }

    setBusy(true);
    try {
      // The app's own handler gets first refusal.
      const reply = handler ? await handler(value, { appId }) : null;
      if (reply) {
        say('app', typeof reply === 'string' ? reply : reply.text);
      } else if (value.startsWith('/')) {
        say('app', `Unknown command "${value.split(/\s+/)[0]}". Type /help for what this app understands.`);
      } else {
        say('app', commands.help().text);
      }
    } catch (err) {
      say('app', `That failed: ${err?.message || 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  }, [busy, say, handler, appId, appTitle, suggestions]);

  return (
    <>
      {/* Resting hint, so the console is discoverable rather than a secret. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 text-[10px] border-t w-full text-left transition-colors"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-surface-alt)',
            color: 'var(--theme-text-muted)',
            transitionDuration: 'var(--motion-fast)',
          }}
          title="Open the app console"
        >
          <TerminalIcon size={11} />
          <span>
            Press <kbd className="font-mono font-semibold">~</kbd> to ask {appTitle} something
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="console"
            data-app-console={appId}
            className="shrink-0 flex flex-col border-t overflow-hidden"
            style={{ borderColor: 'var(--theme-accent)', backgroundColor: 'var(--theme-surface-alt)' }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionSettings.tween('fast')}
          >
            <div
              className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <TerminalIcon size={12} style={{ color: 'var(--theme-accent)' }} />
              <span className="text-[11px] font-semibold">{appTitle} console</span>
              <span className="text-[10px] ml-auto" style={{ color: 'var(--theme-text-muted)' }}>
                Esc to close
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close console" className="p-0.5">
                <X size={12} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2">
                  <span
                    className="text-[10px] font-mono shrink-0 pt-0.5 w-10 text-right"
                    style={{ color: m.from === 'user' ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
                  >
                    {m.from === 'user' ? 'you' : 'app'}
                  </span>
                  <pre
                    className="text-[12px] whitespace-pre-wrap break-words font-sans m-0 leading-relaxed"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {m.text}
                  </pre>
                </div>
              ))}
              {busy && (
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono w-10 text-right" style={{ color: 'var(--theme-text-muted)' }}>app</span>
                  <span className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>thinking…</span>
                </div>
              )}
            </div>

            {suggestions.length > 0 && messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="px-2 py-1 text-[11px] border"
                    style={{
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-muted)',
                      borderRadius: 'var(--theme-radius-sm)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); submit(input); }}
              className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <span className="font-mono text-[12px]" style={{ color: 'var(--theme-accent)' }}>&gt;</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${appTitle} something, or /help`}
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: 'var(--theme-text)' }}
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" aria-label="Send" disabled={!input.trim() || busy} className="disabled:opacity-40">
                <CornerDownLeft size={13} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AppConsole;
