import { softmax, zeros, type Mat } from "./tensor.ts";

export type CanalResult = {
  out: Mat;
  scores: Mat;
  probs: Mat;
  canals: number[];
  leaked: number;
};

/**
 * YARQA-ATTN — original compartment attention.
 * Sequence is split into contiguous canals. Tokens attend only inside
 * their canal. Cross-canal scores are hard-zeroed, not masked-and-softmaxed
 * (which would still leak through the partition function).
 */
export function yarqaAttn(
  Q: Mat,
  K: Mat,
  V: Mat,
  canalSize = 4,
): CanalResult {
  const n = Q.length;
  const d = Q[0].length;
  const scale = 1 / Math.sqrt(d);
  const scores = zeros(n, n);
  const probs = zeros(n, n);
  const out = zeros(n, V[0].length);
  const canals: number[] = [];
  for (let c = 0; c <= n; c += canalSize) canals.push(c);

  for (let i = 0; i < n; i++) {
    const c0 = Math.floor(i / canalSize) * canalSize;
    const c1 = Math.min(n, c0 + canalSize);
    const row: number[] = [];
    for (let j = c0; j < c1; j++) {
      let dot = 0;
      for (let t = 0; t < d; t++) dot += Q[i][t] * K[j][t];
      scores[i][j] = dot * scale;
      row.push(scores[i][j]);
    }
    const p = softmax([row])[0];
    for (let t = 0; t < p.length; t++) {
      probs[i][c0 + t] = p[t];
      for (let c = 0; c < V[0].length; c++) out[i][c] += p[t] * V[c0 + t][c];
    }
  }

  let leaked = 0;
  for (let i = 0; i < n; i++) {
    const c0 = Math.floor(i / canalSize) * canalSize;
    const c1 = Math.min(n, c0 + canalSize);
    for (let j = 0; j < n; j++) {
      if (j < c0 || j >= c1) leaked += Math.abs(probs[i][j]);
    }
  }
  return { out, scores, probs, canals, leaked };
}
