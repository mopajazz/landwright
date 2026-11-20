export const MAX_WATER_DROPS = 32;

// Reuse the same flood-fill buffers for each drop. Commit to the water
// field only after confirming that no below-level path reaches the edge.
export function createBasinFill(size) {
  const seen = new Uint8Array(size * size);
  const queue = new Int32Array(size * size);

  return function fillBasin(bed, seed, level, field, at = seed) {
    if (!(bed[seed] < level)) return false;
    seen.fill(0);
    queue[0] = seed;
    seen[seed] = 1;
    let tail = 1;

    function visit(i) {
      if (seen[i] || !(bed[i] < level)) return;
      seen[i] = 1;
      queue[tail++] = i;
    }

    for (let head = 0; head < tail; head++) {
      const i = queue[head];
      const x = i % size;
      if (x === 0 || x === size - 1 || i < size || i >= bed.length - size) return false;
      visit(i - 1);
      visit(i + 1);
      visit(i - size);
      visit(i + size);
    }

    if (field) for (let i = 0; i < tail; i++) {
      const cell = queue[i];
      field[cell] = Math.max(field[cell], level);
    }
    return !!seen[at];
  };
}

// Depth is volume per grid cell. Every interior transfer has a matching debit
// and credit, with all transfers evaluated against the same starting surface.
export function createPouredWater(size) {
  const depth = new Float64Array(size * size);
  const delta = new Float64Array(depth.length);
  const neighbors = new Int32Array(4);
  const rates = new Float64Array(4);
  const tolerance = .001;

  function step(bed) {
    delta.fill(0);
    let moving = false;
    for (let i = 0; i < depth.length; i++) {
      const available = depth[i];
      if (available <= tolerance) continue;
      const x = i % size;
      if (x === 0 || x === size-1 || i < size || i >= depth.length-size) {
        delta[i] -= available*.3;
        moving = true;
        continue;
      }
      neighbors[0]=i-1;neighbors[1]=i+1;neighbors[2]=i-size;neighbors[3]=i+size;
      const surface = bed[i] + available;
      let total = 0;
      for (let j = 0; j < 4; j++) {
        const target = neighbors[j];
        const head = surface - bed[target] - depth[target];
        rates[j] = head > tolerance ? head*.12 : 0;
        total += rates[j];
      }
      if (total <= tolerance) continue;
      const scale = Math.min(1, available/total);
      for (let j = 0; j < 4; j++) delta[neighbors[j]] += rates[j]*scale;
      delta[i] -= total*scale;
      moving = true;
    }
    if (moving) for (let i = 0; i < depth.length; i++) depth[i]=Math.max(0,depth[i]+delta[i]);
    return moving;
  }

  function save() {
    const entries=[];
    for(let i=0;i<depth.length;i++) if(depth[i]>=.00001)entries.push([i,Math.round(depth[i]*1e5)/1e5]);
    return entries;
  }
  return {depth,step,save};
}
