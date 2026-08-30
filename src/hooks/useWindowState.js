/**
 * A window's state, read through the one machine that owns it.
 *
 * This used to sit on utils/windowStateMachine.js — a second, older machine
 * with its own display and snap enums, kept alive only by this hook while the
 * kernel had already moved to kernel/windowState.js. Two machines describing
 * the same window is two chances to disagree about it, so the old one is gone
 * and this derives from the same transition table the reducer runs.
 */

import { useMemo } from 'react';
import { readState, describe, DISPLAY, PLACEMENT } from '../kernel/windowState.js';

/**
 * @param {object} win - a stored window
 * @returns {{placement: string, display: string, isMaximized: boolean,
 *            isMinimized: boolean, isTiled: boolean, isVisible: boolean,
 *            stateDescription: string}}
 */
export function useWindowState(win) {
  return useMemo(() => {
    const { placement, display } = readState(win);
    return {
      placement,
      display,
      isMaximized: display === DISPLAY.FULLSCREEN,
      isMinimized: display === DISPLAY.MINIMIZED,
      isTiled: placement === PLACEMENT.TILED,
      isVisible: display !== DISPLAY.MINIMIZED,
      stateDescription: describe(win),
    };
  }, [win]);
}

export default useWindowState;
