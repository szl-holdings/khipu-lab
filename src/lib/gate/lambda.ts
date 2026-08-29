import type { Bound, LambdaResult, Receipt, Verdict } from "@/lib/types";
import { verifyReceipt } from "@/lib/crypto/receipt";
import { DOCTRINE } from "@/lib/szl/doctrine";

export async function runGate(opts: {
  receipt: Receipt;
  bound: Bound;
  ledgerHead: string | null;
  finite: boolean;
  pinOk: boolean;
}): Promise<LambdaResult> {
  const checks: LambdaResult["checks"] = [];
  const metrics = opts.receipt.metrics;
  const allFinite =
    opts.finite &&
    Object.values(metrics).every((v) => Number.isFinite(v));
  checks.push({
    id: "finite",
    ok: allFinite,
    detail: allFinite ? "metrics finite" : "NaN/Inf in metrics or weights",
  });
  checks.push({
    id: "pin",
    ok: opts.pinOk,
    detail: opts.pinOk ? `${opts.receipt.subject.id}@${opts.receipt.subject.version}` : "subject pin mismatch",
  });
  const hashed = await verifyReceipt(opts.receipt);
  checks.push({
    id: "receipt",
    ok: hashed,
    detail: hashed ? "sha256(canonical) matches" : "digest mismatch",
  });
  const chainOk =
    opts.ledgerHead === null
      ? opts.receipt.prevSha256 === null
      : opts.receipt.prevSha256 === opts.ledgerHead;
  checks.push({
    id: "chain",
    ok: chainOk,
    detail: chainOk ? "prev matches ledger head" : "chain break",
  });
  const seedOk = Number.isFinite(opts.receipt.seed);
  checks.push({
    id: "seed",
    ok: seedOk,
    detail: seedOk ? `seed ${opts.receipt.seed}` : "seed missing",
  });

  const metric = metrics[opts.bound.metric];
  const eps = opts.bound.epsilon;
  let ratio = Infinity;
  let boundOk = false;
  if (Number.isFinite(metric) && eps > 0) {
    ratio = opts.bound.direction === "lte" ? metric / eps : eps / Math.max(metric, 1e-12);
    boundOk = opts.bound.direction === "lte" ? metric <= eps : metric >= eps;
  } else if (Number.isFinite(metric) && eps === 0) {
    ratio = Math.abs(metric) < 1e-12 ? 0 : Infinity;
    boundOk = Math.abs(metric) < 1e-12;
  }
  checks.push({
    id: "bound",
    ok: Number.isFinite(metric),
    detail: `${opts.bound.metric}=${Number.isFinite(metric) ? metric.toExponential(3) : "∅"} ε=${eps}`,
  });

  const failed = checks.find((c) => !c.ok);
  if (failed || !boundOk || ratio > 10) {
    return {
      verdict: "blocked",
      lambda: ratio,
      checks,
      reason: failed?.detail ?? (boundOk ? `λ=${ratio.toFixed(2)} > 10` : "bound missed"),
      honesty: "LIVE",
    };
  }
  const verdict: Verdict = ratio <= 1 ? "proved" : "conjecture";
  return {
    verdict,
    lambda: ratio,
    checks,
    reason:
      verdict === "proved"
        ? `λ=${ratio.toFixed(3)} ≤ 1 · advisory only · Conjecture 1 OPEN · proven_trust=${DOCTRINE.provenTrust}`
        : `λ=${ratio.toFixed(3)} in (1,10] · conjecture band`,
    honesty: "ADVISORY",
  };
}
