# Context Menu - Implementation Examples

## Example 1: Basic Window Context Menu

This shows how the window context menu was implemented in `Win.jsx`:

```jsx
import { useContextMenu } from '../hooks/useContextMenu.js';
import { ContextMenu } from './ContextMenu.jsx';
import { CONTEXT_TYPES, MENU_ACTIONS } from '../utils/contextMenuStateMachine.js';

export const Win = memo(function Win({ win, on, children, active, setActive, app }) {
  // Initialize context menu with metadata
  const {
    contextMenuState: windowContextMenu,
    handleContextMenu: handleWindowContextMenu,
    handleCloseMenu: closeWindowMenu,
    handleSelectItem: handleWindowMenuSelect,
    updateMetadata: updateWindowMenuMetadata,
  } = useContextMenu(CONTEXT_TYPES.WINDOW, { 
    windowId: win.id,
    isMinimized: win.m,
    isMaximized: win.sn === SN.FULL,
  });

  // Handle actions from menu
  const handleWindowAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.MINIMIZE:
        on('min');
        break;
      case MENU_ACTIONS.MAXIMIZE:
        on(win.sn === SN.FULL ? 'unmax' : 'max');
        break;
      case MENU_ACTIONS.SNAP_LEFT:
        on('snap', SN.LEFT);
        break;
      case MENU_ACTIONS.CLOSE:
        on('close');
        break;
      // ... more actions
    }
  }, [win, on]);

  // Update metadata when window state changes
  useEffect(() => {
    updateWindowMenuMetadata({
      isMinimized: win.m,
      isMaximized: win.sn === SN.FULL,
    });
  }, [win.m, win.sn, updateWindowMenuMetadata]);

  return (
    <motion.div>
      {/* Titlebar with context menu trigger */}
      <div 
        className="absolute top-0 right-0 z-10 flex items-center"
        onContextMenu={(e) => handleWindowContextMenu(e)}
      >
        {/* Window controls */}
      </div>

      {/* Window content */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>

      {/* Context menu */}
      <ContextMenu
        contextMenuState={windowContextMenu}
        onClose={closeWindowMenu}
        onSelectItem={(item) => {
          handleWindowMenuSelect(item);
          handleWindowAction(item);
        }}
      />
    </motion.div>
  );
});
```

## Example 2: Tile with Dynamic Actions

Shows how tiles use context menus to trigger app-specific actions:

```jsx
export const Tile = memo(function Tile({ app, onOpen, onQuick, badge, isEditMode, onUpdateSize }) {
  // Initialize tile context menu
  const {
    contextMenuState: tileContextMenu,
    handleContextMenu: handleTileContextMenu,
    handleCloseMenu: closeTileMenu,
    handleSelectItem: handleTileMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.TILE, { 
    appId: app.id, 
    appTitle: app.title 
  });

  // Handle tile actions
  const handleTileAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.OPEN:
        onOpen(app, {});
        break;
      
      case MENU_ACTIONS.PIN:
        // Pin this app to start/favorites
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
          action: 'tilePin',
          appId: app.id,
        });
        break;
      
      case MENU_ACTIONS.RESIZE_TILE:
        // Enable tile resize mode
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
          action: 'tileResize',
          appId: app.id,
        });
        break;
      
      case MENU_ACTIONS.PROPERTIES:
        // Show app properties dialog
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
          action: 'tileProperties',
          appId: app.id,
        });
        break;
    }
  }, [app, onOpen]);

  return (
    <motion.div
      onClick={handleOpen}
      onContextMenu={(e) => handleTileContextMenu(e)}
      className={`relative ${app.size} overflow-hidden shadow-md`}
    >
      {/* Tile content */}
      
      {/* Context menu */}
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
```

## Example 3: Taskbar with Multiple Contexts

Shows how taskbar manages separate context menus for background and items:

```jsx
export const Taskbar = memo(function Taskbar({ windows, activeId, clock }) {
  // Context menu for taskbar background
  const {
    contextMenuState: taskbarContextMenu,
    handleContextMenu: handleTaskbarContextMenu,
    handleCloseMenu: closeTaskbarMenu,
    handleSelectItem: handleTaskbarMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.TASKBAR);

  // Context menu for taskbar items
  const {
    contextMenuState: taskbarItemContextMenu,
    handleContextMenu: handleTaskbarItemContextMenu,
    handleCloseMenu: closeTaskbarItemMenu,
    handleSelectItem: handleTaskbarItemMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.TASKBAR_ITEM);

  // Handle taskbar menu actions
  const handleTaskbarAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.CLOSE_ALL:
        windows.forEach(w => {
          eventBus.publish(TOPICS.TASKBAR_WINDOW_ACTION, { 
            winId: w.id, 
            action: 'close' 
          });
        });
        break;
      
      case MENU_ACTIONS.SETTINGS:
        eventBus.publish(TOPICS.APP_LAUNCH, { appId: 'settings' });
        break;
    }
  }, [windows]);

  // Handle taskbar item menu actions
  const handleTaskbarItemAction = useCallback((item) => {
    const metadata = taskbarItemContextMenu.metadata;
    switch (item.action) {
      case MENU_ACTIONS.MINIMIZE:
        eventBus.publish(TOPICS.TASKBAR_WINDOW_ACTION, { 
          winId: metadata.winId, 
          action: 'min' 
        });
        break;
      
      case MENU_ACTIONS.CLOSE:
        eventBus.publish(TOPICS.TASKBAR_WINDOW_ACTION, { 
          winId: metadata.winId, 
          action: 'close' 
        });
        break;
    }
  }, [taskbarItemContextMenu.metadata]);

  return (
    <>
      {/* Taskbar with background context menu */}
      <div 
        className="absolute top-0 left-0 right-0 h-10 px-3 border-b"
        onContextMenu={(e) => handleTaskbarContextMenu(e)}
      >
        <div className="flex items-center gap-1">
          {windows.map(w => (
            // Window button with item context menu
            <button
              key={w.id}
              onContextMenu={(e) => handleTaskbarItemContextMenu(e, { 
                winId: w.id, 
                isMinimized: w.m 
              })}
            >
              {w.t}
            </button>
          ))}
        </div>
      </div>

      {/* Taskbar background context menu */}
      <ContextMenu
        contextMenuState={taskbarContextMenu}
        onClose={closeTaskbarMenu}
        onSelectItem={(item) => {
          handleTaskbarMenuSelect(item);
          handleTaskbarAction(item);
        }}
      />

      {/* Taskbar item context menu */}
      <ContextMenu
        contextMenuState={taskbarItemContextMenu}
        onClose={closeTaskbarItemMenu}
        onSelectItem={(item) => {
          handleTaskbarItemMenuSelect(item);
          handleTaskbarItemAction(item);
        }}
      />
    </>
  );
});
```

## Example 4: Conditional Menu Items

Shows how to use conditions to show/hide menu items based on state:

```javascript
// In contextMenuStateMachine.js
[CONTEXT_TYPES.WINDOW]: [
  { 
    id: 'minimize', 
    label: 'Minimize', 
    action: MENU_ACTIONS.MINIMIZE, 
    icon: '−',
    condition: 'notMinimized'  // Only show if window is not minimized
  },
  { 
    id: 'maximize', 
    label: 'Maximize', 
    action: MENU_ACTIONS.MAXIMIZE, 
    icon: '□',
    condition: 'notMaximized'  // Only show if window is not maximized
  },
  { 
    id: 'restore', 
    label: 'Restore', 
    action: MENU_ACTIONS.RESTORE, 
    icon: '🔻',
    condition: 'maximized'  // Only show if window is maximized
  },
  // ... more items
];

// The hook automatically filters based on metadata conditions:
updateWindowMenuMetadata({
  isMinimized: false,      // affects 'notMinimized' condition
  isMaximized: true,       // affects 'notMaximized' and 'maximized' conditions
  isFullscreen: false
});
```

## Example 5: Publishing Events to Other Subscribers

Shows how context menu actions can trigger system-wide events:

```javascript
// Component listening to context menu actions
useEffect(() => {
  const handleContextMenuAction = (data) => {
    console.log('Context menu action:', data);
    // {
    //   action: 'tilePin',
    //   contextType: 'tile',
    //   metadata: { appId: 'email', appTitle: 'Mail' },
    //   itemId: 'pin'
    // }
    
    if (data.action === 'tilePin') {
      // Handle pin action
      pinAppToFavorites(data.metadata.appId);
    }
  };

  const unsubscribe = eventBus.subscribe(
    TOPICS.CONTEXT_MENU_ACTION, 
    handleContextMenuAction
  );

  return unsubscribe;
}, []);
```

## Example 6: Dynamic Menu Items

How to update menu items based on app state:

```javascript
// In a component
useEffect(() => {
  // Subscribe to context menu events
  const unsubscribe = eventBus.subscribe(
    TOPICS.CONTEXT_MENU_OPEN,
    (data) => {
      if (data.contextType === CONTEXT_TYPES.WINDOW) {
        // Can modify metadata here to affect menu rendering
        // e.g., fetch window capabilities and update metadata
        
        const windowId = data.metadata.windowId;
        const window = findWindowById(windowId);
        
        // Update context menu metadata
        updateWindowMenuMetadata({
          isMinimized: window.minimized,
          isMaximized: window.maximized,
          supportsSnap: true,
          supportsResize: !window.maximized,
        });
      }
    }
  );

  return unsubscribe;
}, []);
```

## Example 7: Desktop Context Menu

Shows the desktop background context menu implementation:

```jsx
export const DesktopGrid = memo(function DesktopGrid({ apps, onOpen }) {
  // Initialize desktop context menu
  const {
    contextMenuState: desktopContextMenu,
    handleContextMenu: handleDesktopContextMenu,
    handleCloseMenu: closeDesktopMenu,
    handleSelectItem: handleDesktopMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.DESKTOP);

  // Handle desktop actions
  const handleDesktopAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.REFRESH:
        // Refresh desktop view
        window.location.reload();
        break;
      
      case MENU_ACTIONS.SETTINGS:
        // Open settings app
        eventBus.publish(TOPICS.APP_LAUNCH, { appId: 'settings' });
        break;
      
      case MENU_ACTIONS.NEW_FOLDER:
        // Create new folder
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
          action: 'desktopNewFolder',
        });
        break;
    }
  }, []);

  return (
    <div 
      className="absolute inset-x-0 top-10 bottom-0 p-4 overflow-y-auto grid"
      onContextMenu={(e) => handleDesktopContextMenu(e)}
    >
      {/* Grid of tiles */}
      {apps.map(app => (
        <Tile key={app.id} app={app} onOpen={onOpen} />
      ))}

      {/* Desktop context menu */}
      <ContextMenu
        contextMenuState={desktopContextMenu}
        onClose={closeDesktopMenu}
        onSelectItem={(item) => {
          handleDesktopMenuSelect(item);
          handleDesktopAction(item);
        }}
      />
    </div>
  );
});
```

## Example 8: Testing Context Menu Behavior

Unit test example:

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Win } from './Win.jsx';

describe('Window Context Menu', () => {
  it('should show context menu on right-click', async () => {
    const { container } = render(
      <Win win={mockWindow} on={mockOn} active={true} />
    );
    
    const titleBar = container.querySelector('[role="titlebar"]');
    
    // Right-click on titlebar
    await userEvent.pointer({ keys: '[MouseRight]', target: titleBar });
    
    // Menu should appear
    expect(screen.getByText('Minimize')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should close menu when clicking outside', async () => {
    const { container } = render(
      <Win win={mockWindow} on={mockOn} active={true} />
    );
    
    // Open menu
    await userEvent.pointer({ 
      keys: '[MouseRight]', 
      target: container.querySelector('[role="titlebar"]') 
    });
    
    // Click outside
    await userEvent.click(document.body);
    
    // Menu should disappear
    expect(screen.queryByText('Minimize')).not.toBeInTheDocument();
  });

  it('should trigger action when menu item clicked', async () => {
    const mockOn = jest.fn();
    
    const { container } = render(
      <Win win={mockWindow} on={mockOn} active={true} />
    );
    
    // Right-click to open menu
    await userEvent.pointer({ 
      keys: '[MouseRight]', 
      target: container.querySelector('[role="titlebar"]') 
    });
    
    // Click minimize option
    await userEvent.click(screen.getByText('Minimize'));
    
    // Should call action
    expect(mockOn).toHaveBeenCalledWith('min');
  });
});
```

## Example 9: Keyboard Navigation

How keyboard navigation works:

```javascript
// User interactions in context menu:
// 1. Right-click → Menu opens
// 2. Arrow Down → Moves to next item
// 3. Arrow Down → Moves to next item
// 4. Arrow Up → Moves back to previous item
// 5. Enter → Selects current item
// 6. Escape → Closes menu

// All handled by ContextMenu component and useContextMenu hook
// No additional code needed in your component
```

## Example 10: Custom Context with Metadata

Creating a new custom context with rich metadata:

```javascript
// 1. Add to CONTEXT_TYPES
export const CONTEXT_TYPES = {
  // ... existing types
  CUSTOM_WIDGET: 'custom-widget',
};

// 2. Add menu items
[CONTEXT_TYPES.CUSTOM_WIDGET]: [
  { 
    id: 'edit', 
    label: 'Edit', 
    action: MENU_ACTIONS.EDIT, 
    icon: '✎' 
  },
  { 
    id: 'delete', 
    label: 'Delete', 
    action: MENU_ACTIONS.DELETE, 
    icon: '🗑️',
    condition: 'notProtected'  // Can't delete if protected
  },
];

// 3. Use in component
const { contextMenuState, handleContextMenu } = useContextMenu(
  CONTEXT_TYPES.CUSTOM_WIDGET,
  {
    widgetId: widget.id,
    isProtected: widget.protected,
    owner: widget.owner
  }
);

// 4. Use in JSX
<div onContextMenu={(e) => handleContextMenu(e)}>
  {/* widget content */}
</div>
```

These examples demonstrate the flexibility and power of the context menu state machine system. Each context can be customized independently while sharing the same underlying infrastructure.
