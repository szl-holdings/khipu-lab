import type { LambdaResult, Receipt, SubjectKind } from "@/lib/types";
import { canon, sha256Hex, shortHex } from "@/lib/atlas/crypto";

export { canon, sha256Hex, shortHex };

export function floats8(metrics: Record<string, number>) {
  const out: Record<string, number> = {};
  for (const k of Object.keys(metrics).sort()) {
    const v = metrics[k];
    out[k] = Number.isFinite(v) ? Number(v.toFixed(8)) : v;
  }
  return out;
}

export async function mintReceipt(input: {
  kind: SubjectKind;
  id: string;
  version: number;
  seed: number;
  metrics: Record<string, number>;
  lambda: LambdaResult;
  prevSha256: string | null;
  ts?: number;
}): Promise<Receipt> {
  const ts = input.ts ?? Date.now();
  const body = {
    subject: { kind: input.kind, id: input.id, version: input.version },
    seed: input.seed,
    metrics: floats8(input.metrics),
    prevSha256: input.prevSha256,
    ts,
  };
  const canonical = canon(body);
  const sha = await sha256Hex(canonical);
  return {
    id: `r.${sha.slice(0, 12)}`,
    ts,
    subject: body.subject,
    seed: input.seed,
    canonical,
    sha256: sha,
    prevSha256: input.prevSha256,
    metrics: body.metrics,
    lambda: input.lambda,
  };
}

export async function verifyReceipt(r: Receipt): Promise<boolean> {
  const body = {
    subject: r.subject,
    seed: r.seed,
    metrics: floats8(r.metrics),
    prevSha256: r.prevSha256,
    ts: r.ts,
  };
  return (await sha256Hex(canon(body))) === r.sha256;
}
