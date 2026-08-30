/**
 * Window state machine.
 *
 * A window's state is two independent things, and keeping them separate is what
 * makes the rules simple:
 *
 *   placement   TILED | FLOATING     where its rectangle comes from
 *   display     NORMAL | MINIMIZED | FULLSCREEN    whether and how it is shown
 *
 * A tiled window's rectangle is the layout's to decide; a floating one owns its
 * own. Minimized and fullscreen are display modes that temporarily suspend the
 * placement rule without forgetting it, so leaving either returns the window to
 * where it belongs.
 *
 * Every transition below is total: for any (placement, display, action) pair it
 * either names the next state or says why not. Nothing else in the kernel is
 * allowed to invent a window state.
 */

/*
 * The two snap values the display axis cares about. Everything else `sn` can
 * hold — the halves and quadrants — belongs to snapping, which is a separate
 * concern from whether a window is fullscreen.
 */
const FULLSCREEN_SNAP = 'FULL';
const NO_SNAP = 'NONE';

export const PLACEMENT = {
  TILED: 'tiled',
  FLOATING: 'floating',
};

export const DISPLAY = {
  NORMAL: 'normal',
  MINIMIZED: 'minimized',
  FULLSCREEN: 'fullscreen',
};

export const ACTION = {
  MINIMIZE: 'minimize',
  RESTORE: 'restore',
  FULLSCREEN: 'fullscreen',
  LEAVE_FULLSCREEN: 'leaveFullscreen',
  TOGGLE_FULLSCREEN: 'toggleFullscreen',
  FLOAT: 'float',
  TILE: 'tile',
  TOGGLE_PLACEMENT: 'togglePlacement',
  SNAP: 'snap',
  MOVE: 'move',
  RESIZE: 'resize',
  RESIZE_TILE: 'resizeTile',
};

/** Read the machine's view of a stored window object. */
export function readState(win) {
  return {
    placement: win.floating ? PLACEMENT.FLOATING : PLACEMENT.TILED,
    display: win.m
      ? DISPLAY.MINIMIZED
      : (win.sn === FULLSCREEN_SNAP ? DISPLAY.FULLSCREEN : DISPLAY.NORMAL),
  };
}


/**
 * Resolve an action against a state.
 *
 * @returns {{ok: true, placement: string, display: string, reason?: string}
 *          |{ok: false, reason: string}}
 */
export function transition({ placement, display }, action) {
  const stay = (over = {}) => ({ ok: true, placement, display, ...over });
  const no = (reason) => ({ ok: false, reason });

  switch (action) {
    case ACTION.MINIMIZE:
      if (display === DISPLAY.MINIMIZED) return no('already minimized');
      // Fullscreen collapses to minimized; the window remembers it was tiled or
      // floating, so restoring puts it back in the right world.
      return stay({ display: DISPLAY.MINIMIZED });

    case ACTION.RESTORE:
      if (display !== DISPLAY.MINIMIZED) return no('not minimized');
      return stay({ display: DISPLAY.NORMAL });

    case ACTION.FULLSCREEN:
      if (display === DISPLAY.FULLSCREEN) return no('already fullscreen');
      return stay({ display: DISPLAY.FULLSCREEN });

    case ACTION.LEAVE_FULLSCREEN:
      if (display !== DISPLAY.FULLSCREEN) return no('not fullscreen');
      return stay({ display: DISPLAY.NORMAL });

    case ACTION.TOGGLE_FULLSCREEN:
      return stay({
        display: display === DISPLAY.FULLSCREEN ? DISPLAY.NORMAL : DISPLAY.FULLSCREEN,
      });

    case ACTION.FLOAT:
      if (placement === PLACEMENT.FLOATING) return no('already floating');
      // Floating a minimized window shows it: otherwise the change would be
      // invisible and the window would feel lost.
      return stay({ placement: PLACEMENT.FLOATING, display: DISPLAY.NORMAL });

    case ACTION.TILE:
      if (placement === PLACEMENT.TILED) return no('already tiled');
      return stay({ placement: PLACEMENT.TILED, display: DISPLAY.NORMAL });

    case ACTION.TOGGLE_PLACEMENT:
      return stay({
        placement: placement === PLACEMENT.FLOATING ? PLACEMENT.TILED : PLACEMENT.FLOATING,
        display: DISPLAY.NORMAL,
      });

    // Hand gestures always produce a visible, floating window: you cannot drag
    // or snap something that the layout is positioning for you.
    case ACTION.SNAP:
    case ACTION.MOVE:
      return stay({ placement: PLACEMENT.FLOATING, display: DISPLAY.NORMAL });

    case ACTION.RESIZE:
      if (display === DISPLAY.MINIMIZED) return no('cannot resize a minimized window');
      if (placement === PLACEMENT.TILED) return no('the layout owns a tiled window\'s size');
      return stay();

    /*
     * The mirror of RESIZE. A tiled window cannot take bounds of its own, but
     * the layout holding it can be asked to give it more or less room, which
     * is a different thing and legal in exactly the opposite cases.
     */
    case ACTION.RESIZE_TILE:
      if (placement === PLACEMENT.FLOATING) return no('a floating window carries its own bounds');
      if (display === DISPLAY.MINIMIZED) return no('cannot resize a minimized window');
      if (display === DISPLAY.FULLSCREEN) return no('leave fullscreen before resizing the pane');
      return stay();

    default:
      return no(`unknown action "${action}"`);
  }
}

/** Apply a resolved state back onto a window object's fields. */
/**
 * Apply a resolved state back onto a window object.
 *
 * This is the whole canonical representation, not part of it. It used to write
 * only `floating` and `m`, so the machine could resolve to FULLSCREEN and the
 * stored window would not say so — and the reducer's maximize branches set the
 * snap field by hand instead, which is two places deciding the same thing. The
 * machine decides; `prevSN` carries what the window was snapped to so leaving
 * fullscreen puts it back.
 */
export function applyState(win, { placement, display }) {
  const wasFullscreen = win.sn === FULLSCREEN_SNAP;
  let sn = win.sn;

  if (display === DISPLAY.FULLSCREEN && !wasFullscreen) sn = FULLSCREEN_SNAP;
  if (display !== DISPLAY.FULLSCREEN && wasFullscreen) {
    sn = win.prevSN === FULLSCREEN_SNAP ? NO_SNAP : (win.prevSN ?? NO_SNAP);
  }

  return {
    ...win,
    floating: placement === PLACEMENT.FLOATING,
    m: display === DISPLAY.MINIMIZED,
    sn,
  };
}

/**
 * Whether the layout should be giving this window a rectangle right now.
 *
 * A fullscreen window is still tiled, but the layout does not place it — it
 * covers the workspace — so it drops out of the tree until it comes back.
 */
export const participatesInLayout = (win) => {
  const { placement, display } = readState(win);
  return placement === PLACEMENT.TILED && display === DISPLAY.NORMAL;
};

/** A short human description, used by Task Manager and the agent. */
export function describe(win) {
  const { placement, display } = readState(win);
  if (display === DISPLAY.MINIMIZED) return `minimized (${placement})`;
  if (display === DISPLAY.FULLSCREEN) return 'fullscreen';
  return placement;
}
