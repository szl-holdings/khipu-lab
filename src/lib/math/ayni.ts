import { mulberry32, randomMat } from "./tensor.ts";

/** Residual-bus reciprocity. F11 silhouette: Σ(out − in − F) = 0.
 *  A silent skip leak cannot pass. Not a ResNet rehost. No ImageNet claim. */

export type AyniRun = {
  leak: number;
  mass: number;
  dim: number;
  xin: number[];
  force: number[];
  xout: number[];
  residual: number[];
};

function tanhVec(z: number[]): number[] {
  return z.map((v) => Math.tanh(v));
}

export function runAyni(seed: number, leak = 0): AyniRun {
  const dim = 8;
  const xin = randomMat(1, dim, seed, 0.85)[0];
  const W = randomMat(dim, dim, seed + 7, 0.35);
  const bias = Array.from({ length: dim }, (_, i) => (mulberry32(seed + 19 + i)() - 0.5) * 0.05);
  const z = Array.from({ length: dim }, (_, i) => {
    let s = bias[i];
    for (let j = 0; j < dim; j++) s += W[i][j] * xin[j];
    return s;
  });
  const force = tanhVec(z);
  const skip = leak === 1 ? 0.62 : 1;
  const xout = xin.map((v, i) => v + skip * force[i]);
  const residual = xout.map((o, i) => o - xin[i] - force[i]);
  let leakMax = 0;
  let mass = 0;
  for (let i = 0; i < dim; i++) {
    leakMax = Math.max(leakMax, Math.abs(residual[i]));
    mass += residual[i];
  }
  return {
    leak: leakMax,
    mass: Math.abs(mass),
    dim,
    xin,
    force,
    xout,
    residual,
  };
}
