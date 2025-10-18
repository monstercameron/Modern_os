import { TB, SN, B0 } from '../utils/constants.js';
import { qb } from '../utils/geometry.js';

/**
 * Window action handlers
 * Pure functions for window state transformations
 */

export function closeWindow() {
  return null;
}

export function minimizeWindow(w) {
  return { ...w, m: true };
}

export function unminimizeWindow(w) {
  return { ...w, m: false };
}

export function maximizeWindow(w) {
  const result = { 
    ...w, 
    prevB: w.b, 
    prevSN: w.sn, 
    sn: SN.FULL, 
    b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } 
  };
  return result;
}

export function unmaximizeWindow(w) {
  const result = { 
    ...w, 
    sn: w.prevSN ?? SN.NONE, 
    b: w.prevB ?? { ...B0 } 
  };
  return result;
}

export function snapWindow(w, snapType) {
  const saveB = (w.sn === SN.NONE) ? w.b : (w.prevB || w.b);
  const h = window.innerHeight - TB;
  const hw = window.innerWidth / 2;
  const hh = h / 2;
  
  let newBounds;
  
  if (snapType === SN.LEFT) {
    newBounds = { x: 0, y: TB, w: hw, h };
  } else if (snapType === SN.RIGHT) {
    newBounds = { x: hw, y: TB, w: hw, h };
  } else if (snapType === SN.TOP) {
    newBounds = { x: 0, y: TB, w: window.innerWidth, h: hh };
  } else if (snapType === SN.BOTTOM) {
    newBounds = { x: 0, y: TB + hh, w: window.innerWidth, h: hh };
  } else if (snapType === SN.FULL) {
    newBounds = { x: 0, y: TB, w: window.innerWidth, h };
  } else {
    return w;
  }
  
  return { ...w, prevB: saveB, prevSN: w.sn, sn: snapType, b: newBounds };
}

export function snapQuadWindow(w, quadIndex) {
  const saveB = (w.sn === SN.NONE) ? w.b : (w.prevB || w.b);
  const newBounds = qb(quadIndex);
  
  return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.QUAD, b: newBounds };
}

export function toggleMaximizeWindow(w) {
  if (w.sn === SN.FULL) {
    return { 
      ...w, 
      m: false, 
      sn: w.prevSN ?? SN.NONE, 
      b: w.prevB ?? { ...B0 } 
    };
  }
  
  const newBounds = { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB };
  return { 
    ...w, 
    prevB: w.b, 
    prevSN: w.sn, 
    sn: SN.FULL, 
    b: newBounds
  };
}

export function floatWindow(w, x, y) {
  const newBounds = { ...w.b, x, y };
  
  return { ...w, sn: SN.NONE, b: newBounds, z: 1000 };
}
