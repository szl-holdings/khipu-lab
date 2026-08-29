import type { Mat, Vec } from "./tensor.ts";

export type NormResult = {
  y: Mat;
  rms: Vec;
  unitRms: number;
};

export function rmsNorm(x: Mat, gamma: Vec, eps = 1e-5): NormResult {
  const d = x[0].length;
  const y: Mat = [];
  const rms: Vec = [];
  let worst = 0;
  for (const row of x) {
    let ms = 0;
    for (let i = 0; i < d; i++) ms += row[i] * row[i];
    const r = Math.sqrt(ms / d + eps);
    rms.push(r);
    const out = row.map((v, i) => (v / r) * gamma[i]);
    y.push(out);
    let ms2 = 0;
    for (let i = 0; i < d; i++) {
      const u = out[i] / (gamma[i] || 1);
      ms2 += u * u;
    }
    worst = Math.max(worst, Math.abs(Math.sqrt(ms2 / d) - 1));
  }
  return { y, rms, unitRms: worst };
}

export function blockKvGather(
  pages: Mat,
  table: number[],
): { gathered: Mat; tableDigestSeed: string } {
  const gathered = table.map((idx) => pages[idx] ?? pages[0]);
  return { gathered, tableDigestSeed: table.join(",") };
}
