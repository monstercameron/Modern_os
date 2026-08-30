/**
 * Keymap Service
 *
 * One keydown listener for the whole desktop. Bindings are data, registered by
 * feature modules and resolved against a scope stack so an open overlay can
 * shadow desktop bindings without every component growing its own listener.
 *
 * Chords are written as "$mod+shift+1". "$mod" is the window-manager modifier,
 * configurable because Windows intercepts Meta+digit before the page sees it —
 * Alt is the default that actually reaches a browser tab.
 */

export const MOD_CHOICES = {
  alt: { token: 'alt', label: 'Alt' },
  meta: { token: 'meta', label: 'Super' },
  control: { token: 'control', label: 'Ctrl' },
  'control+alt': { token: 'control+alt', label: 'Ctrl+Alt' },
};

/** Scopes, highest priority first. A binding only fires in an active scope. */
export const SCOPES = {
  MODAL: 'modal',
  LAUNCHER: 'launcher',
  DESKTOP: 'desktop',
};

const SCOPE_ORDER = [SCOPES.MODAL, SCOPES.LAUNCHER, SCOPES.DESKTOP];

/** Normalize a key name so "Escape"/"esc"/"ESC" all match. */
function normalizeKey(key) {
  if (!key) return '';
  const k = String(key).toLowerCase();
  const aliases = {
    esc: 'escape',
    del: 'delete',
    ins: 'insert',
    return: 'enter',
    space: ' ',
    spacebar: ' ',
    arrowup: 'up',
    arrowdown: 'down',
    arrowleft: 'left',
    arrowright: 'right',
  };
  return aliases[k] || k;
}

/**
 * Parse "ctrl+shift+escape" into a canonical descriptor.
 * Modifier order in the source string does not matter.
 */
export function parseChord(chord, mod = 'alt') {
  const parts = String(chord).toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const descriptor = { ctrl: false, alt: false, shift: false, meta: false, key: '' };

  for (const part of parts) {
    if (part === '$mod') {
      for (const m of mod.split('+')) applyModifier(descriptor, m);
      continue;
    }
    if (['ctrl', 'control', 'alt', 'shift', 'meta', 'super', 'cmd'].includes(part)) {
      applyModifier(descriptor, part);
      continue;
    }
    descriptor.key = normalizeKey(part);
  }

  return descriptor;
}

function applyModifier(descriptor, name) {
  switch (name) {
    case 'ctrl':
    case 'control': descriptor.ctrl = true; break;
    case 'alt': descriptor.alt = true; break;
    case 'shift': descriptor.shift = true; break;
    case 'meta':
    case 'super':
    case 'cmd': descriptor.meta = true; break;
    default: break;
  }
}

/** Stable string form of a descriptor, used as the lookup key. */
export function descriptorId(d) {
  return [
    d.ctrl ? 'ctrl' : '',
    d.alt ? 'alt' : '',
    d.shift ? 'shift' : '',
    d.meta ? 'meta' : '',
    d.key,
  ].filter(Boolean).join('+');
}

/** Describe a live KeyboardEvent in the same terms as a parsed chord. */
export function eventDescriptor(event) {
  const key = normalizeKey(event.key);
  // Digits are read from event.code so Shift+1 stays "1" rather than "!".
  const codeDigit = /^Digit(\d)$/.exec(event.code || '');
  return {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    key: codeDigit ? codeDigit[1] : key,
  };
}

export function createKeymap({ mod = 'alt' } = {}) {
  /** @type {Map<string, Array<{chord: string, scope: string, handler: Function, description: string, owner: string}>>} */
  let bindings = new Map();
  let currentMod = mod;
  const activeScopes = new Set([SCOPES.DESKTOP]);
  const tapListeners = new Set();

  let attached = false;
  let modDownAlone = false;

  const rebuildKey = (chord) => descriptorId(parseChord(chord, currentMod));

  /**
   * Register a binding.
   * @returns {Function} unregister
   */
  function bind(chord, handler, { scope = SCOPES.DESKTOP, description = '', owner = '' } = {}) {
    const id = rebuildKey(chord);
    const entry = { chord, scope, handler, description, owner };
    const list = bindings.get(id) || [];

    if (import.meta?.env?.DEV) {
      const clash = list.find((b) => b.scope === scope);
      if (clash) {
        console.warn(
          `[keymap] "${chord}" is already bound in scope "${scope}" by ${clash.owner || 'unknown'}; ` +
          `${owner || 'a new binding'} will take precedence.`
        );
      }
    }

    bindings.set(id, [entry, ...list]);
    return () => {
      const remaining = (bindings.get(id) || []).filter((b) => b !== entry);
      if (remaining.length) bindings.set(id, remaining);
      else bindings.delete(id);
    };
  }

  /** Register many at once: [[chord, handler, opts], ...] */
  function bindAll(list) {
    const offs = list.map(([chord, handler, opts]) => bind(chord, handler, opts));
    return () => offs.forEach((off) => off());
  }

  function pushScope(scope) {
    activeScopes.add(scope);
    return () => activeScopes.delete(scope);
  }

  function popScope(scope) {
    activeScopes.delete(scope);
  }

  /** Pick the binding from the highest-priority active scope. */
  function resolve(id) {
    const candidates = bindings.get(id);
    if (!candidates || candidates.length === 0) return null;
    for (const scope of SCOPE_ORDER) {
      if (!activeScopes.has(scope)) continue;
      const hit = candidates.find((b) => b.scope === scope);
      if (hit) return hit;
    }
    return null;
  }

  /** Notify listeners when the modifier is pressed and released on its own. */
  function onModTap(listener) {
    tapListeners.add(listener);
    return () => tapListeners.delete(listener);
  }

  const isModKey = (event) => {
    const primary = currentMod.split('+')[0];
    if (primary === 'alt') return event.key === 'Alt';
    if (primary === 'meta') return event.key === 'Meta';
    if (primary === 'control') return event.key === 'Control';
    return false;
  };

  /** Typing in a field should never trigger desktop bindings. */
  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable === true
    );
  }

  function handleKeyDown(event) {
    if (isModKey(event)) {
      modDownAlone = true;
      return;
    }
    modDownAlone = false;

    const descriptor = eventDescriptor(event);
    const hasModifier = descriptor.ctrl || descriptor.alt || descriptor.meta;
    if (!hasModifier && isTypingTarget(event.target)) return;

    const binding = resolve(descriptorId(descriptor));
    if (!binding) return;

    // A plain-key binding (Escape) still yields to a focused text field.
    if (!hasModifier && isTypingTarget(event.target)) return;

    event.preventDefault();
    binding.handler(event);
  }

  function handleKeyUp(event) {
    if (isModKey(event) && modDownAlone) {
      modDownAlone = false;
      for (const listener of [...tapListeners]) listener(event);
    }
  }

  function handleBlur() {
    modDownAlone = false;
  }

  function attach(target = window) {
    if (attached) return () => {};
    attached = true;
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    target.addEventListener('blur', handleBlur);
    return () => {
      attached = false;
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      target.removeEventListener('blur', handleBlur);
    };
  }

  /** Swap the WM modifier; existing bindings are re-keyed against the new one. */
  function setMod(nextMod) {
    if (!MOD_CHOICES[nextMod] || nextMod === currentMod) return;
    const entries = [];
    for (const list of bindings.values()) entries.push(...list);
    currentMod = nextMod;
    bindings = new Map();
    for (const e of entries) {
      const id = rebuildKey(e.chord);
      bindings.set(id, [e, ...(bindings.get(id) || [])]);
    }
  }

  const getMod = () => currentMod;

  /** Everything currently bound — for a shortcuts UI. */
  function list() {
    const out = [];
    for (const [id, entries] of bindings) {
      for (const e of entries) out.push({ id, ...e });
    }
    return out;
  }

  return {
    bind, bindAll, pushScope, popScope, attach,
    setMod, getMod, onModTap, list,
    SCOPES,
  };
}

/** The desktop's keymap. */
export const keymap = createKeymap({ mod: 'alt' });

export default keymap;
