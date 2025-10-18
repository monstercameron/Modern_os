# Context Menu System Documentation

## Overview

A comprehensive right-click context menu system using a **finite state machine** to manage menu visibility, positioning, and behavior across different application contexts.

## Architecture

### Core Components

#### 1. **State Machine** (`utils/contextMenuStateMachine.js`)
Implements a finite state machine with three states:
- **IDLE**: No menu visible
- **VISIBLE**: Menu is being displayed
- **HIDDEN**: Menu was just hidden (for animations)

**Key Features:**
- Context-aware menu definitions for each context type
- Automatic menu item filtering based on conditions
- Screen boundary constraint checking
- Keyboard navigation support (arrow up/down)

**Supported Contexts:**
- `desktop` - Right-click on desktop background
- `taskbar` - Right-click on taskbar background
- `taskbar-item` - Right-click on taskbar window buttons
- `tile` - Right-click on app tiles
- `window` - Right-click on window titlebar

### 2. **ContextMenu Component** (`components/ContextMenu.jsx`)
Renders the visual context menu with:
- Smooth animations (spring physics)
- Keyboard navigation (arrow keys, Enter, Escape)
- Click-outside detection to close
- Hover-based selection
- Screen boundary constraints

**Features:**
- Zero-configuration rendering
- Automatic menu sizing
- Accessibility-friendly
- High z-index (9999) to stay on top

### 3. **useContextMenu Hook** (`hooks/useContextMenu.js`)
Custom React hook managing context menu state and interactions:
- Right-click event handling
- State transitions
- Event publishing to eventBus
- Metadata management
- Global keyboard shortcuts (Escape to close)

**Usage:**
```javascript
const {
  contextMenuState,
  isMenuVisible,
  handleContextMenu,
  handleCloseMenu,
  handleSelectItem,
  selectNextItem,
  selectPreviousItem,
  updateMetadata,
} = useContextMenu(CONTEXT_TYPES.WINDOW, { windowId: 'w1' });
```

## Integration Points

### Taskbar Context Menu
**File:** `components/Taskbar.jsx`

**Contexts:**
1. **Taskbar Background** - Right-click anywhere on taskbar
   - Close All Windows
   - Tile Windows Horizontally
   - Cascade Windows
   - Taskbar Settings

2. **Taskbar Items** (Window Buttons) - Right-click on window buttons
   - Minimize
   - Maximize
   - Close

**Implementation:**
```jsx
const { contextMenuState, handleContextMenu, handleSelectItem } = 
  useContextMenu(CONTEXT_TYPES.TASKBAR);

// In JSX:
<div onContextMenu={(e) => handleContextMenu(e)}>
  {/* taskbar content */}
</div>

<ContextMenu
  contextMenuState={contextMenuState}
  onClose={handleCloseMenu}
  onSelectItem={handleTaskbarAction}
/>
```

### Tile Context Menu
**File:** `components/Tile.jsx`

**Menu Items:**
- Open
- Pin to Start
- Resize Tile
- Properties
- Uninstall

**Implementation:**
```jsx
const { contextMenuState, handleContextMenu } = 
  useContextMenu(CONTEXT_TYPES.TILE, { appId: app.id });

// In JSX:
<motion.div onContextMenu={(e) => handleTileContextMenu(e)}>
  {/* tile content */}
</motion.div>
```

### Window Context Menu
**File:** `components/Win.jsx`

**Menu Items:**
- Minimize (shown when not minimized)
- Maximize (shown when not maximized)
- Restore (shown when maximized)
- Snap Left / Right / Top / Bottom
- Move
- Resize
- Close

**Smart Conditions:**
- Menu items appear/disappear based on window state
- Snap options always available
- State updates dynamically as window changes

**Implementation:**
```jsx
const { 
  contextMenuState, 
  handleContextMenu, 
  updateMetadata 
} = useContextMenu(CONTEXT_TYPES.WINDOW);

// Update metadata when window state changes:
useEffect(() => {
  updateMetadata({
    isMinimized: win.m,
    isMaximized: win.sn === SN.FULL,
  });
}, [win.m, win.sn]);
```

### Desktop Context Menu
**File:** `components/DesktopGrid.jsx`

**Menu Items:**
- Refresh
- New Folder
- Settings

**Implementation:**
```jsx
const { contextMenuState, handleContextMenu } = 
  useContextMenu(CONTEXT_TYPES.DESKTOP);

<div onContextMenu={(e) => handleDesktopContextMenu(e)}>
  {/* desktop grid */}
</div>
```

## State Machine Transitions

### Available Transitions

```
SHOW(x, y)        - Display menu at coordinates
HIDE              - Hide menu (for animations)
CLOSE             - Close menu completely
SELECT(index)     - Select menu item
SELECT_NEXT       - Navigate to next item (arrow down)
SELECT_PREV       - Navigate to previous item (arrow up)
UPDATE_METADATA   - Update contextual metadata
```

### Example Transition Flow

```
IDLE
  ↓ (right-click)
VISIBLE (menu appears with animation)
  ↓ (select item or click outside)
HIDDEN (fade out animation)
  ↓ (animation complete)
IDLE
```

## Event Publishing

The system publishes events to the eventBus for other subscribers:

```javascript
// When menu opens
eventBus.publish(TOPICS.CONTEXT_MENU_OPEN, {
  contextType: 'window',
  x: 100,
  y: 200,
  metadata: { windowId: 'w1' }
});

// When menu item is selected
eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
  action: 'minimize',
  contextType: 'window',
  metadata: { windowId: 'w1' }
});

// When menu closes
eventBus.publish(TOPICS.CONTEXT_MENU_CLOSE, {
  contextType: 'window'
});
```

## Menu Item Definitions

Each context has predefined menu items with:
- `id` - Unique identifier
- `label` - Display text
- `action` - Action to perform
- `icon` - Emoji or icon
- `type` - 'item' or 'separator'
- `condition` - Optional visibility condition

**Example:**
```javascript
{
  id: 'minimize',
  label: 'Minimize',
  action: MENU_ACTIONS.MINIMIZE,
  icon: '−',
  condition: 'notMinimized'  // only show if not minimized
}
```

## Keyboard Navigation

- **Arrow Up** - Select previous menu item
- **Arrow Down** - Select next menu item
- **Enter** - Activate selected item
- **Escape** - Close menu

## Styling

The context menu uses CSS custom properties for theming:
```css
--theme-surface      /* Menu background */
--theme-border       /* Menu border color */
--theme-text         /* Menu text color */
--theme-accent       /* Hover/selected color */
```

## Animation Configuration

Menus use Framer Motion with spring physics for smooth animations:

```javascript
initial={{ opacity: 0, scale: 0.95, y: -4 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: -4 }}
transition={{ 
  type: 'spring', 
  stiffness: 400, 
  damping: 30, 
  mass: 0.8 
}}
```

## Smart Positioning

The system automatically constrains menu position to stay within viewport:

```javascript
constrainPosition(x, y, width, height) {
  // Ensures menu doesn't go off-screen
  // Checks right, left, bottom, and top edges
  // Returns adjusted coordinates
}
```

## Adding New Context Menus

To add a context menu to a new component:

1. Import the hook and components:
```javascript
import { useContextMenu } from '../hooks/useContextMenu.js';
import { ContextMenu } from './ContextMenu.jsx';
import { CONTEXT_TYPES, MENU_ACTIONS } from '../utils/contextMenuStateMachine.js';
```

2. Initialize the hook:
```javascript
const { 
  contextMenuState, 
  handleContextMenu, 
  handleCloseMenu, 
  handleSelectItem 
} = useContextMenu(CONTEXT_TYPES.YOUR_CONTEXT, metadata);
```

3. Add context menu trigger to element:
```jsx
<element onContextMenu={(e) => handleContextMenu(e)}>
  Content
</element>
```

4. Add ContextMenu component to render:
```jsx
<ContextMenu
  contextMenuState={contextMenuState}
  onClose={handleCloseMenu}
  onSelectItem={yourActionHandler}
/>
```

5. Create action handler:
```javascript
const handleAction = useCallback((item) => {
  switch (item.action) {
    case MENU_ACTIONS.YOUR_ACTION:
      // Do something
      break;
  }
}, []);
```

## Adding Menu Items to a Context

Edit `contextMenuStateMachine.js` and add to `CONTEXT_MENU_DEFINITIONS`:

```javascript
[CONTEXT_TYPES.YOUR_CONTEXT]: [
  { 
    id: 'action1', 
    label: 'Action 1', 
    action: MENU_ACTIONS.ACTION1, 
    icon: '🔧' 
  },
  { id: 'sep-1', type: 'separator' },
  { 
    id: 'action2', 
    label: 'Action 2', 
    action: MENU_ACTIONS.ACTION2, 
    icon: '⚙️',
    condition: 'someCondition'
  },
],
```

## Error Handling

- Graceful fallback if unknown context type
- Safe metadata updates
- Proper cleanup on component unmount
- No console errors on missing metadata

## Performance

- Memoized components prevent unnecessary re-renders
- Efficient event listener cleanup
- Conditional rendering of menu items
- Uses spring animations for smooth 60fps experience

## Accessibility

- Keyboard navigation support
- Semantic HTML where applicable
- Clear visual feedback on selection
- Respects user preferences for motion (can be enhanced with `prefers-reduced-motion`)

## Future Enhancements

1. **Submenu Support** - Nested menus for complex actions
2. **Keyboard Shortcuts** - Display key bindings in menu items
3. **Dynamic Item Enabling** - Disable items based on app state
4. **Custom Icons** - SVG icons instead of emojis
5. **Drag & Drop from Menu** - Drag items to desktop/folders
6. **Search/Filter** - Filter menu items by typing
7. **Recent Actions** - Remember and show recent selections
8. **Conflict Resolution** - Handle multiple menus from event bubbling
