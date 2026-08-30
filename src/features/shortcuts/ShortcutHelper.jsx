import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import keymap, { MOD_CHOICES } from '../../services/keymap.js';
import { useMotion } from '../../hooks/useMotion.js';

/**
 * The hold-to-remember cheatsheet.
 *
 * Hold the window-manager modifier on its own for a moment and the bindings
 * appear; press anything or let go and they leave. It reads the live keymap
 * rather than a written-down copy, so it cannot drift from what the desktop
 * actually does.
 */

/** Turn "ctrl+shift+1" into the pieces of a key cap row. */
function chordParts(id) {
  return id.split('+').map((part) => {
    const map = {
      ctrl: 'Ctrl', shift: 'Shift', alt: 'Alt', meta: 'Super',
      escape: 'Esc', up: '↑', down: '↓', left: '←', right: '→', ' ': 'Space',
    };
    return map[part] || part.toUpperCase();
  });
}

/**
 * Bindings that only differ by a digit collapse into one row, so the sheet
 * shows "1–5" rather than five near-identical lines.
 */
function groupBindings(list) {
  const groups = new Map();

  for (const b of list) {
    if (!b.description) continue;
    // Resize mode has its own on-screen bar; listing its eight bindings here
    // would bury the ones you press to get into it.
    if (b.owner === 'resize') continue;
    const digit = /(\d)$/.exec(b.id);
    const key = digit
      ? `${b.id.slice(0, -1)}#|${b.description.replace(/\d+/, '#')}`
      : b.id;

    if (!groups.has(key)) {
      groups.set(key, {
        id: digit ? `${b.id.slice(0, -1)}1–5` : b.id,
        description: digit ? b.description.replace(/\s*\d+$/, ' 1–5') : b.description,
        digits: digit ? [Number(digit[1])] : null,
      });
    } else if (digit) {
      groups.get(key).digits.push(Number(digit[1]));
    }
  }

  return [...groups.values()];
}

const SECTIONS = [
  { title: 'Workspaces', match: (d) => /workspace/i.test(d) },
  { title: 'Windows', match: (d) => /window|maximize|tiling|snap|unhide|resize/i.test(d) },
  { title: 'Desktop', match: () => true },
];

export function ShortcutHelper() {
  const [showing, setShowing] = useState(false);
  const motionSettings = useMotion();

  useEffect(() => keymap.onModHold(setShowing), []);

  const sections = useMemo(() => {
    if (!showing) return [];
    const grouped = groupBindings(keymap.list());
    const used = new Set();
    return SECTIONS.map((section) => {
      const items = grouped.filter((b) => !used.has(b) && section.match(b.description));
      items.forEach((b) => used.add(b));
      return { ...section, items };
    }).filter((s) => s.items.length > 0);
  }, [showing]);

  const modName = MOD_CHOICES[keymap.getMod()]?.label || keymap.getMod();

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          key="shortcut-helper"
          data-shortcut-helper
          className="absolute inset-0 z-[1900] grid place-items-center pointer-events-none"
          style={{ backgroundColor: 'var(--theme-overlay)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionSettings.tween('fast')}
        >
          <motion.div
            className="border overflow-hidden max-w-[min(760px,92vw)] max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-accent)',
              borderRadius: 'var(--theme-radius)',
              boxShadow: 'var(--theme-shadow)',
            }}
            initial={{ scale: 0.97, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8 }}
            transition={motionSettings.spring('fast')}
          >
            <div
              className="px-4 py-2.5 border-b flex items-baseline gap-3"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-surface-alt)' }}
            >
              <span className="text-[13px] font-semibold">Keyboard</span>
              <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                Holding {modName} · release to dismiss
              </span>
            </div>

            <div className="p-4 grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {sections.map((section) => (
                <div key={section.title}>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {section.title}
                  </div>
                  <div className="space-y-1.5">
                    {section.items.map((b) => (
                      <div key={b.id} className="flex items-baseline gap-3">
                        <span className="flex items-center gap-1 shrink-0">
                          {chordParts(b.id).map((part, i) => (
                            <React.Fragment key={`${b.id}-${i}`}>
                              {i > 0 && (
                                <span className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>+</span>
                              )}
                              <kbd
                                className="px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--theme-surface-alt)',
                                  color: 'var(--theme-text)',
                                  border: '1px solid var(--theme-border)',
                                  borderRadius: 'var(--theme-radius-sm)',
                                }}
                              >
                                {part}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </span>
                        <span className="text-[12px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
                          {b.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="px-4 py-2 border-t text-[11px]"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
            >
              <kbd className="font-mono font-semibold">~</kbd> opens the focused app&rsquo;s agent ·
              the desktop agent is an app you can tile like any other
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ShortcutHelper;
