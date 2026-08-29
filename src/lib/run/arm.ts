import { mintReceipt } from "@/lib/crypto/receipt";
import { runGate } from "@/lib/gate/lambda";
import type { PlaySlug, Receipt } from "@/lib/types";
import { ledgerHead, useLab } from "@/store/lab";
import type { RunFace } from "@/lib/run/execute";
import { frontierForSubject, NAN_CUT } from "@/lib/catalog/plays";

/** Kernel plays armed from Tinkuy. Moons / TinyKhipu stay user-initiated. */
export const ARM_JOBS: Array<{ play: PlaySlug; params?: Record<string, number> }> = [
  { play: "attn" },
  { play: "yarqa" },
  { play: "lambda" },
  { play: "norm" },
  { play: "formula" },
  { play: "frontier", params: { allow: 1, lambdaPass: 1 } },
  { play: "frontier", params: { cut: NAN_CUT.chaski } },
  { play: "frontier", params: { cut: NAN_CUT.ayni } },
  { play: "frontier", params: { cut: NAN_CUT.shard } },
  { play: "frontier", params: { cut: NAN_CUT.bay } },
  { play: "anatomy" },
];

export const ARM_PLAYS: PlaySlug[] = [...new Set(ARM_JOBS.map((j) => j.play))];

export const ARM_SEED = 11;

export type ArmRow = {
  play: string;
  residual?: number;
  verdictNote: string;
};

function yieldPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

/** Same mint flow as lab-stage: receipt → Λ gate → ledger → optional frontier beat. */
export async function mintFromMetrics(
  play: PlaySlug,
  face: RunFace,
  seed: number,
  finite = true,
): Promise<{ receipt: Receipt; face: RunFace }> {
  const placeholder = {
    verdict: "blocked" as const,
    lambda: Infinity,
    checks: [],
    reason: "pending",
    honesty: "LIVE" as const,
  };
  const receipt = await mintReceipt({
    kind: face.kind,
    id: face.subjectId,
    version: face.version,
    seed,
    metrics: face.metrics,
    lambda: placeholder,
    prevSha256: ledgerHead(),
  });
  const lambda = await runGate({
    receipt,
    bound: {
      metric: face.boundMetric,
      epsilon: face.boundEps,
      direction: face.direction,
    },
    ledgerHead: ledgerHead(),
    finite,
    pinOk: true,
  });
  receipt.lambda = lambda;
  const { pushReceipt, beatFrontier } = useLab.getState();
  pushReceipt(receipt);
  const fid = frontierForSubject(face.subjectId);
  if (fid) {
    const metric = face.metrics[face.boundMetric];
    beatFrontier(fid, metric, receipt.id, lambda.verdict);
  }
  return { receipt, face };
}

export async function armEstate(opts: {
  mint: (play: PlaySlug, face: RunFace) => Promise<void>;
  runPlay: typeof import("@/lib/run/execute").runPlay;
}): Promise<ArmRow[]> {
  const { mint, runPlay } = opts;
  const summary: ArmRow[] = [];

  for (const job of ARM_JOBS) {
    await yieldPaint();
    const face = runPlay(job.play, ARM_SEED, job.params);
    await mint(job.play, face);
    const residual =
      typeof face.metrics.residual === "number"
        ? face.metrics.residual
        : typeof face.metrics.worstResidual === "number"
          ? face.metrics.worstResidual
          : typeof face.metrics.broken === "number"
            ? face.metrics.broken
            : typeof face.metrics.leak === "number"
              ? face.metrics.leak
              : typeof face.metrics.recovered === "number"
                ? face.metrics.recovered
                : undefined;
    summary.push({
      play: job.play,
      residual,
      verdictNote: face.note,
    });
    await yieldPaint();
  }

  return summary;
}