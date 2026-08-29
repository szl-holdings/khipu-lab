/** MiniEmbed-Nano silhouette. Hash+table L2. Not neural. Not 3290×128. */

import { mulberry32, randn } from "../math/tensor.ts";

export const EMBED_V = 64;
export const EMBED_D = 12;

export const TOKS = [
  "F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22",
  "YARQA", "YUYAY", "WILLAY", "ARI", "CHASKI", "AYNI", "KHIPU", "NAN",
];

export type EmbedTable = { E: Float32Array; toks: string[] };

export function embedToks(): string[] {
  return Array.from({ length: EMBED_V }, (_, i) => TOKS[i] ?? `t${i}`);
}

export function buildEmbed(seed: number): EmbedTable {
  const rng = mulberry32(seed);
  const E = new Float32Array(EMBED_V * EMBED_D);
  for (let i = 0; i < E.length; i++) E[i] = randn(rng) * 0.15;
  return { E, toks: embedToks() };
}

export function embedFromBuffers(buffers?: Record<string, Float32Array> | null): EmbedTable | null {
  const E = buffers?.E;
  if (!E || E.length !== EMBED_V * EMBED_D) return null;
  return { E, toks: embedToks() };
}

function row(E: Float32Array, i: number) {
  return E.subarray(i * EMBED_D, (i + 1) * EMBED_D);
}

function l2(a: ArrayLike<number>, b: ArrayLike<number>) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export function nearest(table: EmbedTable, query: string, k = 3) {
  const q = query.toUpperCase();
  let idx = table.toks.findIndex((t) => t === q);
  if (idx < 0) {
    let h = 0;
    for (let i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) | 0;
    idx = Math.abs(h) % EMBED_V;
  }
  const qv = row(table.E, idx);
  const scored = table.toks.map((tok, i) => ({ tok, dist: l2(qv, row(table.E, i)) }));
  scored.sort((a, b) => a.dist - b.dist);
  return { query: table.toks[idx], hits: scored.slice(0, k) };
}

export function embedReplay(table: EmbedTable) {
  let ok = 0;
  for (let i = 0; i < 16; i++) {
    const nn = nearest(table, table.toks[i], 1);
    if (nn.hits[0]?.tok === table.toks[i]) ok += 1;
  }
  return { replay: ok / 16, n: 16 };
}
