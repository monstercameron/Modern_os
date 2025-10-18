# Window State Machine - Implementation Guide

## Overview

The window state machine provides a clean, declarative way to manage complex window states and transitions. Instead of scattered conditional logic throughout the codebase, all state transitions are defined in one place, making the code more maintainable and easier to reason about.

## Architecture

### Two-Dimensional State Model

Windows have two independent but related state dimensions:

#### 1. Display State (Visibility)
Controls whether the window is visible to the user:
- `VISIBLE` - Window is shown on screen
- `MINIMIZED` - Window is hidden to taskbar
- `CLOSED` - Window has been closed

#### 2. Snap State (Positioning/Sizing)
Controls how the window is positioned and sized:
- `NONE` - Normal windowed state
- `FULL` - Maximized to full screen
- `LEFT` - Snapped to left half
- `RIGHT` - Snapped to right half
- `TOP` - Snapped to top half
- `BOTTOM` - Snapped to bottom half
- `QUAD` - Snapped to quadrant

### State Transition Rules

The state machine defines which transitions are allowed:

```
Display State Transitions:
VISIBLE → MINIMIZED (minimize action)
VISIBLE → CLOSED (close action)
MINIMIZED → VISIBLE (restore/unminimize action)
MINIMIZED → CLOSED (close action)
CLOSED → (no transitions allowed)

Snap State Transitions:
NONE → FULL (maximize)
NONE → LEFT/RIGHT/TOP/BOTTOM (snap)
FULL → NONE (unmaximize)
FULL → LEFT/RIGHT/TOP/BOTTOM (snap to different side)
LEFT/RIGHT/TOP/BOTTOM → any other snap state
QUAD → any snap state
```

## Files

### `src/utils/windowStateMachine.js`
Core state machine definition and utilities:
- `WINDOW_DISPLAY_STATE` - Display state constants
- `WINDOW_SNAP_STATE` - Snap state constants
- `getNextDisplayState(current, action)` - Calculate next display state
- `getNextSnapState(current, action)` - Calculate next snap state
- `resolveAction()` - Resolve complex user actions into state changes
- `isWindowVisible()`, `isWindowMaximized()` - State queries
- `getWindowStateDescription()` - Human-readable state names

### `src/hooks/useWindowState.js`
React hook for component usage:
- Derives current state from window object
- Provides state flags: `isVisible`, `isMaximized`, `isMinimized`, etc.
- Provides state checks: `canMinimize()`, `canMaximize()`, etc.
- Handles state machine lookups transparently

## Usage Examples

### Example 1: Taskbar Preview Button Logic

**Before (Complex Conditionals):**
```jsx
<button onClick={() => {
  if (win.m) {
    handleWindowAction(win.id, 'unmin');
  } else if (win.id === activeId) {
    handleWindowAction(win.id, 'min');
  } else {
    handleWindowAction(win.id, 'activate');
  }
}}>
  {win.m ? 'Restore' : win.id === activeId ? 'Minimize' : 'Activate'}
</button>
```

**After (State Machine):**
```jsx
const windowState = useWindowState(win);

<button onClick={() => {
  if (windowState.isMinimized) {
    onActivate();
  } else if (win.id === activeId) {
    onMinimize();
  } else {
    onActivate();
  }
}}>
  {windowState.isMinimized ? 'Restore' : win.id === activeId ? 'Minimize' : 'Activate'}
</button>
```

### Example 2: Maximize Button with Smart Minimize Handling

```jsx
const windowState = useWindowState(win);

const handleMaximize = () => {
  if (windowState.isMinimized) {
    // Smart: if minimized, restore first then maximize
    handleWindowAction(win.id, 'unmin');
    setTimeout(() => {
      handleWindowAction(win.id, 'max');
    }, 0);
  } else {
    // Normal: toggle between max and unmax
    handleWindowAction(win.id, windowState.isMaximized ? 'unmax' : 'max');
  }
};
```

### Example 3: Checking if Action is Allowed

```jsx
const windowState = useWindowState(win);

if (windowState.canMinimize()) {
  // Only show minimize button if window can be minimized
  <button onClick={() => on('min')}>Minimize</button>
}

if (windowState.canMaximize()) {
  // Can maximize from both VISIBLE and MINIMIZED states
  <button onClick={() => on('max')}>Maximize</button>
}
```

## Benefits

1. **Clarity** - State logic is centralized and easy to understand
2. **Maintainability** - Changes to state logic are in one place
3. **Safety** - Invalid transitions are impossible by design
4. **Testability** - State machine can be tested independently
5. **Extensibility** - New states or transitions are easy to add
6. **Debugging** - `getWindowStateDescription()` provides human-readable state info

## Common Patterns

### Pattern 1: State-Based Rendering
```jsx
const windowState = useWindowState(win);

return (
  <>
    <button 
      disabled={!windowState.canMinimize()}
      onClick={() => on('min')}
    >
      Minimize
    </button>
    {windowState.isMaximized && (
      <div>Window is maximized!</div>
    )}
  </>
);
```

### Pattern 2: State-Based Actions
```jsx
const windowState = useWindowState(win);

if (windowState.isMinimized && action === 'maximize') {
  // Do two-step action: restore + maximize
  act(id, 'unmin');
  setTimeout(() => act(id, 'max'), 0);
} else if (windowState.isVisible && action === 'maximize') {
  // Simple action
  act(id, 'max');
}
```

### Pattern 3: Action Resolution
```jsx
const windowState = useWindowState(win);
const resolved = windowState.resolveUserAction('toggle_maximize');

if (resolved.valid) {
  if (resolved.displayAction) {
    act(id, resolved.displayAction);
  }
  if (resolved.snapAction) {
    act(id, resolved.snapAction);
  }
} else {
  console.error('Invalid action:', resolved.reason);
}
```

## Migration Guide

### Updating Components

1. Import the hook:
   ```jsx
   import { useWindowState } from '../hooks/useWindowState.js';
   ```

2. Call the hook:
   ```jsx
   const windowState = useWindowState(win);
   ```

3. Replace conditionals:
   ```jsx
   // Before
   if (win.m) { ... }
   if (win.sn === SN.FULL) { ... }
   
   // After
   if (windowState.isMinimized) { ... }
   if (windowState.isMaximized) { ... }
   ```

### Adding New States

1. Add to `WINDOW_DISPLAY_STATE` or `WINDOW_SNAP_STATE` in `windowStateMachine.js`
2. Update transition tables in the state machine
3. Update `snapEnumToState()` and `snapStateToEnum()` mapping functions
4. Tests will catch any missing transitions

## Future Enhancements

- Add state change history for debugging
- Add state change listeners/callbacks
- Add animation triggers based on state transitions
- Add state validation/integrity checks
- Integrate with Redux/Zustand for global state management

