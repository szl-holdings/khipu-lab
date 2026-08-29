import { mulberry32, randn } from "@/lib/math/tensor";
import { FORMULA_TOKS, synthKhipu, type KhipuExample } from "./datasets";

const V = FORMULA_TOKS.length + 8;
const D = 12;

function tokId(s: string) {
  const up = s.toUpperCase();
  for (let i = 0; i < FORMULA_TOKS.length; i++) if (up.includes(FORMULA_TOKS[i])) return i;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return FORMULA_TOKS.length + (Math.abs(h) % 8);
}

export type KhipuWeights = {
  E: Float32Array;
  W: Float32Array;
  b: Float32Array;
  Wc: Float32Array;
};

export function initKhipu(seed: number): KhipuWeights {
  const rng = mulberry32(seed);
  const E = new Float32Array(V * D);
  const W = new Float32Array(2 * D);
  const b = new Float32Array(2);
  const Wc = new Float32Array(D);
  for (let i = 0; i < E.length; i++) E[i] = randn(rng) * 0.08;
  for (let i = 0; i < W.length; i++) W[i] = randn(rng) * 0.08;
  for (let i = 0; i < D; i++) Wc[i] = randn(rng) * 0.08;
  return { E, W, b, Wc };
}

function embedMean(w: KhipuWeights, text: string) {
  const parts = text.split(/\s+/).filter(Boolean);
  const acc = new Float32Array(D);
  const n = Math.max(parts.length, 1);
  for (const p of parts) {
    const id = tokId(p);
    for (let d = 0; d < D; d++) acc[d] += w.E[id * D + d];
  }
  for (let d = 0; d < D; d++) acc[d] /= n;
  return acc;
}

export function forwardKhipu(w: KhipuWeights, ex: KhipuExample) {
  const q = embedMean(w, ex.query);
  const logits = [
    w.b[0] + dot(w.W.subarray(0, D), q),
    w.b[1] + dot(w.W.subarray(D, 2 * D), q),
  ];
  const m = Math.max(logits[0], logits[1]);
  const e0 = Math.exp(logits[0] - m);
  const e1 = Math.exp(logits[1] - m);
  const z = e0 + e1;
  const p = [e0 / z, e1 / z];
  const cites = ex.handles.map((h) => {
    const hv = embedMean(w, h.note);
    return dot(w.Wc, hv);
  });
  const decision: 0 | 1 = p[1] >= p[0] ? 1 : 0;
  const cited = decision === 1 ? [ex.handles[argmax(cites)].id] : [];
  const offered = new Set(ex.handles.map((h) => h.id));
  const hallucinated = cited.filter((id) => !offered.has(id)).length;
  return { p, cites, decision, cited, hallucinated };
}

function dot(a: ArrayLike<number>, b: ArrayLike<number>) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function argmax(a: number[]) {
  let m = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[m]) m = i;
  return m;
}

export function stepKhipu(w: KhipuWeights, batch: KhipuExample[], lr: number) {
  let loss = 0;
  const gE = new Float32Array(w.E.length);
  const gW = new Float32Array(w.W.length);
  const gb = new Float32Array(2);
  const gWc = new Float32Array(D);
  for (const ex of batch) {
    const q = embedMean(w, ex.query);
    const logits = [
      w.b[0] + dot(w.W.subarray(0, D), q),
      w.b[1] + dot(w.W.subarray(D, 2 * D), q),
    ];
    const m = Math.max(logits[0], logits[1]);
    const e0 = Math.exp(logits[0] - m);
    const e1 = Math.exp(logits[1] - m);
    const z = e0 + e1;
    const p = [e0 / z, e1 / z];
    loss += -Math.log(Math.max(p[ex.decision], 1e-9));
    const d0 = p[0] - (ex.decision === 0 ? 1 : 0);
    const d1 = p[1] - (ex.decision === 1 ? 1 : 0);
    gb[0] += d0;
    gb[1] += d1;
    for (let d = 0; d < D; d++) {
      gW[d] += d0 * q[d];
      gW[D + d] += d1 * q[d];
    }
    const dq = new Float32Array(D);
    for (let d = 0; d < D; d++) dq[d] = d0 * w.W[d] + d1 * w.W[D + d];
    const parts = ex.query.split(/\s+/).filter(Boolean);
    const n = Math.max(parts.length, 1);
    for (const ptok of parts) {
      const id = tokId(ptok);
      for (let d = 0; d < D; d++) gE[id * D + d] += dq[d] / n;
    }
    for (let hi = 0; hi < ex.handles.length; hi++) {
      const gold = ex.cite.includes(hi) ? 1 : 0;
      const hv = embedMean(w, ex.handles[hi].note);
      const score = dot(w.Wc, hv);
      const pred = 1 / (1 + Math.exp(-score));
      const err = pred - gold;
      loss += 0.35 * -(gold * Math.log(Math.max(pred, 1e-9)) + (1 - gold) * Math.log(Math.max(1 - pred, 1e-9)));
      for (let d = 0; d < D; d++) gWc[d] += 0.35 * err * hv[d];
    }
  }
  const n = batch.length;
  const apply = (p: Float32Array, g: Float32Array) => {
    for (let i = 0; i < p.length; i++) p[i] -= (lr * g[i]) / n;
  };
  apply(w.E, gE);
  apply(w.W, gW);
  apply(w.b, gb);
  apply(w.Wc, gWc);
  return loss / n;
}

export function khipuFromBuffers(buffers?: Record<string, Float32Array> | null): KhipuWeights | null {
  if (!buffers) return null;
  const { E, W, b, Wc } = buffers;
  if (!E || !W || !b || !Wc) return null;
  if (E.length !== V * D || W.length !== 2 * D || b.length !== 2 || Wc.length !== D) return null;
  return { E, W, b, Wc };
}

export function inferKhipu(
  w: KhipuWeights,
  query: string,
  handles: Array<{ id: string; note: string }>,
) {
  return forwardKhipu(w, { query, handles, decision: 0, cite: [] });
}

export function evalKhipu(w: KhipuWeights, data: KhipuExample[]) {
  let plan = 0;
  let abstain = 0;
  let abstainN = 0;
  let hall = 0;
  for (const ex of data) {
    const f = forwardKhipu(w, ex);
    hall += f.hallucinated;
    const valid =
      f.hallucinated === 0 &&
      ((f.decision === 0 && f.cited.length === 0) || (f.decision === 1 && f.cited.length >= 1));
    if (valid) plan++;
    if (ex.decision === 0) {
      abstainN++;
      if (f.decision === 0) abstain++;
    }
  }
  return {
    planValid: plan / data.length,
    abstain: abstainN ? abstain / abstainN : 0,
    hallucinated: hall,
  };
}

export { synthKhipu, V as KHIPU_V, D as KHIPU_D };
