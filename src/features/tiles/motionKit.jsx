import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';

/**
 * The live-tile animation vocabulary.
 *
 * Five ways for a tile to say "this changed": flip, slide, roll, peek and
 * attention. Each is a component that takes the new value and works out the
 * transition itself, so a tile face asks for a shape of movement rather than
 * hand-writing keyframes.
 *
 * Every one of them checks the motion settings first, and the engine is strict:
 * `allows('tileContent')` is already false at the `reduced` level, so only
 * `full` animates. At `reduced` and `none` the new value simply appears, which
 * is the existing rule that decorative tile movement is the first thing to go.
 * The `rich` flag below is the second gate, for the cases where a theme keeps
 * tile content on but has asked for plainer movement.
 *
 * Routing every tile animation through here is what makes that one decision
 * instead of thirty separate motion.div calls that each forgot to check.
 */

/** Shared read of the motion settings for tile content. */
function useTileMotion() {
  const m = useMotion();
  return {
    m,
    /** Full movement: rotation, travel, overshoot. */
    rich: m.allows('tileContent') && !m.plain,
    /** Any change animation at all. */
    any: m.allows('tileContent') && !m.disabled,
  };
}

/**
 * Flip.
 *
 * The face turns on its X axis and the new content is already there when it
 * comes back. Used where the update replaces what was on the tile — a new
 * headline, a different photo.
 */
export function Flip({ trigger, children, className = '' }) {
  const { m, rich, any } = useTileMotion();
  if (!any) return <div className={className}>{children}</div>;

  return (
    <div className={className} style={{ perspective: 600 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={trigger}
          initial={rich ? { rotateX: -78, opacity: 0 } : { opacity: 0 }}
          animate={rich ? { rotateX: 0, opacity: 1 } : { opacity: 1 }}
          exit={rich ? { rotateX: 62, opacity: 0 } : { opacity: 0 }}
          transition={m.spring('normal')}
          style={rich ? { transformOrigin: 'center bottom', backfaceVisibility: 'hidden' } : undefined}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Slide.
 *
 * The new line comes up from underneath and pushes the old one out the top,
 * the way a feed of messages reads. Used where the update is another item in a
 * sequence rather than a replacement.
 */
export function Slide({ trigger, children, className = '' }) {
  const { m, rich, any } = useTileMotion();
  if (!any) return <div className={className}>{children}</div>;

  return (
    <div className={`${className} relative overflow-hidden`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={trigger}
          initial={rich ? { y: '110%', opacity: 0 } : { opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={rich ? { y: '-110%', opacity: 0 } : { opacity: 0 }}
          transition={m.spring('normal')}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Roll.
 *
 * A number that counts to its new value instead of cutting to it, digit strip
 * style: the old figure rolls out the way the value moved and the new one
 * rolls in behind it. Direction carries meaning — up is up.
 */
export function Roll({ value, className = '', style }) {
  const { m, rich, any } = useTileMotion();
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => { previous.current = value; }, [value]);

  if (!any) return <span className={className} style={style}>{value}</span>;

  return (
    <span className={`${className} relative inline-grid overflow-hidden tabular-nums`} style={style}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="col-start-1 row-start-1"
          initial={rich ? { y: direction * 22, opacity: 0 } : { opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={rich ? { y: direction * -22, opacity: 0 } : { opacity: 0 }}
          transition={m.spring('fast')}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Peek.
 *
 * The content lifts a few pixels and settles, as though something arrived
 * underneath it. The quietest of the five — for updates that should register
 * without asking to be looked at.
 */
export function Peek({ trigger, children, className = '' }) {
  const { m, rich, any } = useTileMotion();
  if (!any) return <div className={className}>{children}</div>;

  return (
    <motion.div
      key={trigger}
      className={className}
      initial={rich ? { y: 6, opacity: 0.4 } : { opacity: 0.4 }}
      animate={{ y: 0, opacity: 1 }}
      transition={m.spring('fast')}
    >
      {children}
    </motion.div>
  );
}

/**
 * Attention.
 *
 * A ring that pulses out from the tile edge, twice, then stops. Reserved for
 * updates that genuinely want you: a missed call, a threshold crossed. It is
 * deliberately hard to trigger — a desktop where everything pulses has no way
 * left to say "this one matters".
 */
export function AttentionRing({ active }) {
  const { m, any } = useTileMotion();
  if (!active || !any) return null;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ border: '2px solid var(--theme-accent)' }}
      initial={{ opacity: 0.9, scale: 1 }}
      animate={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: Math.max(0.35, m.duration.slow / 1000), repeat: 1, ease: 'easeOut' }}
    />
  );
}

/**
 * A text line that scrolls itself when it does not fit.
 *
 * Headlines are the one place a tile carries more text than it has room for,
 * and truncating them loses the half that says what happened.
 */
export function Marquee({ children, className = '' }) {
  const { rich } = useTileMotion();
  const holder = useRef(null);
  const inner = useRef(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const h = holder.current;
    const i = inner.current;
    if (!h || !i) return;
    setOverflow(Math.max(0, i.scrollWidth - h.clientWidth));
  }, [children]);

  if (!rich || overflow <= 0) {
    return <div ref={holder} className={`${className} truncate`}><span ref={inner}>{children}</span></div>;
  }

  return (
    <div ref={holder} className={`${className} overflow-hidden whitespace-nowrap`}>
      <motion.span
        ref={inner}
        className="inline-block"
        animate={{ x: [0, -overflow, -overflow, 0] }}
        transition={{
          duration: Math.max(4, overflow / 22),
          times: [0, 0.45, 0.75, 1],
          repeat: Infinity,
          repeatDelay: 2.5,
          ease: 'linear',
        }}
      >
        {children}
      </motion.span>
    </div>
  );
}

/** Small state light: live, syncing, unread, alert, ok. */
const STATUS_TONE = {
  live: 'var(--theme-success, #22c55e)',
  ok: 'var(--theme-success, #22c55e)',
  sync: 'var(--theme-accent)',
  unread: 'var(--theme-accent)',
  alert: 'var(--theme-danger, #f43f5e)',
};

export function StatusDot({ status }) {
  const { any } = useTileMotion();
  if (!status || !STATUS_TONE[status]) return null;
  const colour = STATUS_TONE[status];
  const breathes = any && (status === 'live' || status === 'sync' || status === 'alert');

  return (
    <motion.span
      aria-hidden
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: colour, boxShadow: `0 0 6px ${colour}` }}
      animate={breathes ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
      transition={breathes
        ? { duration: status === 'alert' ? 0.9 : 2.2, repeat: Infinity, ease: 'easeInOut' }
        : undefined}
    />
  );
}

/** A progress line along the bottom edge of a tile. */
export function TileProgress({ value }) {
  const { m, any } = useTileMotion();
  if (value == null) return null;
  return (
    <span aria-hidden className="absolute left-0 right-0 bottom-0 h-[3px] bg-black/25">
      <motion.span
        className="block h-full"
        style={{ backgroundColor: 'rgba(255,255,255,.85)' }}
        initial={false}
        animate={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
        transition={any ? m.tween('slow') : { duration: 0 }}
      />
    </span>
  );
}
