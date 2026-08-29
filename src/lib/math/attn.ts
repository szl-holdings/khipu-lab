import { matmul, maxAbs, softmax, transpose, zeros, type Mat } from "./tensor.ts";

export type AttnResult = {
  out: Mat;
  scores: Mat;
  probs: Mat;
  residual: number;
};

export function naiveAttn(Q: Mat, K: Mat, V: Mat): AttnResult {
  const d = Q[0].length;
  const scale = 1 / Math.sqrt(d);
  const scores = scaleMat(matmul(Q, transpose(K)), scale);
  const probs = softmax(scores);
  const out = matmul(probs, V);
  return { out, scores, probs, residual: 0 };
}

function scaleMat(a: Mat, s: number): Mat {
  return a.map((row) => row.map((v) => v * s));
}

/**
 * Online-softmax tiled attention (FlashAttention algorithm, public paper).
 * Original CUDA/Triton is not copied. This is the numeric silhouette.
 */
export function tiledAttn(Q: Mat, K: Mat, V: Mat, Br = 4, Bc = 4): AttnResult {
  const n = Q.length;
  const d = Q[0].length;
  const scale = 1 / Math.sqrt(d);
  const O = zeros(n, d);
  const scores = zeros(n, n);
  for (let i0 = 0; i0 < n; i0 += Br) {
    const i1 = Math.min(n, i0 + Br);
    for (let qi = i0; qi < i1; qi++) {
      let m = -Infinity;
      let l = 0;
      const acc = Array(d).fill(0);
      for (let j0 = 0; j0 < n; j0 += Bc) {
        const j1 = Math.min(n, j0 + Bc);
        const sTile: number[] = [];
        for (let kj = j0; kj < j1; kj++) {
          let dot = 0;
          for (let t = 0; t < d; t++) dot += Q[qi][t] * K[kj][t];
          const s = dot * scale;
          sTile.push(s);
          scores[qi][kj] = s;
        }
        const mTile = Math.max(...sTile);
        const mNew = Math.max(m, mTile);
        const alpha = m === -Infinity ? 0 : Math.exp(m - mNew);
        for (let t = 0; t < d; t++) acc[t] *= alpha;
        l *= alpha;
        for (let t = 0; t < sTile.length; t++) {
          const p = Math.exp(sTile[t] - mNew);
          l += p;
          for (let c = 0; c < d; c++) acc[c] += p * V[j0 + t][c];
        }
        m = mNew;
      }
      for (let c = 0; c < d; c++) O[qi][c] = acc[c] / l;
    }
  }
  const naive = naiveAttn(Q, K, V);
  const residual = maxAbs(sub(O, naive.out));
  const probs = softmax(scores);
  return { out: O, scores, probs, residual };
}

function sub(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function causalMask(n: number): Mat {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) m[i][j] = j > i ? 0 : 1;
  }
  return m;
}

/** Sum of attention mass on future keys (j > i). Causal mask must drive this to ~0. */
export function futureMass(probs: Mat): number {
  let s = 0;
  for (let i = 0; i < probs.length; i++) {
    const row = probs[i];
    for (let j = i + 1; j < row.length; j++) s += row[j];
  }
  return s;
}

/** score_mod silhouette: causal + ALiBi-style distance bias, then softmax. */
export function maskModAttn(Q: Mat, K: Mat, V: Mat, slope = 0.15): AttnResult {
  const d = Q[0].length;
  const n = Q.length;
  const scale = 1 / Math.sqrt(d);
  const scores = scaleMat(matmul(Q, transpose(K)), scale);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (j > i) scores[i][j] = -1e9;
      else scores[i][j] -= slope * (i - j);
    }
  }
  const probs = softmax(scores);
  const out = matmul(probs, V);
  return { out, scores, probs, residual: futureMass(probs) };
}
