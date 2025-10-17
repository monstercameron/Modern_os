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
  return { 
    ...w, 
    prevB: w.b, 
    prevSN: w.sn, 
    sn: SN.FULL, 
    b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } 
  };
}

export function unmaximizeWindow(w) {
  return { 
    ...w, 
    sn: w.prevSN ?? SN.NONE, 
    b: w.prevB ?? { ...B0 } 
  };
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
  return { 
    ...w, 
    prevB: w.b, 
    prevSN: w.sn, 
    sn: SN.FULL, 
    b: { x: 0, y: TB, w: window.innerWidth, h: window.innerHeight - TB } 
  };
}

export function floatWindow(w, x, y) {
  return { ...w, sn: SN.NONE, b: { ...w.b, x, y }, z: 1000 };
}
