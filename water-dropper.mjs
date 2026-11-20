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
