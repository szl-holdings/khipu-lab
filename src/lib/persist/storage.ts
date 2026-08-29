import type { Frontier, Receipt } from "@/lib/types";

const LEDGER = "szl.khipu.v1.ledger";
const FRONTIERS = "szl.khipu.v1.frontiers";
const UI = "szl.khipu.v1.ui";
const WEIGHTS = "szl.khipu.v1.weights.";

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadLedger(): Receipt[] {
  return read<Receipt[]>(LEDGER, []).slice(0, 80);
}

export function saveLedger(rows: Receipt[]) {
  write(LEDGER, rows.slice(0, 80));
}

export function loadFrontiers(): Frontier[] {
  return read<Frontier[]>(FRONTIERS, []);
}

export function mergeFrontiers(stored: Frontier[], defaults: Frontier[]): Frontier[] {
  if (!stored.length) return defaults.map((d) => ({ ...d }));
  const map = new Map(stored.map((f) => [f.id, f]));
  return defaults.map((d) => {
    const s = map.get(d.id);
    if (!s) return { ...d };
    return {
      ...d,
      best: s.best,
      receiptId: s.receiptId,
      attempts: s.attempts,
      beatenAt: s.beatenAt,
    };
  });
}

export function saveFrontiers(rows: Frontier[]) {
  write(FRONTIERS, rows);
}

export type WeightBlob = {
  seed: number;
  steps: number;
  loss: number;
  f32b64: string;
};

export function saveWeights(id: string, blob: WeightBlob) {
  write(WEIGHTS + id, blob);
}

export function loadWeights(id: string): WeightBlob | null {
  return read<WeightBlob | null>(WEIGHTS + id, null);
}

export function loadUi() {
  return read<{ play?: string; ledger?: boolean }>(UI, {});
}

export function saveUi(ui: { play?: string; ledger?: boolean }) {
  write(UI, ui);
}

export function f32ToB64(a: Float32Array) {
  const bytes = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64ToF32(s: string) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}
