/**
 * useWindowState Hook
 * 
 * Provides a clean interface for managing window state using the state machine.
 * Abstracts away complex state transitions and ensures only valid states are reached.
 */

import { useMemo } from 'react';
import {
  WINDOW_DISPLAY_STATE,
  WINDOW_SNAP_STATE,
  displayEnumToState,
  snapEnumToState,
  resolveAction,
  isWindowVisible,
  isWindowMaximized,
  getWindowStateDescription
} from '../utils/windowStateMachine.js';

/**
 * Hook to manage window state using state machine
 * 
 * @param {object} win - Window object { m, sn, ... }
 * @returns {object} Window state info and helper methods
 */
export function useWindowState(win) {
  // Derive current state from window object
  const displayState = displayEnumToState(win.m);
  const snapState = snapEnumToState(win.sn);

  // Computed properties
  const isVisible = isWindowVisible(displayState);
  const isMaximized = isWindowMaximized(snapState);
  const isMinimized = displayState === WINDOW_DISPLAY_STATE.MINIMIZED;
  const isClosed = displayState === WINDOW_DISPLAY_STATE.CLOSED;
  
  const stateDescription = getWindowStateDescription(displayState, snapState);

  // Create a method to resolve what action should be taken
  const resolveUserAction = useMemo(() => {
    return (userAction) => {
      return resolveAction(displayState, snapState, userAction);
    };
  }, [displayState, snapState]);

  return {
    // Current state
    displayState,
    snapState,
    
    // Flags
    isVisible,
    isMaximized,
    isMinimized,
    isClosed,
    
    // Description
    stateDescription,
    
    // Action resolver
    resolveUserAction,
    
    // Quick checks
    canMinimize: () => displayState === WINDOW_DISPLAY_STATE.VISIBLE,
    canRestore: () => displayState === WINDOW_DISPLAY_STATE.MINIMIZED,
    canMaximize: () => displayState === WINDOW_DISPLAY_STATE.VISIBLE || displayState === WINDOW_DISPLAY_STATE.MINIMIZED,
    canUnmaximize: () => displayState === WINDOW_DISPLAY_STATE.VISIBLE && snapState === WINDOW_SNAP_STATE.FULL,
    canClose: () => displayState !== WINDOW_DISPLAY_STATE.CLOSED,
    canSnap: () => displayState === WINDOW_DISPLAY_STATE.VISIBLE || displayState === WINDOW_DISPLAY_STATE.MINIMIZED,
  };
}
