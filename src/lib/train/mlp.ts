import { mulberry32, randn } from "@/lib/math/tensor";
import { twoMoons, type Point } from "./datasets";

export type MlpWeights = {
  W1: Float32Array;
  b1: Float32Array;
  W2: Float32Array;
  b2: Float32Array;
};

const H = 8;
const IN = 2;
const OUT = 2;

export function initMlp(seed: number): MlpWeights {
  const rng = mulberry32(seed);
  const xavier = (fan: number) => Math.sqrt(2 / fan);
  const fill = (n: number, fan: number) => {
    const a = new Float32Array(n);
    const s = xavier(fan);
    for (let i = 0; i < n; i++) a[i] = randn(rng) * s;
    return a;
  };
  return {
    W1: fill(H * IN, IN),
    b1: new Float32Array(H),
    W2: fill(OUT * H, H),
    b2: new Float32Array(OUT),
  };
}

function tanhArr(x: Float32Array) {
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = Math.tanh(x[i]);
  return y;
}

export function forwardMlp(w: MlpWeights, x: number, y: number) {
  const h = new Float32Array(H);
  for (let i = 0; i < H; i++) h[i] = w.W1[i * IN] * x + w.W1[i * IN + 1] * y + w.b1[i];
  const ht = tanhArr(h);
  const logits = new Float32Array(OUT);
  for (let o = 0; o < OUT; o++) {
    let s = w.b2[o];
    for (let i = 0; i < H; i++) s += w.W2[o * H + i] * ht[i];
    logits[o] = s;
  }
  const m = Math.max(logits[0], logits[1]);
  const e0 = Math.exp(logits[0] - m);
  const e1 = Math.exp(logits[1] - m);
  const z = e0 + e1;
  const p = [e0 / z, e1 / z];
  return { h, ht, logits, p };
}

export function nll(p: number[], label: number) {
  return -Math.log(Math.max(p[label], 1e-9));
}

export function stepMlp(w: MlpWeights, batch: Point[], lr: number) {
  const gW1 = new Float32Array(H * IN);
  const gb1 = new Float32Array(H);
  const gW2 = new Float32Array(OUT * H);
  const gb2 = new Float32Array(OUT);
  let loss = 0;
  for (const pt of batch) {
    const f = forwardMlp(w, pt.x, pt.y);
    loss += nll(f.p, pt.yLabel);
    const dlog = [f.p[0], f.p[1]];
    dlog[pt.yLabel] -= 1;
    for (let o = 0; o < OUT; o++) {
      gb2[o] += dlog[o];
      for (let i = 0; i < H; i++) gW2[o * H + i] += dlog[o] * f.ht[i];
    }
    const dh = new Float32Array(H);
    for (let i = 0; i < H; i++) {
      let s = 0;
      for (let o = 0; o < OUT; o++) s += w.W2[o * H + i] * dlog[o];
      dh[i] = s * (1 - f.ht[i] * f.ht[i]);
    }
    for (let i = 0; i < H; i++) {
      gb1[i] += dh[i];
      gW1[i * IN] += dh[i] * pt.x;
      gW1[i * IN + 1] += dh[i] * pt.y;
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
  return loss / n;
}

export function finiteWeights(w: MlpWeights) {
  for (const arr of [w.W1, w.b1, w.W2, w.b2]) {
    for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) return false;
  }
  return true;
}

export function accuracy(w: MlpWeights, data: Point[]) {
  let ok = 0;
  for (const pt of data) {
    const f = forwardMlp(w, pt.x, pt.y);
    if ((f.p[1] > f.p[0] ? 1 : 0) === pt.yLabel) ok++;
  }
  return ok / data.length;
}

export { twoMoons, H as MLP_HIDDEN };
