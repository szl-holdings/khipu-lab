export type Receipt = {
  seq: number;
  op: string;
  kernel: string;
  payload: Record<string, unknown>;
  digest: string;
  prev: string;
  alg: "SHA-256";
  note: string;
};

export const ZERO = "0".repeat(64);

export const DIGEST_NOTE =
  "Browser SubtleCrypto SHA-256. Production kernels use SHA3-256. Same receipt shape, different digest alg — labeled, not faked.";

export function canon(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canon).join(",")}]`;
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canon(rec[k])}`).join(",")}}`;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function shortHex(hex: string, n = 10) {
  return hex.slice(0, n);
}

export async function receiptDigest(body: Omit<Receipt, "digest">): Promise<string> {
  return sha256Hex(canon(body));
}

export async function verifyChain(receipts: Receipt[]): Promise<{
  ok: boolean;
  depth: number;
  firstBreak: number;
}> {
  let prev = ZERO;
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    if (r.prev !== prev) return { ok: false, depth: receipts.length, firstBreak: i };
    const { digest: _d, ...rest } = r;
    const expect = await receiptDigest(rest);
    if (expect !== r.digest) return { ok: false, depth: receipts.length, firstBreak: i };
    prev = r.digest;
  }
  return { ok: true, depth: receipts.length, firstBreak: -1 };
}
