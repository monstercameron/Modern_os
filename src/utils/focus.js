/**
 * Focus helpers.
 *
 * One definition of "what can the Tab key reach", used by the window manager to
 * keep Tab inside the focused window and by overlays to hand focus to something
 * sensible when they open.
 */

/** Everything the browser will stop on, minus the things it should not. */
export const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * The focusable elements inside a root, in tab order.
 *
 * Hidden elements are dropped: a zero-sized button is one the user cannot see,
 * and stopping on it reads as the focus ring vanishing for a keypress.
 */
export function focusablesIn(root) {
  if (!root) return [];
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => {
    if (el.hasAttribute('inert') || el.closest('[inert]')) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
  });
}

/**
 * Keep Tab inside `root`, wrapping at both ends.
 *
 * Returns true when the event was handled, so the caller can preventDefault.
 * Call this only for the container that currently owns the keyboard — trapping
 * an unfocused one would make Tab jump backwards into it.
 */
export function wrapTab(root, event) {
  if (event.key !== 'Tab') return false;
  const items = focusablesIn(root);
  if (items.length === 0) return false;

  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;

  // Focus sitting on the container itself: Tab moves to either end.
  if (active === root) {
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (!root.contains(active)) return false;

  if (!event.shiftKey && active === last) { first.focus(); return true; }
  if (event.shiftKey && active === first) { last.focus(); return true; }
  return false;
}
