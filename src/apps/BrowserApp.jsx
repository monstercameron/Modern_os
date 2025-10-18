import React, { useState, useCallback } from "react";
import { Globe } from "lucide-react";
import { useContextMenu } from "../hooks/useContextMenu.js";
import { ContextMenu } from "../components/ContextMenu.jsx";
import { CONTEXT_TYPES, MENU_ACTIONS } from "../utils/contextMenuStateMachine.js";
import eventBus, { TOPICS } from "../utils/eventBus.js";

export function BrowserApp({ init = {} }) {
  const [url, setUrl] = useState(init.url ?? "https://example.lan");
  
  // Context menu for browser content
  const {
    contextMenuState: browserContextMenu,
    handleContextMenu: handleBrowserContextMenu,
    handleCloseMenu: closeBrowserMenu,
    handleSelectItem: handleBrowserMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.BROWSER);

  // Context menu for browser links
  const {
    contextMenuState: browserLinkContextMenu,
    handleContextMenu: handleBrowserLinkContextMenu,
    handleCloseMenu: closeBrowserLinkMenu,
    handleSelectItem: handleBrowserLinkMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.BROWSER_LINK);

  // Handle browser context menu actions
  const handleBrowserAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.BACK:
        console.log('Browser: Go back');
        break;
      case MENU_ACTIONS.FORWARD:
        console.log('Browser: Go forward');
        break;
      case MENU_ACTIONS.RELOAD:
        console.log('Browser: Reload page');
        break;
      case MENU_ACTIONS.VIEW_SOURCE:
        console.log('Browser: View source');
        break;
      case MENU_ACTIONS.INSPECT:
        console.log('Browser: Inspect element');
        break;
      case MENU_ACTIONS.PRINT:
        console.log('Browser: Print');
        break;
      case MENU_ACTIONS.SAVE_PAGE:
        console.log('Browser: Save page');
        break;
      default:
        break;
    }
  }, []);

  // Handle browser link context menu actions
  const handleBrowserLinkAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.OPEN_LINK:
        console.log('Browser: Open link');
        break;
      case MENU_ACTIONS.OPEN_LINK_NEW_TAB:
        console.log('Browser: Open link in new tab');
        break;
      case MENU_ACTIONS.COPY_LINK:
        console.log('Browser: Copy link');
        break;
      default:
        break;
    }
  }, []);

  const handleBrowserContentRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if right-click is on a link
    let target = e.target;
    let isLink = false;
    
    while (target && target !== e.currentTarget) {
      if (target.tagName === 'A') {
        isLink = true;
        break;
      }
      target = target.parentElement;
    }
    
    // Call appropriate context menu handler
    if (isLink) {
      handleBrowserLinkContextMenu(e);
    } else {
      handleBrowserContextMenu(e);
    }
  }, [handleBrowserContextMenu, handleBrowserLinkContextMenu]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex gap-2 p-2 bg-slate-50 border-b">
        <button className="px-2 py-1 bg-slate-200">⟵</button>
        <button className="px-2 py-1 bg-slate-200">⟶</button>
        <div className="flex-1 flex items-center gap-2 bg-white border px-3 py-1">
          <Globe size={16} className="text-slate-500"/>
          <input value={url} onChange={e=>setUrl(e.target.value)} className="w-full outline-none"/>
        </div>
        <button className="px-3 py-1 bg-slate-900 text-white">Go</button>
      </div>
      <div 
        className="flex-1 bg-white grid place-items-center"
        onContextMenu={handleBrowserContentRightClick}
      >
        <div className="text-center text-slate-500">
          <div className="text-xl font-semibold mb-1">Mock Browser</div>
          <div>Rendering <span className="font-mono">{url}</span></div>
          <div className="mt-4 space-y-2">
            <a href="#example1" className="block text-blue-600 hover:underline">Example Link 1</a>
            <a href="#example2" className="block text-blue-600 hover:underline">Example Link 2</a>
          </div>
        </div>
      </div>

      {/* Browser Content Context Menu */}
      <ContextMenu
        contextMenuState={browserContextMenu}
        onClose={closeBrowserMenu}
        onSelectItem={(item) => {
          handleBrowserMenuSelect(item);
          handleBrowserAction(item);
        }}
      />

      {/* Browser Link Context Menu */}
      <ContextMenu
        contextMenuState={browserLinkContextMenu}
        onClose={closeBrowserLinkMenu}
        onSelectItem={(item) => {
          handleBrowserLinkMenuSelect(item);
          handleBrowserLinkAction(item);
        }}
      />
    </div>
  );
}