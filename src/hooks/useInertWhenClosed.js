import { useEffect } from 'react';

/**
 * Take an overlay out of the tab order while it is closed.
 *
 * An overlay animating out is still in the document, and everything inside it
 * is still focusable: with the start screen shut, Tab reached its search field
 * and the tiles underneath the windows. The exit is short in a healthy tab and
 * indefinite in a throttled one, so this does not wait for it — `inert` goes on
 * the moment the overlay is no longer open, which also blocks stray clicks and
 * hides it from assistive tech.
 *
 * @param {{current: HTMLElement|null}} ref - the overlay's root
 * @param {boolean} open
 */
export function useInertWhenClosed(ref, open) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [ref, open]);
}

export default useInertWhenClosed;
