export type Attempt = { ok: boolean; ms: number };

export type LoopTax = {
  modelMs: number;
  peakAttemptMs: number;
  overheadMs: number | null;
  serializationTaxMs: number;
  deadHopMs: number;
  withinBudget: boolean;
  exit: "converged" | "budgetExhausted" | "aborted" | "error";
  honesty: {
    modelMs: "MEASURED";
    peakAttemptMs: "MEASURED";
    overheadMs: "DERIVED" | "UNAVAILABLE";
    serializationTaxMs: "DERIVED";
    deadHopMs: "DERIVED";
  };
};

export function loopTax(
  attempts: Attempt[],
  wallMs: number | null,
  maxBudget: number,
): LoopTax {
  const modelMs = attempts.reduce((s, a) => s + a.ms, 0);
  const peakAttemptMs = attempts.length ? Math.max(...attempts.map((a) => a.ms)) : 0;
  const overheadMs = wallMs == null ? null : Math.max(0, wallMs - modelMs);
  const serializationTaxMs = Math.max(0, modelMs - peakAttemptMs);
  let deadHopMs = 0;
  for (const a of attempts) {
    if (a.ok) break;
    deadHopMs += a.ms;
  }
  const steps = attempts.length;
  const withinBudget = steps <= maxBudget;
  const anyOk = attempts.some((a) => a.ok);
  const exit = !withinBudget
    ? "budgetExhausted"
    : anyOk
      ? "converged"
      : "aborted";
  return {
    modelMs,
    peakAttemptMs,
    overheadMs,
    serializationTaxMs,
    deadHopMs,
    withinBudget,
    exit,
    honesty: {
      modelMs: "MEASURED",
      peakAttemptMs: "MEASURED",
      overheadMs: wallMs == null ? "UNAVAILABLE" : "DERIVED",
      serializationTaxMs: "DERIVED",
      deadHopMs: "DERIVED",
    },
  };
}

/** Selfcheck arithmetic from szl-ouroboros: attempts [220 fail, 900 ok], wall=1300. */
export const OUROBOROS_SELFCHECK = loopTax(
  [
    { ok: false, ms: 220 },
    { ok: true, ms: 900 },
  ],
  1300,
  4,
);
