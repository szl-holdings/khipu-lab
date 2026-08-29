import { YUYAY_AXES, YUYAY_FLOORS } from "../szl/doctrine.ts";

export type LambdaEval = {
  value: number;
  blocked: boolean;
  reason: string;
  axioms: { id: string; ok: boolean; detail: string }[];
};

function isFiniteNonneg(x: number) {
  return Number.isFinite(x) && x >= 0;
}

/** Weighted geometric mean. Any 0 or non-finite axis → 0 (fail-closed). */
export function wgm(x: number[], w: number[]): number {
  if (x.length !== w.length || x.length === 0) return 0;
  const wsum = w.reduce((a, b) => a + b, 0);
  if (!(Math.abs(wsum - 1) < 1e-9)) return 0;
  for (let i = 0; i < x.length; i++) {
    if (!isFiniteNonneg(x[i]) || !isFiniteNonneg(w[i])) return 0;
    if (x[i] === 0) return 0;
  }
  let log = 0;
  for (let i = 0; i < x.length; i++) log += w[i] * Math.log(x[i]);
  const v = Math.exp(log);
  return Number.isFinite(v) ? v : 0;
}

export function uniformWeights(n: number): number[] {
  return Array.from({ length: n }, () => 1 / n);
}

export function yuyayWeights(): number[] {
  return uniformWeights(YUYAY_AXES.length);
}

/** A1 monotone: raising one axis cannot decrease Λ. */
export function checkA1(x: number[], w: number[]): boolean {
  const base = wgm(x, w);
  for (let i = 0; i < x.length; i++) {
    if (x[i] >= 1) continue;
    const y = x.slice();
    y[i] = Math.min(1, x[i] + 0.05);
    if (wgm(y, w) + 1e-12 < base) return false;
  }
  return true;
}

/** A2 homogeneous: Λ(c x) = c Λ(x) for c in (0,1], x already in (0,1]. */
export function checkA2(x: number[], w: number[], c = 0.5): boolean {
  const cx = x.map((v) => v * c);
  const lhs = wgm(cx, w);
  const rhs = c * wgm(x, w);
  return Math.abs(lhs - rhs) <= 1e-9 * Math.max(1, Math.abs(rhs));
}

/** A3 Egyptian-exact: Λ(c,…,c) = c */
export function checkA3(w: number[], c = 0.7): boolean {
  const x = w.map(() => c);
  return Math.abs(wgm(x, w) - c) <= 1e-9;
}

/** A4 bounded by max */
export function checkA4(x: number[], w: number[]): boolean {
  const v = wgm(x, w);
  const m = Math.max(...x);
  return v <= m + 1e-12;
}

/** A5 permutation invariance */
export function checkA5(x: number[], w: number[]): boolean {
  const n = x.length;
  if (n < 2) return true;
  const perm = [...Array(n).keys()].reverse();
  const xp = perm.map((i) => x[i]);
  const wp = perm.map((i) => w[i]);
  return Math.abs(wgm(xp, wp) - wgm(x, w)) <= 1e-9;
}

export function evaluateLambda(
  x: number[],
  w = yuyayWeights(),
): LambdaEval {
  const value = wgm(x, w);
  const axioms = [
    { id: "A1", ok: checkA1(x, w), detail: "monotone" },
    { id: "A2", ok: checkA2(x, w), detail: "homogeneous" },
    { id: "A3", ok: checkA3(w), detail: "Egyptian-exact" },
    { id: "A4", ok: checkA4(x, w), detail: "bounded-by-max" },
    { id: "A5", ok: checkA5(x, w), detail: "permutation-invariant" },
  ];
  const blocked = value === 0 || axioms.some((a) => !a.ok);
  const reason = blocked
    ? value === 0
      ? "zero-routed or non-finite axis"
      : `axiom ${axioms.find((a) => !a.ok)?.id} failed`
    : "advisory pass — uniqueness remains Conjecture 1 OPEN";
  return { value, blocked, reason, axioms };
}

export function defaultYuyay(): number[] {
  return YUYAY_FLOORS.map((f) => f);
}

export { YUYAY_AXES, YUYAY_FLOORS };
