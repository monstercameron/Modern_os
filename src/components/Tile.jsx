import React, { useState, memo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useContextMenu } from "../hooks/useContextMenu.js";
import { ContextMenu } from "./ContextMenu.jsx";
import { CONTEXT_TYPES, MENU_ACTIONS } from "../utils/contextMenuStateMachine.js";
import eventBus, { TOPICS } from "../utils/eventBus.js";
import { TileContent } from "../features/tiles/content/index.jsx";

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
}) {
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [longPressed, setLongPressed] = useState(false);
  const longPressTimeout = useRef(null);
  const tileRef = useRef(null);

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
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.03 }}
      transition={SPRING}
      className={`relative ${app.size} ${app.color} overflow-hidden shadow-md border border-black/20 p-3 flex flex-col text-left text-white cursor-pointer`}
    >
      <motion.span
        className="pointer-events-none absolute inset-y-0 -right-1/3 w-1/3 bg-gradient-to-l from-white/0 via-white/40 to-white/0"
        initial={{ x: "120%" }}
        animate={{ x: hovered ? "-220%" : "120%" }}
        transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
      />

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
