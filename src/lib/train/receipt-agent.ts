import { mulberry32, randn } from "@/lib/math/tensor";

/** 24-d ReceiptAgent surrogate. Kernel ruleCheck is ground truth. Not 1.5B. */

export const RA_IN = 24;
export const RA_H1 = 16;
export const RA_H2 = 8;
export const RA_OUT = 4;

export const RA_CLASSES = ["ALLOW", "WARN", "BLOCKED", "ESCALATE"] as const;
export type RaClass = 0 | 1 | 2 | 3;

export const RA_IDX = {
  hasReceipt: 0,
  chainContinuous: 1,
  schemaValid: 2,
  digestMatch: 3,
  authorityNonIncreasing: 4,
  approvalPresent: 5,
  overstepLexicon: 6,
  unknownCite: 7,
  lambdaScore: 8,
  khipuAbstain: 9,
  nEvidence: 10,
  trainLossBand: 11,
  weightsBound: 12,
  governedNormOk: 13,
  seqLenNorm: 14,
  oovRate: 15,
  wouldBind: 16,
} as const;

export type RaWeights = {
  W1: Float32Array;
  b1: Float32Array;
  W2: Float32Array;
  b2: Float32Array;
  W3: Float32Array;
  b3: Float32Array;
};

export type RaExample = {
  x: Float32Array;
  y: RaClass;
};

function on(v: number) {
  return v >= 0.5;
}

function bern(rng: () => number, p: number) {
  return rng() < p ? 1 : 0;
}

/** Ground-truth kernel. Surrogate may disagree; kernel wins. */
export function ruleCheck(x: ArrayLike<number>): RaClass {
  const schemaValid = on(x[RA_IDX.schemaValid]);
  const unknownCite = on(x[RA_IDX.unknownCite]);
  const overstepLexicon = on(x[RA_IDX.overstepLexicon]);
  const approvalPresent = on(x[RA_IDX.approvalPresent]);
  const wouldBind = on(x[RA_IDX.wouldBind]);
  const chainContinuous = on(x[RA_IDX.chainContinuous]);
  const digestMatch = on(x[RA_IDX.digestMatch]);
  const khipuAbstain = on(x[RA_IDX.khipuAbstain]);
  if (!schemaValid || unknownCite || overstepLexicon) return 2;
  if (!approvalPresent && wouldBind) return 3;
  if (!chainContinuous || !digestMatch || khipuAbstain) return 1;
  return 0;
}

function fillContext(rng: () => number, x: Float32Array) {
  x[RA_IDX.hasReceipt] = bern(rng, 0.8);
  x[RA_IDX.chainContinuous] = bern(rng, 0.85);
  x[RA_IDX.schemaValid] = 1;
  x[RA_IDX.digestMatch] = bern(rng, 0.85);
  x[RA_IDX.authorityNonIncreasing] = bern(rng, 0.9);
  x[RA_IDX.approvalPresent] = 1;
  x[RA_IDX.overstepLexicon] = 0;
  x[RA_IDX.unknownCite] = 0;
  x[RA_IDX.lambdaScore] = rng();
  x[RA_IDX.khipuAbstain] = 0;
  x[RA_IDX.nEvidence] = rng();
  x[RA_IDX.trainLossBand] = rng();
  x[RA_IDX.weightsBound] = bern(rng, 0.9);
  x[RA_IDX.governedNormOk] = bern(rng, 0.85);
  x[RA_IDX.seqLenNorm] = rng();
  x[RA_IDX.oovRate] = rng() * 0.25;
  x[RA_IDX.wouldBind] = 0;
}

export function synthRa(n = 400, seed = 11): RaExample[] {
  const rng = mulberry32(seed);
  const out: RaExample[] = [];
  for (let i = 0; i < n; i++) {
    const x = new Float32Array(RA_IN);
    fillContext(rng, x);
    const cls = i % 4;
    if (cls === 2) {
      const mode = Math.floor(rng() * 3);
      if (mode === 0) x[RA_IDX.schemaValid] = 0;
      else if (mode === 1) x[RA_IDX.unknownCite] = 1;
      else x[RA_IDX.overstepLexicon] = 1;
    } else if (cls === 3) {
      x[RA_IDX.schemaValid] = 1;
      x[RA_IDX.overstepLexicon] = 0;
      x[RA_IDX.unknownCite] = 0;
      x[RA_IDX.approvalPresent] = 0;
      x[RA_IDX.wouldBind] = 1;
    } else if (cls === 1) {
      x[RA_IDX.schemaValid] = 1;
      x[RA_IDX.overstepLexicon] = 0;
      x[RA_IDX.unknownCite] = 0;
      x[RA_IDX.approvalPresent] = 1;
      x[RA_IDX.wouldBind] = 0;
      const mode = Math.floor(rng() * 3);
      if (mode === 0) x[RA_IDX.chainContinuous] = 0;
      else if (mode === 1) x[RA_IDX.digestMatch] = 0;
      else x[RA_IDX.khipuAbstain] = 1;
    } else {
      x[RA_IDX.schemaValid] = 1;
      x[RA_IDX.overstepLexicon] = 0;
      x[RA_IDX.unknownCite] = 0;
      x[RA_IDX.approvalPresent] = 1;
      x[RA_IDX.wouldBind] = 0;
      x[RA_IDX.chainContinuous] = 1;
      x[RA_IDX.digestMatch] = 1;
      x[RA_IDX.khipuAbstain] = 0;
    }
    out.push({ x, y: ruleCheck(x) });
  }
  return out;
}

export function initRa(seed: number): RaWeights {
  const rng = mulberry32(seed);
  const fill = (n: number, fan: number) => {
    const a = new Float32Array(n);
    const s = Math.sqrt(2 / fan);
    for (let i = 0; i < n; i++) a[i] = randn(rng) * s;
    return a;
  };
  return {
    W1: fill(RA_H1 * RA_IN, RA_IN),
    b1: new Float32Array(RA_H1),
    W2: fill(RA_H2 * RA_H1, RA_H1),
    b2: new Float32Array(RA_H2),
    W3: fill(RA_OUT * RA_H2, RA_H2),
    b3: new Float32Array(RA_OUT),
  };
}

function relu(v: number) {
  return v > 0 ? v : 0;
}

export function forwardRa(w: RaWeights, x: ArrayLike<number>) {
  const z1 = new Float32Array(RA_H1);
  const h1 = new Float32Array(RA_H1);
  for (let i = 0; i < RA_H1; i++) {
    let s = w.b1[i];
    for (let j = 0; j < RA_IN; j++) s += w.W1[i * RA_IN + j] * x[j];
    z1[i] = s;
    h1[i] = relu(s);
  }
  const z2 = new Float32Array(RA_H2);
  const h2 = new Float32Array(RA_H2);
  for (let i = 0; i < RA_H2; i++) {
    let s = w.b2[i];
    for (let j = 0; j < RA_H1; j++) s += w.W2[i * RA_H1 + j] * h1[j];
    z2[i] = s;
    h2[i] = relu(s);
  }
  const logits = new Float32Array(RA_OUT);
  for (let o = 0; o < RA_OUT; o++) {
    let s = w.b3[o];
    for (let j = 0; j < RA_H2; j++) s += w.W3[o * RA_H2 + j] * h2[j];
    logits[o] = s;
  }
  let m = logits[0];
  for (let o = 1; o < RA_OUT; o++) if (logits[o] > m) m = logits[o];
  const e = new Float32Array(RA_OUT);
  let z = 0;
  for (let o = 0; o < RA_OUT; o++) {
    e[o] = Math.exp(logits[o] - m);
    z += e[o];
  }
  const p = new Float32Array(RA_OUT);
  for (let o = 0; o < RA_OUT; o++) p[o] = e[o] / z;
  let pred: RaClass = 0;
  for (let o = 1; o < RA_OUT; o++) if (p[o] > p[pred]) pred = o as RaClass;
  return { z1, h1, z2, h2, logits, p, pred };
}

function nll(p: Float32Array, y: number) {
  return -Math.log(Math.max(p[y], 1e-9));
}

export function stepRa(w: RaWeights, batch: RaExample[], lr: number) {
  const gW1 = new Float32Array(w.W1.length);
  const gb1 = new Float32Array(RA_H1);
  const gW2 = new Float32Array(w.W2.length);
  const gb2 = new Float32Array(RA_H2);
  const gW3 = new Float32Array(w.W3.length);
  const gb3 = new Float32Array(RA_OUT);
  let loss = 0;
  for (const ex of batch) {
    const f = forwardRa(w, ex.x);
    const y = ruleCheck(ex.x);
    loss += nll(f.p, y);
    const dlog = new Float32Array(RA_OUT);
    for (let o = 0; o < RA_OUT; o++) dlog[o] = f.p[o];
    dlog[y] -= 1;
    for (let o = 0; o < RA_OUT; o++) {
      gb3[o] += dlog[o];
      for (let j = 0; j < RA_H2; j++) gW3[o * RA_H2 + j] += dlog[o] * f.h2[j];
    }
    const dh2 = new Float32Array(RA_H2);
    for (let j = 0; j < RA_H2; j++) {
      let s = 0;
      for (let o = 0; o < RA_OUT; o++) s += w.W3[o * RA_H2 + j] * dlog[o];
      dh2[j] = f.z2[j] > 0 ? s : 0;
    }
    for (let i = 0; i < RA_H2; i++) {
      gb2[i] += dh2[i];
      for (let j = 0; j < RA_H1; j++) gW2[i * RA_H1 + j] += dh2[i] * f.h1[j];
    }
    const dh1 = new Float32Array(RA_H1);
    for (let j = 0; j < RA_H1; j++) {
      let s = 0;
      for (let i = 0; i < RA_H2; i++) s += w.W2[i * RA_H1 + j] * dh2[i];
      dh1[j] = f.z1[j] > 0 ? s : 0;
    }
    for (let i = 0; i < RA_H1; i++) {
      gb1[i] += dh1[i];
      for (let j = 0; j < RA_IN; j++) gW1[i * RA_IN + j] += dh1[i] * ex.x[j];
    }
  }
  const n = batch.length;
  const apply = (p: Float32Array, g: Float32Array) => {
    for (let i = 0; i < p.length; i++) p[i] -= (lr * g[i]) / n;
  };
  apply(w.W1, gW1);
  apply(w.b1, gb1);
  apply(w.W2, gW2);
  apply(w.b2, gb2);
  apply(w.W3, gW3);
  apply(w.b3, gb3);
  return loss / n;
}

export function evalRa(w: RaWeights, data: RaExample[]) {
  let ok = 0;
  let loss = 0;
  for (const ex of data) {
    const f = forwardRa(w, ex.x);
    const gold = ruleCheck(ex.x);
    loss += nll(f.p, gold);
    if (f.pred === gold) ok++;
  }
  const n = data.length;
  return { agree: n ? ok / n : 0, loss: n ? loss / n : 0 };
}

export function finiteRa(w: RaWeights) {
  for (const arr of [w.W1, w.b1, w.W2, w.b2, w.W3, w.b3]) {
    for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) return false;
  }
  return true;
}

export function raBuffers(w: RaWeights): Record<string, Float32Array> {
  return { W1: w.W1, b1: w.b1, W2: w.W2, b2: w.b2, W3: w.W3, b3: w.b3 };
}

export function raFromBuffers(buffers: Record<string, Float32Array> | null | undefined): RaWeights | null {
  if (!buffers) return null;
  const { W1, b1, W2, b2, W3, b3 } = buffers;
  if (!W1 || !b1 || !W2 || !b2 || !W3 || !b3) return null;
  if (
    W1.length !== RA_H1 * RA_IN ||
    b1.length !== RA_H1 ||
    W2.length !== RA_H2 * RA_H1 ||
    b2.length !== RA_H2 ||
    W3.length !== RA_OUT * RA_H2 ||
    b3.length !== RA_OUT
  ) {
    return null;
  }
  return { W1, b1, W2, b2, W3, b3 };
}
