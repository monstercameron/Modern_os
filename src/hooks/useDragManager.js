import { useState, useRef } from 'react';
import { SN } from '../utils/constants.js';
import { ghostFromPoint } from '../utils/geometry.js';
import { buildTargetsFor } from '../utils/snapHelpers.js';

// Snap evaluation logic (pointer-based zone detection)
function evaluateSnap(point, targets) {
  if (!targets || targets.length === 0) {
    return { target: null, rect: null };
  }
  
  // Find which zone the pointer is in
  for (const t of targets) {
    if (point.x >= t.rect.x && point.x <= t.rect.x + t.rect.w
      && point.y >= t.rect.y && point.y <= t.rect.y + t.rect.h) {
      return { target: t, rect: t.rect };
    }
  }
  
  return { target: null, rect: null };
}

/**
 * Custom hook for managing window drag operations
 * Handles drag state, snap targets, and preview animations
 */
export function useDragManager() {
  const [drag, setDrag] = useState({ 
    activeId: null, 
    targets: [], 
    over: null, 
    candidate: null, 
    preview: null 
  });

  // Refs for drag performance optimization
  const dragRAF = useRef(0);
  const dragPtRef = useRef(null);
  const targetsRef = useRef([]);
  const dragOverRef = useRef(null);
  const dragPreviewRef = useRef(null);

  /**
   * Initialize drag operation
   */
  const primeDrag = (window) => {
    const targets = buildTargetsFor(window);
    targetsRef.current = targets;
    dragPreviewRef.current = null;
    dragOverRef.current = null;
    setDrag({ 
      activeId: window.id, 
      targets, 
      over: null, 
      candidate: null, 
      preview: null 
    });
  };

  /**
   * Handle drag movement with pointer position
   */
  const handleDrag = (windowId, point) => {
    if (drag.activeId !== windowId) return;
    
    dragPtRef.current = point;
    
    if (!dragRAF.current) {
      dragRAF.current = requestAnimationFrame(() => {
        const cur = dragPtRef.current;
        if (!cur) { 
          dragRAF.current = 0; 
          return; 
        }
        
        const { target: snapTarget, rect: snapRect } = evaluateSnap(cur, targetsRef.current);
        const over = snapTarget ? snapTarget.id : null;
        const prevRect = dragPreviewRef.current;
        
        const rectChanged = (!prevRect && !!snapRect)
          || (!!prevRect && !snapRect)
          || (prevRect && snapRect && (
            prevRect.x !== snapRect.x ||
            prevRect.y !== snapRect.y ||
            prevRect.w !== snapRect.w ||
            prevRect.h !== snapRect.h
          ));
        
        if (over !== dragOverRef.current || rectChanged) {
          dragOverRef.current = over;
          dragPreviewRef.current = snapRect;
          setDrag(d => (d.activeId === windowId ? { 
            ...d, 
            over, 
            candidate: over, 
            preview: snapRect 
          } : d));
        }
        
        dragRAF.current = 0;
      });
    }
  };

  /**
   * Complete drag operation and return snap target
   */
  const endDrag = (point) => {
    if (dragRAF.current) { 
      cancelAnimationFrame(dragRAF.current); 
      dragRAF.current = 0; 
    }
    
    const targets = drag.targets;
    const { target: best } = evaluateSnap(point, targets);
    
    dragPreviewRef.current = null;
    dragOverRef.current = null;
    setDrag({ 
      activeId: null, 
      targets: [], 
      over: null, 
      candidate: null, 
      preview: null 
    });
    
    return best;
  };

  /**
   * Clear drag state
   */
  const clearDrag = () => {
    if (dragRAF.current) { 
      cancelAnimationFrame(dragRAF.current); 
      dragRAF.current = 0; 
    }
    dragPreviewRef.current = null;
    dragOverRef.current = null;
    setDrag({ 
      activeId: null, 
      targets: [], 
      over: null, 
      candidate: null, 
      preview: null 
    });
  };

  return {
    drag,
    primeDrag,
    handleDrag,
    endDrag,
    clearDrag
  };
}
