import { useState, useCallback, useEffect } from 'react';
import {
  createContextMenuState,
  transitionState,
  CONTEXT_MENU_STATES,
  CONTEXT_TYPES,
  MENU_ACTIONS,
} from '../utils/contextMenuStateMachine.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';
import { info, debug } from '../utils/errorHandler.js';

/**
 * Custom hook for managing context menu state and interactions
 * 
 * Usage:
 *   const {
 *     contextMenuState,
 *     handleContextMenu,
 *     handleCloseMenu,
 *     handleSelectItem,
 *   } = useContextMenu(CONTEXT_TYPES.WINDOW, { windowId: 'w1' });
 */
export function useContextMenu(contextType = CONTEXT_TYPES.DESKTOP, initialMetadata = {}) {
  const [contextMenuState, setContextMenuState] = useState(() =>
    createContextMenuState(contextType, initialMetadata)
  );

  /**
   * Handle right-click events to open context menu
   * @param {MouseEvent} event - Right-click event
   * @param {Object} metadata - Additional metadata for the context
   */
  const handleContextMenu = useCallback((event, metadata = {}) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenuState((prevState) => {
      const updatedMetadata = { ...prevState.metadata, ...metadata };

      const newState = transitionState(prevState, 'SHOW', {
        x: event.clientX,
        y: event.clientY,
      });

      newState.metadata = updatedMetadata;

      // Publish event for other subscribers
      eventBus.publish(TOPICS.CONTEXT_MENU_OPEN, {
        contextType,
        x: event.clientX,
        y: event.clientY,
        metadata: updatedMetadata,
      });

      info(`Context menu opened (${contextType}) at (${event.clientX}, ${event.clientY})`, 'useContextMenu');

      return newState;
    });
  }, [contextType]);

  /**
   * Close the context menu
   */
  const handleCloseMenu = useCallback(() => {
    setContextMenuState((prevState) => {
      const newState = transitionState(prevState, 'CLOSE');

      // Publish close event
      eventBus.publish(TOPICS.CONTEXT_MENU_CLOSE, {
        contextType,
      });

      debug(`Context menu closed (${contextType})`, 'useContextMenu');

      return newState;
    });
  }, [contextType]);

  /**
   * Handle menu item selection
   * @param {Object} item - Menu item object with action
   */
  const handleSelectItem = useCallback((item) => {
    if (item.type === 'separator') return;

    info(`Context menu item selected: ${item.label} (${item.action})`, 'useContextMenu');

    setContextMenuState((prevState) => {
      // Publish action event
      eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
        action: item.action,
        contextType,
        metadata: prevState.metadata,
        itemId: item.id,
      });

      // Close menu after action
      return transitionState(prevState, 'CLOSE');
    });
  }, [contextType]);

  /**
   * Navigate to next item (arrow down)
   */
  const selectNextItem = useCallback(() => {
    setContextMenuState((prevState) => transitionState(prevState, 'SELECT_NEXT'));
  }, []);

  /**
   * Navigate to previous item (arrow up)
   */
  const selectPreviousItem = useCallback(() => {
    setContextMenuState((prevState) => transitionState(prevState, 'SELECT_PREV'));
  }, []);

  /**
   * Update context metadata without changing visibility
   */
  const updateMetadata = useCallback((newMetadata) => {
    setContextMenuState((prevState) => transitionState(prevState, 'UPDATE_METADATA', newMetadata));
  }, []);

  /**
   * Subscribe to global close events (clicking outside)
   */
  useEffect(() => {
    const handleGlobalContextMenu = (e) => {
      // If right-clicking outside the current menu context, close it
      setContextMenuState((prevState) => {
        if (prevState.state === CONTEXT_MENU_STATES.VISIBLE) {
          const menuElement = document.querySelector('[role="menu"]');
          if (menuElement && !menuElement.contains(e.target)) {
            // Check if the click is on a valid context menu trigger
            const isContextTrigger = e.target.closest('[data-context-menu-trigger]');
            if (!isContextTrigger) {
              return transitionState(prevState, 'CLOSE');
            }
          }
        }
        return prevState;
      });
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  /**
   * Close menu when pressing Escape globally
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setContextMenuState((prevState) => {
          if (prevState.state === CONTEXT_MENU_STATES.VISIBLE) {
            return transitionState(prevState, 'CLOSE');
          }
          return prevState;
        });
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return {
    // State
    contextMenuState,
    isMenuVisible: contextMenuState.state === CONTEXT_MENU_STATES.VISIBLE,

    // Actions
    handleContextMenu,
    handleCloseMenu,
    handleSelectItem,
    selectNextItem,
    selectPreviousItem,
    updateMetadata,
  };
}

export default useContextMenu;
