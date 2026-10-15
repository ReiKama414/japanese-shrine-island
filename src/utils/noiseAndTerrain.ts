import * as THREE from 'three';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20261015);
const perm = new Uint8Array(512);
const p0 = new Uint8Array(256);
for (let i = 0; i < 256; i++) p0[i] = i;
for (let i = 255; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  const tmp = p0[i];
  p0[i] = p0[j];
  p0[j] = tmp;
}
for (let i = 0; i < 512; i++) perm[i] = p0[i & 255];

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}
function grad2(hash: number, x: number, y: number): number {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
}

export function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const A = perm[X] + Y;
  const B = perm[X + 1] + Y;
  return 0.5 * lerp(
    lerp(grad2(perm[A], x, y), grad2(perm[B], x - 1, y), u),
    lerp(grad2(perm[A + 1], x, y - 1), grad2(perm[B + 1], x - 1, y - 1), u),
    v
  );
}

export function fbm2(x: number, y: number, octaves = 4, lacunarity = 2.05, gain = 0.5): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2D(x * freq, y * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

export function ridgedFbm2(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  let weight = 1.0;
  for (let i = 0; i < octaves; i++) {
    let n = 1.0 - Math.abs(noise2D(x * freq, y * freq));
    n = n * n * weight;
    weight = Math.max(0.0, Math.min(1.0, n * 1.8));
    sum += n * amp;
    freq *= 2.12;
    amp *= 0.48;
  }
  return sum;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const DIORAMA_HALF = 11.0;
export const DIORAMA_CORNER = 2.0;
export const BASE_BOTTOM_Y = -1.58;

export function sdRoundedBox2D(x: number, z: number, halfSize = DIORAMA_HALF, r = DIORAMA_CORNER): number {
  const qx = Math.abs(x) - (halfSize - r);
  const qz = Math.abs(z) - (halfSize - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}

export function mapGridToRoundedSquare(u: number, v: number, halfSize = DIORAMA_HALF, r = DIORAMA_CORNER): { x: number; z: number } {
  const x0 = u * halfSize;
  const z0 = v * halfSize;
  const inner = halfSize - r;
  const ax = Math.abs(x0);
  const az = Math.abs(z0);
  if (ax > inner && az > inner) {
    const dx = ax - inner;
    const dz = az - inner;
    const maxD = Math.max(dx, dz);
    const len = Math.hypot(dx, dz) || 1;
    const nx = (inner + (dx / len) * maxD) * Math.sign(x0);
    const nz = (inner + (dz / len) * maxD) * Math.sign(z0);
    return { x: nx, z: nz };
  }
  return { x: x0, z: z0 };
}

export function getTerrainHeight(x: number, z: number): number {
  const wx = x + fbm2(x * 0.24 + 3.1, z * 0.24 - 1.7, 3) * 0.72;
  const wz = z + fbm2(x * 0.24 - 5.4, z * 0.24 + 4.2, 3) * 0.72;

  const distFromIsland = Math.hypot((wx - 0.6) * 0.78, (wz + 0.4) * 0.82);
  let h = -0.24 - smoothstep(2.8, 10.6, distFromIsland) * 0.94;

  const ripple = Math.sin(distFromIsland * 4.2 + fbm2(x * 0.5, z * 0.5, 2) * 2.2) * 0.018;
  h += ripple * smoothstep(2.5, 9.5, distFromIsland);

  const beachDist = Math.hypot((wx - 0.65) / 6.9, (wz + 0.35) / 6.4);
  h += Math.exp(-beachDist * beachDist * 1.28) * 0.62;

  const spitDist = Math.hypot((wx + 0.45) / 4.8, (wz - 2.25) / 3.9);
  h += Math.exp(-spitDist * spitDist * 1.45) * 0.22;

  const lagoonDist = Math.hypot((x + 1.25) / 3.2, (z - 2.45) / 2.8);
  h -= Math.exp(-lagoonDist * lagoonDist * 1.5) * 0.32;

  const toriiFlat = Math.exp(-Math.pow((x + 1.65) / 2.5, 2) - Math.pow((z - 3.35) / 2.3, 2));
  h = lerp(h, -0.24 + fbm2(x * 0.8, z * 0.8, 2) * 0.02, toriiFlat * 0.72);

  const mx = (wx - 1.15) / 5.25;
  const mz = (wz + 2.95) / 4.45;
  const mDist2 = mx * mx + mz * mz;
  if (mDist2 < 2.2) {
    const baseMtn = Math.pow(Math.max(0, 1.0 - mDist2 / 1.85), 1.65) * 3.85;
    const ridgeDetail = ridgedFbm2(x * 0.38 + 1.2, z * 0.38 - 2.4, 3) * 0.92;
    h += baseMtn + Math.max(0, 1.0 - mDist2 / 1.55) * ridgeDetail;
  }

  const ex = (wx - 3.55) / 3.6;
  const ez = (wz + 1.45) / 3.5;
  const eDist2 = ex * ex + ez * ez;
  if (eDist2 < 1.8) {
    h += Math.pow(Math.max(0, 1.0 - eDist2 / 1.65), 1.6) * 2.25;
  }

  const px = (wx + 2.15) / 3.5;
  const pz = (wz + 2.55) / 3.2;
  const pDist2 = px * px + pz * pz;
  if (pDist2 < 1.8) {
    h += Math.pow(Math.max(0, 1.0 - pDist2 / 1.65), 1.6) * 2.15;
  }

  const lsx = (x + 4.25) / 1.35;
  const lsz = (z - 0.55) / 1.35;
  const lsDist2 = lsx * lsx + lsz * lsz;
  if (lsDist2 < 1.5) {
    const rockShape = Math.pow(Math.max(0, 1.0 - lsDist2 / 1.3), 1.45);
    const crag = 0.72 + 0.45 * ridgedFbm2(x * 0.9 + 4.1, z * 0.9 - 1.2, 3);
    h = Math.max(h, -0.22 + rockShape * 1.25 * crag);
  }

  const rsx = (x - 2.75) / 1.45;
  const rsz = (z - 1.95) / 1.35;
  const rsDist2 = rsx * rsx + rsz * rsz;
  if (rsDist2 < 1.5) {
    const rockShape = Math.pow(Math.max(0, 1.0 - rsDist2 / 1.3), 1.4);
    const crag = 0.75 + 0.42 * ridgedFbm2(x * 0.85 - 2.3, z * 0.85 + 3.7, 3);
    h = Math.max(h, -0.20 + rockShape * 1.38 * crag);
  }

  const pagDist = Math.hypot((x + 2.35) / 1.25, (z + 2.55) / 1.25);
  if (pagDist < 1.35) {
    const wPag = 1.0 - smoothstep(0.55, 1.35, pagDist);
    h = lerp(h, 1.68, wPag);
  }

  const honDist = Math.hypot((x + 0.35) / 1.95, (z + 1.55) / 1.25);
  if (honDist < 1.3) {
    const wHon = 1.0 - smoothstep(0.65, 1.3, honDist);
    h = lerp(h, 0.34, wHon * 0.88);
  }

  const haiDist = Math.hypot((x + 0.35) / 2.3, (z - 0.15) / 1.65);
  if (haiDist < 1.25) {
    const wHai = 1.0 - smoothstep(0.55, 1.25, haiDist);
    h = lerp(h, -0.16, wHai * 0.72);
  }

  const edgeSd = sdRoundedBox2D(x, z, DIORAMA_HALF, DIORAMA_CORNER);
  if (edgeSd > -2.0) {
    const edgeT = smoothstep(-2.0, -0.1, edgeSd);
    const targetEdgeDepth = -0.92 - 0.28 * smoothstep(-4.0, 6.0, z - x * 0.35) + fbm2(x * 0.35, z * 0.35, 2) * 0.05;
    h = lerp(h, Math.min(h, targetEdgeDepth), edgeT);
  }

  return Math.max(-1.24, h);
}

export function getTerrainNormal(x: number, z: number, eps = 0.08): { x: number; y: number; z: number } {
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  const nx = hL - hR;
  const ny = 2.0 * eps;
  const nz = hD - hU;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

export function getPerimeterPoints(gridN = 156): Array<{ x: number; z: number }> {
  const perimPts: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < gridN; i++) perimPts.push(mapGridToRoundedSquare((i / gridN) * 2 - 1, -1));
  for (let i = 0; i < gridN; i++) perimPts.push(mapGridToRoundedSquare(1, (i / gridN) * 2 - 1));
  for (let i = 0; i < gridN; i++) perimPts.push(mapGridToRoundedSquare(1 - (i / gridN) * 2, 1));
  for (let i = 0; i < gridN; i++) perimPts.push(mapGridToRoundedSquare(-1, 1 - (i / gridN) * 2));
  return perimPts;
}
