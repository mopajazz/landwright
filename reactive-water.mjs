// Visual ocean coverage. The model owns its buffers and only reads bed elevations.
export function createReactiveWater(size, {cellsPerSecond = 24} = {}) {
  if (!Number.isInteger(size) || size < 2) throw new RangeError('Invalid grid size');
  if (!Number.isFinite(cellsPerSecond) || cellsPerSecond <= 0) throw new RangeError('Invalid flow speed');
  const count = size * size;
  const low = new Uint8Array(count);
  const connected = new Uint8Array(count);
  const nextConnected = new Uint8Array(count);
  const progress = new Float32Array(count);
  const travelTime = new Float64Array(count);
  const arrival = new Float64Array(count).fill(Infinity);
  const queue = new Int32Array(count);
  const predecessor = new Int32Array(count);
  const candidatePredecessor = new Int32Array(count);
  const validPath = new Uint8Array(count);
  let active = false, time = 0, sea = 62;
  let tail = 0;

  function visitBoundary(visit) {
    for (let x = 0; x < size; x++) {
      visit(x);
      visit(count - size + x);
    }
    for (let y = 1; y < size - 1; y++) {
      visit(y * size);
      visit(y * size + size - 1);
    }
  }

  function spread(visit) {
    for (let head = 0; head < tail; head++) {
      const i = queue[head], x = i % size;
      if (x) visit(i - 1, i);
      if (x + 1 < size) visit(i + 1, i);
      if (i >= size) visit(i - size, i);
      if (i + size < count) visit(i + size, i);
    }
  }

  function setTerrain(heights, nextSea, waterEnabled = true) {
    if (heights?.length !== count || !Number.isFinite(nextSea)) throw new RangeError('Invalid terrain');
    sea = nextSea;
    if (!waterEnabled) {
      reset();
      return connected;
    }

    let recalculate = false;
    for (let i = 0; i < count; i++) {
      const submerged = heights[i] < sea ? 1 : 0;
      if (low[i] !== submerged) {
        low[i] = submerged;
        recalculate = true;
      }
      if (!submerged) progress[i] = 0;
    }
    if (!recalculate) return connected;

    nextConnected.fill(0);
    tail = 0;
    visitBoundary(connect);
    spread(connect);
    let changed = false, removed = false;
    for (let i = 0; i < count; i++) {
      if (connected[i] === nextConnected[i]) continue;
      changed = true;
      if (connected[i]) removed = true;
    }
    if (!changed) return connected;
    if (removed) discardBlockedArrivals();

    // Start new routes at settled water and exposed boundaries. Adding a route
    // cannot invalidate an earlier arrival, so a widening cut keeps moving.
    travelTime.fill(-1);
    tail = 0;
    for (let i = 0; i < count; i++) {
      if (nextConnected[i] && progress[i] >= .98) {
        travelTime[i] = 0;
        candidatePredecessor[i] = -1;
        queue[tail++] = i;
      }
    }
    visitBoundary(i => {
      if (nextConnected[i] && travelTime[i] < 0) {
        travelTime[i] = 0;
        candidatePredecessor[i] = -1;
        queue[tail++] = i;
      }
    });
    spread((i, from) => {
      if (nextConnected[i] && travelTime[i] < 0) {
        // Long gravity-wave speed scales with the square root of depth.
        // The shallower side of a grid edge limits propagation across it.
        const depth = sea - Math.max(heights[from], heights[i]);
        const relativeSpeed = Math.min(2, Math.max(.15, Math.sqrt(depth / 22)));
        const edgeTime = progress[from] >= .98 ? 0 : 1 / (cellsPerSecond * relativeSpeed);
        travelTime[i] = travelTime[from] + edgeTime;
        candidatePredecessor[i] = from;
        queue[tail++] = i;
      }
    });
    for (let i = 0; i < count; i++) {
      if (!nextConnected[i]) continue;
      const candidate = time + travelTime[i];
      if (candidate < arrival[i]) {
        arrival[i] = candidate;
        predecessor[i] = candidatePredecessor[i];
      }
    }
    connected.set(nextConnected);
    active = progress.some((value, i) => value !== connected[i]);
    return connected;
  }

  function discardBlockedArrivals() {
    // Keep every scheduled route that still has its path to an existing source.
    validPath.fill(0);
    tail = 0;
    for (let i = 0; i < count; i++) {
      if (nextConnected[i] && arrival[i] < Infinity && predecessor[i] < 0) {
        validPath[i] = 1;
        queue[tail++] = i;
      }
    }
    spread((i, from) => {
      if (nextConnected[i] && !validPath[i] && predecessor[i] === from) {
        validPath[i] = 1;
        queue[tail++] = i;
      }
    });
    for (let i = 0; i < count; i++) {
      if (!validPath[i]) arrival[i] = Infinity;
    }
  }

  function connect(i) {
    if (low[i] && !nextConnected[i]) {
      nextConnected[i] = 1;
      queue[tail++] = i;
    }
  }

  function settle() {
    progress.set(connected);
    active = false;
  }

  function initialize(heights, nextSea, waterEnabled = true) {
    setTerrain(heights, nextSea, waterEnabled);
    settle();
    return connected;
  }

  function advance(dt) {
    if (!active) return false;
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid delta time');
    const step = Math.min(dt, .1);
    time += step;
    let changing = false, pending = false;
    for (let i = 0; i < count; i++) {
      const before = progress[i];
      if (before === connected[i]) continue;
      if (connected[i]) {
        progress[i] = Math.max(before, Math.min(1, (time - arrival[i]) * 4));
      } else {
        progress[i] = Math.max(0, before - step * 5);
      }
      changing ||= before !== progress[i];
      pending ||= progress[i] !== connected[i];
    }
    active = pending;
    return changing;
  }

  function reset() {
    low.fill(0);
    connected.fill(0);
    progress.fill(0);
    arrival.fill(Infinity);
    active = false;
    time = 0;
  }

  return {
    setTerrain, initialize, advance, settle, reset,
    get coverage() { return progress; },
    get connected() { return connected; },
    get active() { return active; },
    get seaLevel() { return sea; }
  };
}

// The moving surface rises out of the bed. A higher authored river surface
// keeps its original color and elevation until ocean water overtakes it.
export function writeOceanSurface(bed, baseSurface, sea, coverage, rgba, surface) {
  for (let i = 0; i < bed.length; i++) {
    const depth = Math.max(0, sea - bed[i]);
    const amount = depth > 0 ? coverage[i] : 0;
    const level = bed[i] + depth * amount;
    if (surface) surface[i] = Math.max(baseSurface[i], level);
    if (!rgba) continue;
    const tint = Math.min(1, depth / 65), offset = i * 4;
    rgba[offset] = 46 - tint * 17;
    rgba[offset + 1] = 83 - tint * 31;
    rgba[offset + 2] = 88 - tint * 28;
    rgba[offset + 3] = level >= baseSurface[i] ? amount * 255 : 0;
  }
}
