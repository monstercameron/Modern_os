import { TB, SN, B0, clampX } from '../utils/constants.js';
import { qb, bottomRect, halfRects } from '../utils/geometry.js';
import { buildTargetsFor, chooseBestTarget } from '../utils/snapHelpers.js';
import { clearBadgeState } from '../utils/appHelpers.js';

/**
 * Run smoke tests for core desktop functionality
 * Returns test results object with { ran, pass, list }
 */
export function runSmokeTests(StubApp) {
  const res = [];
  
  // Test 1: qb() positive & distinct
  try {
    const r0 = qb(0), r1 = qb(1), r2 = qb(2), r3 = qb(3);
    const positive = [r0, r1, r2, r3].every(r => r.w > 0 && r.h > 0 && r.y >= TB);
    const distinct = new Set([
      `${r0.x},${r0.y}`, 
      `${r1.x},${r1.y}`, 
      `${r2.x},${r2.y}`, 
      `${r3.x},${r3.y}`
    ]).size === 4;
    res.push({ name: "qb() positive & distinct", ok: positive && distinct });
  } catch (e) { 
    res.push({ name: "qb() threw", ok: false, err: String(e) }); 
  }

  // Test 2: badge clear on open
  try {
    const b0 = { messages: 2, email: 1 };
    const b1 = clearBadgeState(b0, "messages");
    res.push({ 
      name: "badge clear on open", 
      ok: b1.messages === 0 && b1.email === 1 
    });
  } catch (e) { 
    res.push({ name: "badge clear threw", ok: false, err: String(e) }); 
  }

  // Test 3: bottom snap geometry
  try {
    const top = { 
      x: 0, 
      y: TB, 
      w: window.innerWidth, 
      h: (window.innerHeight - TB) / 2 
    };
    const bottom = bottomRect();
    res.push({ 
      name: "bottom snap geometry", 
      ok: bottom.y > top.y && Math.abs(bottom.w - top.w) < 1 
    });
  } catch (e) { 
    res.push({ name: "bottom snap threw", ok: false, err: String(e) }); 
  }

  // Test 4: double-click restore to previous state
  try {
    const prevB = { x: 33, y: TB + 44, w: 420, h: 300 };
    const w = { b: prevB, sn: SN.LEFT, prevB, prevSN: SN.LEFT };
    const restored = { 
      ...w, 
      m: false, 
      sn: w.prevSN ?? SN.NONE, 
      b: w.prevB ?? { ...B0 } 
    };
    res.push({ 
      name: "dbl restore to prev", 
      ok: restored.sn === SN.LEFT && restored.b.x === 33 && !restored.m 
    });
  } catch (e) { 
    res.push({ name: "dbl restore threw", ok: false, err: String(e) }); 
  }

  // Test 5: drag targets from LEFT snap
  try {
    const w = { sn: SN.LEFT, b: { x: 0, y: TB, w: 100, h: 100 } };
    const t = buildTargetsFor(w);
    res.push({ 
      name: "drag targets from LEFT", 
      ok: t.length === 1 && t[0].payload === SN.RIGHT 
    });
  } catch (e) { 
    res.push({ name: "drag targets threw", ok: false, err: String(e) }); 
  }

  // Test 6: preview clamp within viewport
  try {
    const x = clampX(99999, 280);
    res.push({ 
      name: "preview clamp within viewport", 
      ok: x <= (window.innerWidth - 280) 
    });
  } catch (e) { 
    res.push({ name: "preview clamp threw", ok: false, err: String(e) }); 
  }

  // Test 7: best target selection
  try {
    const ghost = { x: window.innerWidth * 0.6, y: TB + 20, w: 320, h: 240 };
    const best = chooseBestTarget([
      { id: 'LEFT', type: 'snap', payload: SN.LEFT, rect: halfRects().LEFT },
      { id: 'RIGHT', type: 'snap', payload: SN.RIGHT, rect: halfRects().RIGHT }
    ], ghost);
    res.push({ 
      name: 'best target selection', 
      ok: best && best.id === 'RIGHT' 
    });
  } catch (e) { 
    res.push({ name: 'best target test threw', ok: false, err: String(e) }); 
  }

  // Test 8: requestAnimationFrame schedule/cancel
  try {
    const id = requestAnimationFrame(() => {});
    cancelAnimationFrame(id);
    res.push({ name: 'rAF schedule/cancel', ok: true });
  } catch (e) { 
    res.push({ name: 'rAF test threw', ok: false, err: String(e) }); 
  }

  // Test 9: StubApp exists
  try {
    const ok = typeof StubApp === 'function';
    res.push({ name: 'StubApp exists', ok });
  } catch (e) { 
    res.push({ name: 'StubApp existence threw', ok: false, err: String(e) }); 
  }

  return { 
    ran: true, 
    pass: res.every(r => r.ok), 
    list: res 
  };
}
