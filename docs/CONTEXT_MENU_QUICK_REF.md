# Context Menu System - Quick Reference

## Files Created

### Core System
1. **`src/utils/contextMenuStateMachine.js`** (250+ lines)
   - Finite state machine implementation
   - Menu definitions for all contexts
   - Menu item filtering and validation
   - Position constraining utilities

2. **`src/components/ContextMenu.jsx`** (120+ lines)
   - React component for rendering menus
   - Keyboard navigation support
   - Click-outside detection
   - Smooth animations with Framer Motion

3. **`src/hooks/useContextMenu.js`** (180+ lines)
   - Custom React hook for state management
   - Right-click event handling
   - EventBus integration
   - Metadata management

### Documentation
4. **`docs/CONTEXT_MENU_GUIDE.md`**
   - Complete architecture documentation
   - Integration examples
   - API reference
   - Usage patterns

## Files Modified

1. **`src/utils/eventBus.js`**
   - Added context menu event topics:
     - `CONTEXT_MENU_OPEN`
     - `CONTEXT_MENU_CLOSE`
     - `CONTEXT_MENU_ACTION`

2. **`src/components/Taskbar.jsx`**
   - Integrated context menu for taskbar
   - Added context menu for taskbar items
   - Handles menu actions (Close All, Settings, etc)

3. **`src/components/Tile.jsx`**
   - Integrated context menu for tiles
   - Added tile-specific actions (Open, Pin, Properties, Uninstall)

4. **`src/components/Win.jsx`**
   - Integrated context menu for window titlebar
   - Dynamic menu items based on window state
   - Snap position options

5. **`src/components/DesktopGrid.jsx`**
   - Integrated context menu for desktop background
   - Added desktop actions (Refresh, New Folder, Settings)

## Context Types Supported

| Context | Trigger | Menu Items |
|---------|---------|-----------|
| **Desktop** | Right-click on empty space | Refresh, New Folder, Settings |
| **Taskbar** | Right-click on taskbar | Close All, Tile Windows, Cascade, Settings |
| **Taskbar Item** | Right-click on window button | Minimize, Maximize, Close |
| **Tile** | Right-click on app tile | Open, Pin, Resize, Properties, Uninstall |
| **Window** | Right-click on titlebar | Minimize, Maximize, Snap (Left/Right/Top/Bottom), Close |

## Key Features

✅ **State Machine Pattern**
- Clean, predictable state transitions
- IDLE → VISIBLE → HIDDEN → IDLE flow

✅ **Context-Aware**
- Different menus for each context
- Smart item filtering based on conditions
- Dynamic updates based on app state

✅ **User-Friendly**
- Smooth spring animations
- Keyboard navigation (arrows, Enter, Escape)
- Auto-positioning to stay on-screen
- Click-outside to close

✅ **Event-Driven**
- All actions published to eventBus
- Decoupled from component logic
- Extensible action system

✅ **Accessible**
- Keyboard support for navigation
- Clear visual feedback
- Proper semantic structure

## Usage Pattern

### Basic Integration (Template)

```javascript
import { useContextMenu } from '../hooks/useContextMenu.js';
import { ContextMenu } from './ContextMenu.jsx';
import { CONTEXT_TYPES, MENU_ACTIONS } from '../utils/contextMenuStateMachine.js';

export function MyComponent() {
  // 1. Initialize hook with context type
  const {
    contextMenuState,
    handleContextMenu,
    handleCloseMenu,
    handleSelectItem,
  } = useContextMenu(CONTEXT_TYPES.MY_CONTEXT);

  // 2. Define action handler
  const handleAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.MY_ACTION:
        // Handle action
        break;
    }
  }, []);

  // 3. Add event handler to element
  return (
    <>
      <element onContextMenu={(e) => handleContextMenu(e)}>
        Content
      </element>

      {/* 4. Render menu component */}
      <ContextMenu
        contextMenuState={contextMenuState}
        onClose={handleCloseMenu}
        onSelectItem={(item) => {
          handleSelectItem(item);
          handleAction(item);
        }}
      />
    </>
  );
}
```

## State Machine Diagram

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │
                    [right-click]
                         ↓
                    ┌──────────┐
            ┌───────→│ VISIBLE  │←───────┐
            │        └────┬─────┘        │
            │             │              │
    [Escape/close]   [select item]  [hover]
            │             ↓              │
            │        ┌──────────┐        │
            └────────│  HIDDEN  │────────┘
                     └────┬─────┘
                          │
                    [animation end]
                          ↓
                     ┌──────────┐
                     │   IDLE   │
                     └──────────┘
```

## Event Publishing

```javascript
// Menu opens
→ CONTEXT_MENU_OPEN
  { contextType, x, y, metadata }

// Item selected
→ CONTEXT_MENU_ACTION
  { action, contextType, metadata, itemId }

// Menu closes
→ CONTEXT_MENU_CLOSE
  { contextType }
```

## Adding New Context

1. Add to `CONTEXT_TYPES` in `contextMenuStateMachine.js`
2. Add menu items to `CONTEXT_MENU_DEFINITIONS`
3. Integrate into component using the template above
4. Add action handler to switch on menu actions

## Adding New Menu Actions

1. Add to `MENU_ACTIONS` in `contextMenuStateMachine.js`
2. Add menu item to appropriate context in `CONTEXT_MENU_DEFINITIONS`
3. Handle action in component's action handler
4. Optionally publish to eventBus for other subscribers

## Performance Notes

- **Memoized Components**: Prevent unnecessary re-renders
- **Event Delegation**: Efficient event listener cleanup
- **Conditional Rendering**: Only render visible menus
- **Spring Animations**: 60fps smooth animations
- **Zero Debounce Needed**: State machine handles rapid clicks

## Browser Support

- Modern browsers with ES6+ support
- Requires React 16.8+ (hooks)
- Requires Framer Motion
- Requires eventBus implementation

## Debugging

Access menu state:
```javascript
const { contextMenuState } = useContextMenu(CONTEXT_TYPES.WINDOW);
console.log(contextMenuState);
// {
//   state: 'VISIBLE',
//   contextType: 'window',
//   x: 150,
//   y: 200,
//   metadata: { windowId: 'w1' },
//   selectedItemIndex: 0,
//   timestamp: 1634567890000
// }
```

Listen to context menu events:
```javascript
import eventBus, { TOPICS } from '../utils/eventBus';

eventBus.subscribe(TOPICS.CONTEXT_MENU_ACTION, (data) => {
  console.log('Menu action:', data);
});
```

## Testing Checklist

- [ ] Right-click opens menu at cursor
- [ ] Menu stays within viewport
- [ ] Arrow keys navigate items
- [ ] Enter selects item
- [ ] Escape closes menu
- [ ] Click outside closes menu
- [ ] Selected item is highlighted
- [ ] Menu items trigger correct actions
- [ ] Actions are published to eventBus
- [ ] Animations are smooth
- [ ] State is cleaned up on unmount

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Menu appears off-screen | Check `constrainPosition()` in state machine |
| Clicks not registering | Verify `e.preventDefault()` in handler |
| Actions not firing | Check action switch case matches MENU_ACTIONS |
| Events not publishing | Ensure eventBus.publish() is called |
| Styling issues | Check CSS custom properties (--theme-*) |
| Menu won't close | Check `handleCloseMenu()` callback props |

## Future Roadmap

- [ ] Submenu support (nested menus)
- [ ] Keyboard shortcuts display
- [ ] Custom icon support (SVG)
- [ ] Item enable/disable conditions
- [ ] Search/filter functionality
- [ ] Recent actions list
- [ ] Drag & drop from menu
- [ ] Animation preferences (prefers-reduced-motion)
