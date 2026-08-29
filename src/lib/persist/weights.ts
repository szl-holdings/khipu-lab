export const WEIGHTS_PREFIX = "szl.khipu.v1.weights.";

export type WeightRecord = {
  seed: number;
  steps: number;
  loss: number;
  buffers: Record<string, Float32Array>;
};

type StoredRecord = {
  seed: number;
  steps: number;
  loss: number;
  buffers: Record<string, string>;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = window.localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

function f32ToB64(a: Float32Array): string {
  const buf = a.buffer.slice(a.byteOffset, a.byteOffset + a.byteLength);
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToF32(s: string): Float32Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

export function saveWeights(id: string, blob: WeightRecord) {
  const ls = storage();
  if (!ls) return;
  try {
    const stored: StoredRecord = {
      seed: blob.seed,
      steps: blob.steps,
      loss: blob.loss,
      buffers: {},
    };
    for (const [k, v] of Object.entries(blob.buffers)) {
      stored.buffers[k] = f32ToB64(v);
    }
    ls.setItem(WEIGHTS_PREFIX + id, JSON.stringify(stored));
  } catch {
    /* quota / private mode */
  }
}

export function loadWeights(id: string): WeightRecord | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(WEIGHTS_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRecord;
    if (!parsed || typeof parsed !== "object" || !parsed.buffers) return null;
    const buffers: Record<string, Float32Array> = {};
    for (const [k, v] of Object.entries(parsed.buffers)) {
      if (typeof v !== "string") return null;
      buffers[k] = b64ToF32(v);
    }
    return {
      seed: Number(parsed.seed) || 0,
      steps: Number(parsed.steps) || 0,
      loss: Number(parsed.loss) || 0,
      buffers,
    };
  } catch {
    return null;
  }
}
