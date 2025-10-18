import { useState, useRef } from 'react';
import { SN } from '../utils/constants.js';
import { ghostFromPoint } from '../utils/geometry.js';
import { detectSnapZone, getSnapBounds, SNAP_ZONES } from '../utils/snapZones.js';
import { TB } from '../utils/constants.js';

/**
 * Evaluate snap zone based on pointer position
 * Uses perimeter-based zone detection for predictive snapping
 */
function evaluateSnapZone(point, screenWidth, screenHeight) {
  // Detect which zone the pointer is in
  const zone = detectSnapZone(point.x, point.y, screenWidth, screenHeight);
  
  console.log('evaluateSnapZone:', { 
    pointX: point.x, 
    pointY: point.y, 
    screenWidth, 
    screenHeight, 
    detectedZone: zone,
    leftEdge: point.x < 50,
    rightEdge: point.x > screenWidth - 50,
    topEdge: point.y < 50,
    bottomEdge: point.y > screenHeight - 50
  });
  
  if (zone === SNAP_ZONES.NONE) {
    return { zone: null, rect: null, snapType: null };
  }
  
  // Get snap bounds for the detected zone
  const bounds = getSnapBounds(zone, screenWidth, screenHeight);
  
  if (!bounds) {
    return { zone: null, rect: null, snapType: null };
  }
  
  console.log(`Snap bounds calculated: zone=${zone}, x=${bounds.x}, y=${bounds.y}, w=${bounds.w}, h=${bounds.h}`);
  
  // Return snap result with bounds directly from snapZones
  // All zones now use 'snapToBounds' action type
  return {
    zone,
    rect: bounds,
    snapType: 'snapToBounds',
    snapPayload: bounds,
    type: 'snapToBounds',
    payload: bounds,
    id: zone,
  };
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
    preview: null,
    showOverlay: false
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
    dragPreviewRef.current = null;
    dragOverRef.current = null;
    setDrag({ 
      activeId: window.id, 
      targets: [], 
      over: null, 
      candidate: null, 
      preview: null,
      showOverlay: false
    });
    
    // Show snap overlay after 100ms
    setTimeout(() => {
      setDrag(d => d.activeId === window.id ? { ...d, showOverlay: true } : d);
    }, 100);
  };

  /**
   * Handle drag movement with pointer position
   * Uses perimeter-based snap zone detection
   */
  const handleDrag = (windowId, point) => {
    dragPtRef.current = point;
    
    if (!dragRAF.current) {
      dragRAF.current = requestAnimationFrame(() => {
        const cur = dragPtRef.current;
        if (!cur) { 
          dragRAF.current = 0; 
          return; 
        }
        
        // Get screen dimensions (subtract taskbar height)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - TB;
        
        // Detect snap zone based on pointer position
        const snapResult = evaluateSnapZone(cur, screenWidth, screenHeight);
        const over = snapResult.zone;
        const snapRect = snapResult.rect;
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
            preview: snapRect,
            snapTarget: snapResult
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
    
    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - TB;
    
    // Evaluate final snap zone at drop point
    const snapResult = evaluateSnapZone(point, screenWidth, screenHeight);
    
    dragPreviewRef.current = null;
    dragOverRef.current = null;
    setDrag({ 
      activeId: null, 
      targets: [], 
      over: null, 
      candidate: null, 
      preview: null,
      showOverlay: false
    });
    
    // Return snap target if in a zone
    return snapResult.zone ? snapResult : null;
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
      preview: null,
      showOverlay: false
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
