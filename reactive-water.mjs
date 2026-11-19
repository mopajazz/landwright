// Experimental, visual-only, sea-connected water propagation.
// No saved terrain mutation; a single model instance owns all typed buffers.
// Call setTerrain() after sculpt changes, then advance(dt) during animation.
// All inputs are heightfield samples in row-major order; no dependencies.
export function createReactiveWater(size, { cellsPerSecond = 24 } = {}) {
  if (!Number.isInteger(size) || size < 2) throw new RangeError('Invalid grid size');
  if (!(cellsPerSecond > 0)) throw new RangeError('Invalid flow speed');
  const count = size * size;
  const target = new Uint8Array(count);
  const connected = new Uint8Array(count);
  const progress = new Float32Array(count);
  const distance = new Int32Array(count);
  const queue = new Int32Array(count);
  let active = false;
  let time = 0;
  let sea = 62;
  function setTerrain(heights, nextSea, waterEnabled = true) {
    if (!heights || heights.length !== count || !Number.isFinite(nextSea)) throw new RangeError('Invalid terrain');
    sea = nextSea;
    target.fill(0);
    connected.fill(0);
    distance.fill(-1);
    let head = 0, tail = 0;
    if (waterEnabled) {
      // Only wet perimeter cells act as ocean sources. A landlocked depression
      // stays dry until the user cuts a traversable connection to the sea.
      for (let i = 0; i < count; i++) {
        const x = i % size, y = (i / size) | 0;
        if ((x === 0 || y === 0 || x === size - 1 || y === size - 1) && heights[i] < sea) {
          connected[i] = 1;
          queue[tail++] = i;
        }
      }
      // Flood topology first. Rendering then approaches this target over time.
      while (head < tail) {
        const i = queue[head++], x = i % size;
        const visit = j => {
          if (!connected[j] && heights[j] < sea) {
            connected[j] = 1;
            queue[tail++] = j;
          }
        };
        if (x) visit(i - 1);
        if (x + 1 < size) visit(i + 1);
        if (i >= size) visit(i - size);
        if (i + size < count) visit(i + size);
      }
      // Existing water, plus the shoreline, is the source of the new wavefront.
      // Propagate arrival distance only within sea-connected water.
      head = 0; tail = 0;
      for (let i = 0; i < count; i++) {
        target[i] = connected[i];
        if (!connected[i]) continue;
        const x = i % size, y = (i / size) | 0;
        if (progress[i] > 0.98 || x === 0 || y === 0 || x === size - 1 || y === size - 1) {
          distance[i] = 0;
          queue[tail++] = i;
        }
      }
      while (head < tail) {
        const i = queue[head++], x = i % size, d = distance[i] + 1;
        const visit = j => {
          if (connected[j] && distance[j] === -1) {
            distance[j] = d;
            queue[tail++] = j;
          }
        };
        if (x) visit(i - 1);
        if (x + 1 < size) visit(i + 1);
        if (i >= size) visit(i - size);
        if (i + size < count) visit(i + size);
      }
    }
    time = 0;
    active = true;
    return connected;
  }
  function initialize(heights, nextSea, waterEnabled = true) {
    setTerrain(heights, nextSea, waterEnabled);
    progress.set(target);
    active = false;
    return connected;
  }
  function advance(dt) {
    if (!active) return false;
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid delta time');
    const step = Math.min(dt, 0.1);
    time += step;
    let changing = false;
    for (let i = 0; i < count; i++) {
      if (!target[i]) {
        if (progress[i] > 0) { progress[i] = Math.max(0, progress[i] - step * 5); changing = true; }
        continue;
      }
      // Arrival advances from old water at a fixed rate across the grid.
      const arrival = distance[i] / cellsPerSecond;
      const value = Math.min(1, Math.max(0, (time - arrival) * 4));
      if (value > progress[i]) { progress[i] = value; changing = true; }
    }
    // A distant wavefront can have a delayed arrival. Do not halt between fronts.
    active = changing || queueHasPending();
    return changing;
  }
  function queueHasPending() {
    for (let i = 0; i < count; i++) if (target[i] && progress[i] < 1) return true;
    return false;
  }
  function reset() { target.fill(0); connected.fill(0); progress.fill(0); distance.fill(-1); active = false; time = 0; }
  return {
    setTerrain, initialize, advance, reset,
    get coverage() { return progress; },
    get connected() { return connected; },
    get active() { return active; },
    get seaLevel() { return sea; }
  };
}
