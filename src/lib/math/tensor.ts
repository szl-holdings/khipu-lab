export type Mat = number[][];
export type Vec = number[];

export function zeros(r: number, c: number): Mat {
  return Array.from({ length: r }, () => Array(c).fill(0));
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number) {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function matmul(a: Mat, b: Mat): Mat {
  const n = a.length;
  const m = b[0].length;
  const k = b.length;
  const out = zeros(n, m);
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < k; t++) {
      const aik = a[i][t];
      for (let j = 0; j < m; j++) out[i][j] += aik * b[t][j];
    }
  }
  return out;
}

export function transpose(a: Mat): Mat {
  const n = a.length;
  const m = a[0].length;
  const out = zeros(m, n);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) out[j][i] = a[i][j];
  return out;
}

export function add(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function scale(a: Mat, s: number): Mat {
  return a.map((row) => row.map((v) => v * s));
}

export function maxAbs(a: Mat): number {
  let m = 0;
  for (const row of a) for (const v of row) m = Math.max(m, Math.abs(v));
  return m;
}

export function frobenius(a: Mat): number {
  let s = 0;
  for (const row of a) for (const v of row) s += v * v;
  return Math.sqrt(s);
}

export function softmaxRow(row: Vec): Vec {
  const m = Math.max(...row);
  const ex = row.map((v) => Math.exp(v - m));
  const z = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / z);
}

export function softmax(a: Mat): Mat {
  return a.map(softmaxRow);
}

export function dot(u: Vec, v: Vec): number {
  let s = 0;
  for (let i = 0; i < u.length; i++) s += u[i] * v[i];
  return s;
}

export function norm2(u: Vec): number {
  return Math.sqrt(dot(u, u));
}

export function randomMat(r: number, c: number, seed: number, scaleN = 0.4): Mat {
  const rng = mulberry32(seed);
  return Array.from({ length: r }, () =>
    Array.from({ length: c }, () => (rng() * 2 - 1) * scaleN),
  );
}
