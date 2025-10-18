import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isMenuVisible, constrainPosition, getMenuItems, getSelectedItem } from '../utils/contextMenuStateMachine.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';

/**
 * Context Menu Component
 * 
 * Displays a context menu with items based on the current context.
 * Supports keyboard navigation (arrow keys, Enter, Escape).
 * Renders at specified position with screen boundary constraints.
 */
export const ContextMenu = memo(function ContextMenu({ contextMenuState, onClose, onSelectItem }) {
  const menuRef = useRef(null);
  const [menuSize, setMenuSize] = useState({ width: 240, height: 300 });
  
  // Measure menu size on mount
  useEffect(() => {
    if (menuRef.current && isMenuVisible(contextMenuState)) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuSize({ width: rect.width, height: rect.height });
    }
  }, [contextMenuState]);
  
  // Constrain position to keep menu on screen
  const constrainedPos = constrainPosition(
    contextMenuState.x,
    contextMenuState.y,
    menuSize.width,
    menuSize.height
  );
  
  // Get menu items for this context
  const menuItems = getMenuItems(contextMenuState);
  const selectedItem = getSelectedItem(contextMenuState);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isMenuVisible(contextMenuState)) return;
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // This would be handled by parent through state update
          break;
        case 'ArrowUp':
          e.preventDefault();
          // This would be handled by parent through state update
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedItem) {
            onSelectItem(selectedItem);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenuState, selectedItem, onSelectItem, onClose]);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuVisible(contextMenuState)) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    // Small delay to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuState, onClose]);
  
  if (!isMenuVisible(contextMenuState) || menuItems.length === 0) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        key="context-menu"
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
        className="fixed z-[9999] min-w-[200px] py-1 rounded border shadow-xl"
        style={{
          left: `${constrainedPos.x}px`,
          top: `${constrainedPos.y}px`,
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div
                key={item.id}
                className="my-1 border-t"
                style={{ borderColor: 'var(--theme-border)' }}
              />
            );
          }
          
          const isSelected = selectedItem?.id === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelectItem(item)}
              onMouseEnter={() => {
                // Update selection on hover
                eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
                  action: 'select',
                  itemId: item.id,
                });
              }}
              className="w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center gap-2 hover:bg-blue-500"
              style={{
                backgroundColor: isSelected ? 'var(--theme-accent)' : 'transparent',
                color: isSelected ? 'var(--theme-accent-text)' : 'var(--theme-text)',
              }}
            >
              <span className="text-base opacity-80 flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
