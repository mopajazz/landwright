// The first eight channels retain their legacy order. Forest belongs to the canopy layer.
export const MATERIAL_IDS = Object.freeze([1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12]);
const legacyChannels = 8;
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

export function decodeMaterialCoverage(encoded, n, channels=legacyChannels) {
  if (typeof encoded !== 'string' || !Number.isInteger(n) || n < 1 || n > 512) invalid();
  const size = n * n * channels;
  if (!encoded) return new Uint8Array(size);
  if (encoded.length !== 4 * Math.ceil(size / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) invalid();
  let binary;
  try { binary = atob(encoded); } catch { invalid(); }
  if (binary.length !== size || btoa(binary) !== encoded) invalid();
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

export function validateMaterialCoverage(encoded, n, paintAlpha, version=9) {
  const channels = version >= 10 ? MATERIAL_IDS.length : legacyChannels;
  const bytes = decodeMaterialCoverage(encoded, n, channels);
  if (paintAlpha?.length !== n*n) invalid();
  for (let i = 0; i < paintAlpha.length; i++) {
    const alpha = paintAlpha[i];
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) invalid();
    let sum = 0;
    for (let k = 0; k < channels; k++) sum += bytes[i*channels+k];
    if (sum > Math.round(alpha * 255) + 1) invalid();
  }
}

export function loadProjectMaterials(encoded, n, version) {
  const channels = MATERIAL_IDS.length;
  if (version >= 10 || !encoded) return decodeMaterialCoverage(encoded, n, channels);
  const legacy = decodeMaterialCoverage(encoded, n);
  const weights = new Uint8Array(n*n*channels);
  for (let i = 0; i < n*n; i++) {
    for (let k = 0; k < legacyChannels; k++) weights[i*channels+k] = legacy[i*legacyChannels+k];
  }
  return weights;
}

export function encodeProjectMaterials(weights, paint) {
  const channels = MATERIAL_IDS.length;
  const cells = weights.length / channels;
  for (let i = 0; i < cells; i++) {
    const offset = i*channels;
    if (paint?.[i] > 9 || weights[offset+8] || weights[offset+9] || weights[offset+10]) {
      return {version:10, surfaceMaterials:encodeMaterialCoverage(weights)};
    }
  }
  const legacy = new Uint8Array(cells*legacyChannels);
  for (let i = 0; i < cells; i++) {
    for (let k = 0; k < legacyChannels; k++) legacy[i*legacyChannels+k] = weights[i*channels+k];
  }
  return {version:9, surfaceMaterials:encodeMaterialCoverage(legacy)};
}

export function applyMaterialCoverage(weights, i, {id, amount, erase=false, initial=null, alpha=1,channels=legacyChannels}) {
  const channel = MATERIAL_IDS.indexOf(id);
  if (!erase && (channel < 0 || channel >= channels)) return;
  const start = i * channels, source = initial ?? weights;
  const sourceStart = initial?.length === channels ? 0 : start;
  const blend = clamp(amount);
  let sum = 0;
  for (let k = 0; k < channels; k++) {
    const pigment = !erase && k === channel ? 255 * blend : 0;
    const value = Math.round(source[sourceStart+k] * (1-blend) + pigment);
    sum += weights[start+k] = value;
  }
  const cap = Math.round(clamp(alpha)*255);
  while (sum > cap) {
    let largest = start;
    for (let k = 1; k < channels; k++) if (weights[start+k] > weights[largest]) largest = start+k;
    weights[largest]--;
    sum--;
  }
}
