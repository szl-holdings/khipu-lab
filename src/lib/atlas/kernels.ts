import { tiledAttn, maskModAttn, naiveAttn } from "@/lib/math/attn";
import { evaluateLambda, wgm, yuyayWeights, checkA1, checkA2, checkA3, checkA4 } from "@/lib/math/lambda";
import { rmsNorm as rmsNormMat } from "@/lib/math/norm";
import { randomMat, type Mat } from "@/lib/math/tensor";
import { yarqaAttn } from "@/lib/math/yarqa";
import { YUYAY_AXES } from "@/lib/szl/doctrine";

export type { Mat };

export const YUYAY = YUYAY_AXES;

export function zeros(rows: number, cols: number): Mat {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function randn(rows: number, cols: number, seed = 7): Mat {
  return randomMat(rows, cols, seed, 0.5);
}

export function digestMat(m: Mat) {
  const rounded = m.map((row) => row.map((x) => Math.round(x * 1e5) / 1e5));
  return JSON.stringify(rounded);
}

export function sdpa(
  q: Mat,
  k: Mat,
  v: Mat,
  mask?: (i: number, j: number) => boolean,
): { weights: Mat; out: Mat; scores: Mat; residual?: number } {
  if (!mask) {
    const t = tiledAttn(q, k, v, 4, 4);
    return { weights: t.probs, out: t.out, scores: t.scores, residual: t.residual };
  }
  // Apply a keep-mask by running naive then zeroing disallowed mass is wrong.
  // Re-run a masked naive path: scores, then -inf where mask is false.
  const base = naiveAttn(q, k, v);
  const n = q.length;
  const scores = base.scores.map((row, i) =>
    row.map((s, j) => (mask(i, j) ? s : -1e9)),
  );
  const m = scores.map((row) => Math.max(...row, -1e8));
  const weights = scores.map((row, i) => {
    const e = row.map((s) => (s <= -1e8 ? 0 : Math.exp(s - m[i])));
    const z = e.reduce((a, b) => a + b, 0) || 1;
    return e.map((v) => v / z);
  });
  const dim = v[0].length;
  const out = zeros(n, dim);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let d = 0; d < dim; d++) out[i][d] += weights[i][j] * v[j][d];
    }
  }
  return { weights, out, scores };
}

export function canalBounds(seq: number, nCanals: number) {
  const n = Math.max(1, Math.min(nCanals, seq));
  const base = Math.floor(seq / n);
  const rem = seq % n;
  const ends: number[] = [0];
  let cur = 0;
  for (let i = 0; i < n; i++) {
    cur += base + (i < rem ? 1 : 0);
    ends.push(cur);
  }
  return ends;
}

export function canalMask(seq: number, nCanals: number) {
  const ends = canalBounds(seq, nCanals);
  return (i: number, j: number) => {
    for (let c = 0; c < ends.length - 1; c++) {
      const a = ends[c];
      const b = ends[c + 1];
      if (i >= a && i < b && j >= a && j < b) return true;
    }
    return false;
  };
}

export function canalAttn(q: Mat, k: Mat, v: Mat, canalSize: number) {
  return yarqaAttn(q, k, v, canalSize);
}

export type MaskKind = "causal" | "sliding" | "prefix";

export function maskMod(kind: MaskKind, window = 3, prefix = 4) {
  return (i: number, j: number) => {
    if (kind === "causal") return j <= i;
    if (kind === "sliding") return j <= i && i - j <= window;
    return j <= i || j < prefix;
  };
}

export function scoreModAttn(q: Mat, k: Mat, v: Mat) {
  return maskModAttn(q, k, v);
}

export function lambdaAggregate(axes: number[], weights?: number[]) {
  const w = weights ?? yuyayWeights().slice(0, axes.length);
  const wsum = w.reduce((a, b) => a + b, 0);
  const normed = w.map((x) => x / wsum);
  return wgm(axes, normed);
}

export function axiomChecks(axes: number[]) {
  const w = yuyayWeights();
  const wsum = w.reduce((a, b) => a + b, 0) || 1;
  const normed = w.map((x) => x / wsum);
  const ev = evaluateLambda(axes, normed);
  return {
    monotone: checkA1(axes, normed),
    homogeneous: checkA2(axes, normed),
    egyptian: checkA3(normed),
    bounded: checkA4(axes, normed),
    score: ev.value,
    blocked: ev.value === 0,
    reason: ev.reason,
  };
}

export function rmsNorm(x: number[], eps = 1e-6) {
  const gamma = Array(x.length).fill(1);
  const res = rmsNormMat([x], gamma, eps);
  return res.y[0];
}

export type BlockTable = {
  blockSize: number;
  nLogical: number;
  nPhysical: number;
  map: number[];
  slots: Mat;
};

export function makeCache(nLogical = 8, blockSize = 2, nPhysical = 6): BlockTable {
  const nBlocks = Math.ceil(nLogical / blockSize);
  const map = Array.from({ length: nBlocks }, (_, i) => (i < nPhysical ? i : -1));
  const slots = randn(nPhysical, blockSize * 4, 11);
  return { blockSize, nLogical, nPhysical, map, slots };
}

export function gatherPaged(cache: BlockTable): Mat {
  const dim = cache.slots[0].length;
  const out = zeros(cache.nLogical, dim);
  for (let t = 0; t < cache.nLogical; t++) {
    const b = Math.floor(t / cache.blockSize);
    const off = t % cache.blockSize;
    const phys = cache.map[b];
    if (phys < 0) continue;
    out[t] = cache.slots[phys].map((v) => v * (1 + off * 0.01));
  }
  return out;
}
