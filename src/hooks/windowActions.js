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
  console.log('[maximizeWindow] ▶ Input:', { id: w.id, sn_in: w.sn, b_in: w.b });
  const result = { 
    ...w, 
    prevB: w.b, 
    prevSN: w.sn, 
    sn: SN.FULL, 
    b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } 
  };
  console.log('[maximizeWindow] ◀ Output:', { sn_out: result.sn, b_out: result.b, prevB_saved: result.prevB, prevSN_saved: result.prevSN });
  return result;
}

export function unmaximizeWindow(w) {
  console.log('[unmaximizeWindow] ▶ Input:', { id: w.id, sn_in: w.sn, prevB_in: w.prevB, prevSN_in: w.prevSN });
  const result = { 
    ...w, 
    sn: w.prevSN ?? SN.NONE, 
    b: w.prevB ?? { ...B0 } 
  };
  console.log('[unmaximizeWindow] ◀ Output:', { sn_out: result.sn, b_out: result.b, used_prevB: !!w.prevB, used_prevSN: !!w.prevSN });
  return result;
}

export function snapWindow(w, snapType) {
  const saveB = (w.sn === SN.NONE) ? w.b : (w.prevB || w.b);
  const h = window.innerHeight - TB;
  const hw = window.innerWidth / 2;
  const hh = h / 2;
  
  if (snapType === SN.LEFT) {
    return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.LEFT, b: { x: 0, y: TB, w: hw, h } };
  }
  if (snapType === SN.RIGHT) {
    return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.RIGHT, b: { x: hw, y: TB, w: hw, h } };
  }
  if (snapType === SN.TOP) {
    return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.TOP, b: { x: 0, y: TB, w: window.innerWidth, h: hh } };
  }
  if (snapType === SN.BOTTOM) {
    const bottomRect = { x: 0, y: TB + hh, w: window.innerWidth, h: hh };
    return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.BOTTOM, b: bottomRect };
  }
  if (snapType === SN.FULL) {
    return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.FULL, b: { x: 0, y: TB, w: window.innerWidth, h } };
  }
  
  return w;
}

export function snapQuadWindow(w, quadIndex) {
  const saveB = (w.sn === SN.NONE) ? w.b : (w.prevB || w.b);
  return { ...w, prevB: saveB, prevSN: w.sn, sn: SN.QUAD, b: qb(quadIndex) };
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
  return { ...w, sn: SN.NONE, b: { ...w.b, x, y }, z: 1000 };
}
