// Eight absolute weights. Forest (id 4) belongs to the canopy layer.
export const MATERIAL_IDS = Object.freeze([1, 2, 3, 5, 6, 7, 8, 9]);
const invalid = () => { throw new Error('Invalid project'); };
const clamp = v => Math.min(1, Math.max(0, v));

export function encodeMaterialCoverage(weights) {
  if (!weights.some(Boolean)) return '';
  const parts = [];
  for (let offset = 0; offset < weights.length; offset += 8192) {
    parts.push(String.fromCharCode(...weights.subarray(offset, offset + 8192)));
  }
  return btoa(parts.join(''));
}

export function decodeMaterialCoverage(encoded, n) {
  if (typeof encoded !== 'string' || !Number.isInteger(n) || n < 1 || n > 256) invalid();
  const size = n * n * 8;
  if (!encoded) return new Uint8Array(size);
  if (encoded.length !== 4 * Math.ceil(size / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) invalid();
  let binary;
  try { binary = atob(encoded); } catch { invalid(); }
  if (binary.length !== size || btoa(binary) !== encoded) invalid();
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

export function validateMaterialCoverage(encoded, n, paintAlpha) {
  const bytes = decodeMaterialCoverage(encoded, n);
  if (paintAlpha?.length !== n*n) invalid();
  for (let i = 0; i < paintAlpha.length; i++) {
    const alpha = paintAlpha[i];
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) invalid();
    let sum = 0;
    for (let k = 0; k < 8; k++) sum += bytes[i*8+k];
    if (sum > Math.round(alpha * 255) + 1) invalid();
  }
}

export function applyMaterialCoverage(weights, i, {id, amount, erase=false, initial=null, alpha=1}) {
  const channel = MATERIAL_IDS.indexOf(id);
  if (!erase && channel < 0) return;
  const start = i * 8, source = initial ?? weights;
  const sourceStart = initial?.length === 8 ? 0 : start;
  const blend = clamp(amount);
  let sum = 0;
  for (let k = 0; k < 8; k++) {
    const pigment = !erase && k === channel ? 255 * blend : 0;
    const value = Math.round(source[sourceStart+k] * (1-blend) + pigment);
    sum += weights[start+k] = value;
  }
  const cap = Math.round(clamp(alpha)*255);
  while (sum > cap) {
    let largest = start;
    for (let k = 1; k < 8; k++) if (weights[start+k] > weights[largest]) largest = start+k;
    weights[largest]--;
    sum--;
  }
}
