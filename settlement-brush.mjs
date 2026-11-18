import { SETTLEMENT_KINDS, settlementRadius } from './settlements.mjs?v=2.8.0';

const rules = {
  hamlet: { minimum: 2, count: 4, spacing: 3 },
  village: { minimum: 4, count: 10, spacing: 2.8 },
  town: { minimum: 8, count: 21, spacing: 2.7, court: 3 },
  abbey: { minimum: 4, count: 8, spacing: 3, court: 2.5, enclosure: 5 },
  castle: { minimum: 3, count: 6, spacing: 3.4, court: 2.7, enclosure: 5 }
};
const steps = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// The footprint limits the search. A connected network of dry, walkable
// cells determines the built plan, which is saved independently of the bed.
export function planSettlement(kind, point, diameter, scene) {
  const { n, heights, sea, riverWater, settlements = [] } = scene;
  const spec = SETTLEMENT_KINDS[kind], rule = rules[kind];
  if (settlements.length >= 64) return { reason: 'This map already has 64 settlements.' };
  const r = diameter / 2;
  if (r < spec.radius * .5) return { reason: 'Increase the brush size to fit this place.' };
  const x = Math.round(point.x), y = Math.round(point.y);
  if (!(x >= r && y >= r && x + r <= n - 1 && y + r <= n - 1)) {
    return { reason: 'Move the brush farther inside the map.' };
  }
  const cells = new Map();
  function dry(px, py) {
    if (Math.hypot(px - x, py - y) > r) return false;
    const i = py * n + px, h = heights[i];
    return h >= sea + 1 && !(riverWater?.[i] > h + .01)
      && !settlements.some(place => Math.hypot(px - place.x, py - place.y) <= settlementRadius(place) + 1);
  }
  function buildable(px, py, w, d) {
    const h = heights[py * n + px];
    for (let yy = py - Math.ceil(d / 2); yy <= py + Math.ceil(d / 2); yy++) {
      for (let xx = px - Math.ceil(w / 2); xx <= px + Math.ceil(w / 2); xx++) {
        if (!dry(xx, yy) || Math.abs(heights[yy * n + xx] - h) > 3) return false;
      }
    }
    return true;
  }
  for (let py = Math.ceil(y - r); py <= y + r; py++) {
    for (let px = Math.ceil(x - r); px <= x + r; px++) {
      if (dry(px, py)) cells.set(py * n + px, { x: px, y: py, h: heights[py * n + px] });
    }
  }
  function enclosure(cell) {
    if (!rule.enclosure) return [];
    const edge = rule.enclosure;
    const outline = [[-edge, -edge], [edge, -edge], [edge, edge], [-edge, edge], [-edge, -edge]];
    for (let i = -edge; i <= edge; i++) {
      for (const [dx, dy] of [[i, -edge], [i, edge], [-edge, i], [edge, i]]) {
        const wall = cells.get((cell.y + dy) * n + cell.x + dx);
        if (!wall || Math.abs(wall.h - cell.h) > 7) return null;
      }
    }
    return outline.map(([dx, dy]) => [cell.x + dx, cell.y + dy]);
  }
  const roots = [...cells.values()].filter(cell => buildable(cell.x, cell.y, rule.court || 2, rule.court || 2));
  const score = cell => Math.hypot(cell.x - x, cell.y - y) - (kind === 'castle' ? cell.h * .45 : 0);
  roots.sort((a, b) => score(a) - score(b));
  for (const root of roots.slice(0, 32)) {
    const wall = enclosure(root);
    if (!wall) continue;
    const queue = [root], parent = new Map([[root, null]]);
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i];
      for (const [dx, dy] of steps) {
        const next = cells.get((cell.y + dy) * n + cell.x + dx);
        if (!next || parent.has(next) || Math.abs(next.h - cell.h) > 3) continue;
        parent.set(next, cell);
        queue.push(next);
      }
    }
    const roofs = [], lanes = [], used = new Set([root]);
    if (kind === 'abbey') {
      const hall = queue.find(cell => cell.x === root.x - 2 && cell.y === root.y);
      if (!hall || !buildable(hall.x, hall.y, 1.8, 5)) continue;
      roofs.push([hall.x, hall.y, 1.8, 5, .2, 3]);
    }
    if (kind === 'castle') {
      if (!buildable(root.x, root.y, 3.4, 3.4)) continue;
      roofs.push([root.x, root.y, 3.4, 3.4, .2, 5]);
    }
    // Prefer a long main lane for villages and closer side streets for towns.
    const axis = queue.reduce((far, cell) => Math.hypot(cell.x - root.x, cell.y - root.y) >
      Math.hypot(far.x - root.x, far.y - root.y) ? cell : far, root);
    const length = Math.hypot(axis.x - root.x, axis.y - root.y) || 1;
    const laneDistance = cell => Math.abs((cell.x - root.x) * (axis.y - root.y) -
      (cell.y - root.y) * (axis.x - root.x)) / length;
    const candidates = kind === 'village' ? [...queue].sort((a, b) => laneDistance(a) - laneDistance(b)) : queue;
    for (const cell of candidates) {
      if (roofs.length >= rule.count) break;
      const { x: px, y: py } = cell;
      if (rule.court && Math.hypot(px - root.x, py - root.y) < rule.court) continue;
      if (rule.enclosure && Math.max(Math.abs(px - root.x), Math.abs(py - root.y)) >= rule.enclosure - 1) continue;
      if (roofs.some(([bx, by]) => Math.hypot(px - bx, py - by) < rule.spacing)) continue;
      const tone = ((px * 17 + py * 39) % 11) / 11;
      const w = 1.5 + tone * .7, d = 1.15 + tone * .45;
      if (!buildable(px, py, w, d)) continue;
      const branch = [];
      for (let at = cell; at; at = parent.get(at)) {
        branch.push(at);
        if (used.has(at)) break;
      }
      if (branch.length > 128) continue;
      roofs.push([px, py, w, d, tone, 1.4 + tone]);
      branch.forEach(at => used.add(at));
      if (branch.length > 1) lanes.push(branch.map(at => [at.x, at.y]));
    }
    if (roofs.length >= rule.minimum) {
      return { place: { kind, x, y, scale: r / spec.radius, rotation: 0, seed: 0,
        name: spec.label, plan: { roofs, lanes, wall, ...(kind === 'town' && { square: [root.x, root.y] }) } } };
    }
  }
  return { reason: 'Too little connected dry, gentle ground. Move or widen the brush.' };
}
