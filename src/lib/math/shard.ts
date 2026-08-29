import { mulberry32 } from "./tensor.ts";

/** RS(10,6) evaluation code over GF(257). CHECKED ≠ Lean F18 PROVEN.
 *  Recoverable iff ≥ 6 of 10 shards. Not RAID. Not a storage product. */

export const SHARD_N = 10;
export const SHARD_K = 6;
const P = 257;

export function gfAdd(a: number, b: number) {
  return (a + b) % P;
}
export function gfSub(a: number, b: number) {
  return (a - b + P) % P;
}
export function gfMul(a: number, b: number) {
  return (a * b) % P;
}
export function gfPow(a: number, exp: number) {
  let r = 1;
  let b = ((a % P) + P) % P;
  let e = exp;
  while (e > 0) {
    if (e & 1) r = (r * b) % P;
    b = (b * b) % P;
    e >>= 1;
  }
  return r;
}
export function gfInv(a: number) {
  const x = ((a % P) + P) % P;
  if (x === 0) return 0;
  return gfPow(x, P - 2);
}

function evalPoly(coeff: number[], x: number) {
  let y = 0;
  let p = 1;
  for (const c of coeff) {
    y = gfAdd(y, gfMul(c, p));
    p = gfMul(p, x);
  }
  return y;
}

export function encodeRs(data: number[]): number[] {
  return Array.from({ length: SHARD_N }, (_, i) => evalPoly(data, i + 1));
}

function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = -1;
    for (let r = col; r < n; r++) {
      if (M[r][col] !== 0) {
        piv = r;
        break;
      }
    }
    if (piv < 0) return null;
    if (piv !== col) {
      const tmp = M[col];
      M[col] = M[piv];
      M[piv] = tmp;
    }
    const inv = gfInv(M[col][col]);
    if (inv === 0) return null;
    for (let j = col; j <= n; j++) M[col][j] = gfMul(M[col][j], inv);
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let j = col; j <= n; j++) M[r][j] = gfSub(M[r][j], gfMul(f, M[col][j]));
    }
  }
  return M.map((row) => row[n]);
}

export function decodeRs(points: Array<{ x: number; y: number } | null>): number[] | null {
  const live = points.filter((p): p is { x: number; y: number } => p != null);
  if (live.length < SHARD_K) return null;
  const take = live.slice(0, SHARD_K);
  const A = take.map((p) => {
    const row: number[] = [];
    let pow = 1;
    for (let k = 0; k < SHARD_K; k++) {
      row.push(pow);
      pow = gfMul(pow, p.x);
    }
    return row;
  });
  return solve(A, take.map((p) => p.y));
}

export type ShardRun = {
  data: number[];
  code: number[];
  present: boolean[];
  live: number;
  recovered: number;
  decoded: number[] | null;
  singleton: number;
};

export function runShard(seed: number, mask = (1 << SHARD_N) - 1): ShardRun {
  const rng = mulberry32(seed);
  const data = Array.from({ length: SHARD_K }, () => (rng() * 256) | 0);
  const code = encodeRs(data);
  const present = Array.from({ length: SHARD_N }, (_, i) => Boolean(mask & (1 << i)));
  const points: Array<{ x: number; y: number } | null> = code.map((y, i) =>
    present[i] ? { x: i + 1, y } : null,
  );
  const live = present.filter(Boolean).length;
  const decoded = decodeRs(points);
  const match =
    decoded != null && decoded.length === SHARD_K && decoded.every((c, i) => c === data[i]);
  return {
    data,
    code,
    present,
    live,
    recovered: match ? 1 : 0,
    decoded,
    singleton: SHARD_N - SHARD_K + 1,
  };
}

export function toggleMask(mask: number, i: number) {
  return mask ^ (1 << i);
}

export function countLive(mask: number) {
  let n = 0;
  for (let i = 0; i < SHARD_N; i++) if (mask & (1 << i)) n += 1;
  return n;
}
