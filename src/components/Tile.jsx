import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useContextMenu } from "../hooks/useContextMenu.js";
import { ContextMenu } from "./ContextMenu.jsx";
import { CONTEXT_TYPES, MENU_ACTIONS } from "../utils/contextMenuStateMachine.js";
import eventBus, { TOPICS } from "../utils/eventBus.js";
import { TileContent } from "../features/tiles/content/index.jsx";
import { useMotion } from "../hooks/useMotion.js";
import { useTileFeed } from "../features/tiles/useTileFeed.js";
import { AttentionRing, TileProgress, StatusDot } from "../features/tiles/motionKit.jsx";

const SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

/**
 * A tile on the start screen.
 *
 * This component owns the tile *frame* — size, color, press handling, the
 * context menu and edit mode. What the tile shows comes from the content
 * registry in features/tiles/content, keyed by app id.
 */
export const Tile = memo(function Tile({
  app,
  onOpen,
  onQuick,
  badge = 0,
  isEditMode = false,
  onUpdateSize,
  animatingBadge = false,
  focused = false,
  onFocusRequest,
}) {
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [longPressed, setLongPressed] = useState(false);
  const longPressTimeout = useRef(null);
  const tileRef = useRef(null);
  const motionSettings = useMotion();

  /*
   * The tile frame carries the parts of a live update that are the same
   * whatever the app is: how far along something is, whether it is healthy,
   * and whether it just asked for you. Faces stay free to render their own
   * content without each reimplementing a progress bar.
   */
  const feed = useTileFeed(app.id);
  const [attention, setAttention] = useState(false);
  useEffect(() => {
    if (feed.effect !== 'attention' || !feed.revision) return undefined;
    setAttention(true);
    const t = setTimeout(() => setAttention(false), 1400);
    return () => clearTimeout(t);
  }, [feed.revision, feed.effect]);
  const tiltEnabled = motionSettings.allows('tileHover');

  /*
   * Tilt toward the pointer. Two motion values track where the pointer is
   * inside the tile, normalized to -0.5..0.5, and everything else — the two
   * rotations and the gloss sweep — derives from them, so the effect stays a
   * single source of truth and costs one transform per frame.
   */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const springCfg = { stiffness: 260, damping: 22, mass: 0.5 };
  const sx = useSpring(px, springCfg);
  const sy = useSpring(py, springCfg);

  const MAX_TILT = 8; // degrees
  const rotateY = useTransform(sx, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]);

  // The gloss is a wide highlight that slides opposite the tilt, the way a
  // sheen moves across a card held up to a light.
  const glossX = useTransform(sx, [-0.5, 0.5], ['130%', '-30%']);
  const glossY = useTransform(sy, [-0.5, 0.5], ['120%', '-20%']);
  const glossOpacity = useTransform(
    [sx, sy],
    ([x, y]) => 0.18 + Math.min(0.28, (Math.abs(x) + Math.abs(y)) * 0.45)
  );

  const handlePointerMove = useCallback((e) => {
    if (!tiltEnabled) return;
    const el = tileRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }, [tiltEnabled, px, py]);

  const resetTilt = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  const {
    contextMenuState: tileContextMenu,
    handleContextMenu: handleTileContextMenu,
    handleCloseMenu: closeTileMenu,
    handleSelectItem: handleTileMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.TILE, { appId: app.id, appTitle: app.title });

  const handleTileAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.OPEN:
        onOpen(app, {});
        break;
      case MENU_ACTIONS.RESIZE_TILE:
        // Resize is handled by the desktop, which owns edit mode.
        eventBus.publish(TOPICS.TILE_LONG_PRESS, { appId: app.id });
        break;
      case MENU_ACTIONS.PIN:
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, { action: 'tilePin', appId: app.id });
        break;
      case MENU_ACTIONS.PROPERTIES:
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, { action: 'tileProperties', appId: app.id });
        break;
      case MENU_ACTIONS.UNINSTALL:
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, { action: 'tileUninstall', appId: app.id });
        break;
      default:
        break;
    }
  }, [app, onOpen]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    setLongPressed(false);
    longPressTimeout.current = setTimeout(() => {
      setLongPressed(true);
      eventBus.publish(TOPICS.TILE_LONG_PRESS, { appId: app.id });
    }, 800);
  }, [app.id]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  const handleSizeChange = useCallback((cols, rows) => {
    onUpdateSize(app.id, `col-span-${cols} row-span-${rows}`);
  }, [onUpdateSize, app.id]);

  const handleDone = useCallback(() => {
    eventBus.publish(TOPICS.TILE_EDIT_EXIT);
  }, []);

  const handleOpen = useCallback((e) => {
    if (longPressed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onOpen(app, {
      tilePosition: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    });
  }, [onOpen, app, longPressed]);

  return (
    <motion.div
      ref={tileRef}
      data-tile={app.id}
      onClick={handleOpen}
      onContextMenu={(e) => handleTileContextMenu(e)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => { setHovered(false); resetTilt(); }}
      onFocus={() => onFocusRequest?.()}
      whileHover={tiltEnabled ? { scale: 1.03, y: -2 } : undefined}
      animate={focused && tiltEnabled ? { scale: 1.04 } : { scale: 1 }}
      transition={motionSettings.spring('fast')}
      // Keyboard-reachable, and the selected tile is the only stop in the
      // tab order so Tab does not walk all 35 tiles.
      tabIndex={focused ? 0 : -1}
      role="button"
      aria-label={app.title}
      data-focused={focused ? 'true' : 'false'}
      style={{
        ...(tiltEnabled ? {
          rotateX,
          rotateY,
          transformPerspective: 700,
          transformStyle: 'preserve-3d',
        } : {}),
        // The focus ring sits outside the tile so it survives overflow-hidden.
        boxShadow: focused
          ? '0 0 0 2px var(--theme-background), 0 0 0 4px var(--theme-accent)'
          : undefined,
      }}
      className={`relative ${app.size} ${app.color} overflow-hidden p-3 flex flex-col text-left text-white cursor-pointer border border-black/20 outline-none`}
    >
      {/* Specular gloss that follows the tilt. */}
      {tiltEnabled && hovered && (
        <motion.span
          data-tile-gloss
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1/4 z-[1]"
          style={{
            x: glossX,
            y: glossY,
            opacity: glossOpacity,
            background:
              'radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,.12) 55%, rgba(255,255,255,0) 75%)',
          }}
        />
      )}

      {/* The original sweep, kept for the non-tilt path. */}
      {!tiltEnabled && (
        <motion.span
          data-tile-shine
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-1/3 w-1/3 bg-gradient-to-l from-white/0 via-white/40 to-white/0"
          initial={{ x: "120%" }}
          animate={{ x: hovered ? "-220%" : "120%" }}
          transition={motionSettings.spring('fast')}
        />
      )}

      {/*
        A light from the top edge. Flat colour fields read as paper; a single
        soft gradient gives the tile a face without turning it glossy, and it
        sits under the content so text keeps its contrast.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,.14), rgba(255,255,255,.03) 42%, rgba(0,0,0,.10))',
        }}
      />
      {/* An inner hairline stops adjacent tiles of the same colour merging. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.18)' }}
      />

      <AttentionRing active={attention} />

      {/*
        The state light lives on the frame, not in the faces, so a tile reports
        healthy / syncing / needs-you whether or not anyone wrote it a face.
      */}
      {feed.data?.status && (
        <span className="absolute top-2 right-2 z-[3]">
          <StatusDot status={feed.data.status} />
        </span>
      )}

      {/* Content sits above the tile face so the tilt reads as depth. */}
      <div
        className="relative z-[2] flex flex-col h-full"
        style={tiltEnabled ? { transform: 'translateZ(18px)' } : undefined}
      >
        <TileContent
          app={app}
          Icon={app.icon}
          badge={badge}
          hovered={hovered}
          badgePulse={animatingBadge}
          playing={playing}
          setPlaying={setPlaying}
          onQuick={onQuick}
        />
      </div>

      {isEditMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white text-xs font-semibold mb-1">Resize Tile</div>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((cols) =>
              [1, 2, 3].map((rows) => (
                <button
                  key={`${cols}x${rows}`}
                  onClick={() => handleSizeChange(cols, rows)}
                  className="px-2 py-1 bg-white/20 text-white text-[10px] hover:bg-white/30"
                >
                  {cols}x{rows}
                </button>
              ))
            )}
          </div>
          <button
            onClick={handleDone}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Done
          </button>
        </motion.div>
      )}

      <TileProgress value={feed.data?.progress ?? null} />

      <ContextMenu
        contextMenuState={tileContextMenu}
        onClose={closeTileMenu}
        onSelectItem={(item) => {
          handleTileMenuSelect(item);
          handleTileAction(item);
        }}
      />
    </motion.div>
  );
});
