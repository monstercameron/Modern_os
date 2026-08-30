/**
 * Keymap Service
 *
 * One keydown listener for the whole desktop. Bindings are data, registered by
 * feature modules and resolved against a scope stack so an open overlay can
 * shadow desktop bindings without every component growing its own listener.
 *
 * Chords are written as "$mod+1". "$mod" is the window-manager modifier,
 * configurable because a browser tab cannot use Super: Windows intercepts
 * Meta+digit before the page sees it. The default is Ctrl+Shift.
 */

export const MOD_CHOICES = {
  'control+shift': { token: 'control+shift', label: 'Ctrl+Shift' },
  alt: { token: 'alt', label: 'Alt' },
  'control+alt': { token: 'control+alt', label: 'Ctrl+Alt' },
  control: { token: 'control', label: 'Ctrl' },
  meta: { token: 'meta', label: 'Super' },
};

/**
 * Chords the browser or OS takes before the page sees them. Binding these is
 * not an error — the handler simply never runs — so the keymap warns instead
 * of failing, and the desktop's own bindings avoid the list entirely.
 *
 * Meta+digit is here because Windows binds it to taskbar activation, which is
 * why Super is not the default window-manager modifier.
 */
export const RESERVED_CHORDS = new Set([
  // Chrome / Edge window and tab management
  'ctrl+shift+n', 'ctrl+shift+t', 'ctrl+shift+w', 'ctrl+shift+q',
  'ctrl+shift+p', 'ctrl+shift+o', 'ctrl+shift+b', 'ctrl+shift+d',
  'ctrl+shift+m', 'ctrl+shift+a', 'ctrl+shift+e',
  // Developer tools
  'ctrl+shift+i', 'ctrl+shift+j', 'ctrl+shift+c',
  // Reload and clear browsing data
  'ctrl+shift+r', 'ctrl+shift+delete',
  // Tab cycling
  'ctrl+shift+tab',
]);

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
    period: '.',
    comma: ',',
    slash: '/',
    backslash: '\\',
    backquote: '`',
    minus: '-',
    equal: '=',
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

/**
 * Physical keys whose event.key changes when Shift is held. Because the
 * window-manager modifier includes Shift, these have to be read from
 * event.code or "Ctrl+Shift+1" would arrive as "!" and "Ctrl+Shift+." as ">".
 */
const CODE_KEYS = {
  Period: '.',
  Comma: ',',
  Slash: '/',
  Backslash: '\\',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
};

/** Describe a live KeyboardEvent in the same terms as a parsed chord. */
export function eventDescriptor(event) {
  const code = event.code || '';
  const digit = /^Digit(\d)$/.exec(code);
  const letter = /^Key([A-Z])$/.exec(code);

  let key;
  if (digit) key = digit[1];
  else if (letter) key = letter[1].toLowerCase();
  else if (CODE_KEYS[code]) key = CODE_KEYS[code];
  else key = normalizeKey(event.key);

  return {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    key,
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
      if (RESERVED_CHORDS.has(id)) {
        console.warn(
          `[keymap] "${chord}" resolves to "${id}", which the browser handles ` +
          `before the page sees it. This binding will not fire.`
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

  /**
   * Only a single-key modifier has a meaningful "tap on its own" gesture.
   * With a compound modifier like Ctrl+Shift there is no unambiguous tap, so
   * the launcher is reached through its explicit chord instead.
   */
  const isModKey = (event) => {
    const parts = currentMod.split('+');
    if (parts.length !== 1) return false;
    if (parts[0] === 'alt') return event.key === 'Alt';
    if (parts[0] === 'meta') return event.key === 'Meta';
    if (parts[0] === 'control') return event.key === 'Control';
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
    const typing = isTypingTarget(event.target);

    const binding = resolve(descriptorId(descriptor));
    if (!binding) return;

    /*
     * While the caret is in a text field, the field wins. Ctrl+Shift+V, the
     * arrow keys and friends belong to whoever is typing, not to the window
     * manager. Three exceptions get through: Escape, so an overlay can always
     * be dismissed; anything holding Alt, which no text field claims; and
     * bindings a modal registered for itself — a modal owns the keyboard while
     * it is up, including its own close chord, which is otherwise unreachable
     * once its input takes focus.
     */
    const modalOwned = binding.scope === SCOPES.MODAL;
    if (typing && !modalOwned && descriptor.key !== 'escape' && !descriptor.alt) return;

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
export const keymap = createKeymap({ mod: 'control+shift' });

export default keymap;
