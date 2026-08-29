import { useState } from "react";
import { PLAYS, type PlaySlug } from "@/lib/types";
import { Panel } from "@/components/ui/primitives";
import { useLab, ledgerHead } from "@/store/lab";
import { runPlay } from "@/lib/run/execute";
import { mintReceipt } from "@/lib/crypto/receipt";
import { runGate } from "@/lib/gate/lambda";
import { KhipuCord, VerdictBadge } from "@/components/receipt/khipu-cord";
import { AttnLab } from "./attn-lab";
import { YarqaLab } from "./yarqa-lab";
import { LambdaLab } from "./lambda-lab";
import { FormulaLab } from "./formula-lab";
import { MoonsLab } from "./moons-lab";
import { KhipuLab } from "./khipu-lab";
import { FrontierLab } from "./frontier-lab";
import { NormLab } from "./norm-lab";
import { AnatomyLab } from "./anatomy-lab";
import { frontierForSubject } from "@/lib/catalog/plays";

export function LabStage({ play, cut }: { play: PlaySlug; cut?: string }) {
  const meta = PLAYS.find((p) => p.slug === play) ?? PLAYS[0];
  const { pushReceipt, beatFrontier, setRunning, running, rememberPlay } = useLab();
  const [seed, setSeed] = useState(11);
  const [note, setNote] = useState(meta.blurb);
  const [lastId, setLastId] = useState<string | null>(null);
  const last = useLab((s) => s.receipts.find((r) => r.id === lastId) ?? s.receipts[0]);

  async function mintFromMetrics(
    face: ReturnType<typeof runPlay>,
    finite = true,
  ) {
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
    pushReceipt(receipt);
    setLastId(receipt.id);
    setNote(face.note);
    const fid = frontierForSubject(face.subjectId);
    if (fid) {
      const metric = face.metrics[face.boundMetric];
      beatFrontier(fid, metric, receipt.id, lambda.verdict);
    }
    return { receipt, face };
  }

  async function runKernel(params: Record<string, number> = {}) {
    rememberPlay(play);
    setRunning(true);
    try {
      const face = runPlay(play, seed, params);
      await mintFromMetrics(face);
      return face;
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {meta.kind} · {meta.slug}
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">{meta.quechua}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{meta.blurb}</p>
        </div>
        <label className="text-xs text-muted">
          seed
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className="ml-2 h-11 w-24 rounded-sm border border-border bg-elevated px-2 font-mono text-sm text-fg"
          />
        </label>
      </div>

      {play === "attn" && <AttnLab seed={seed} running={running} onRun={runKernel} cut={cut} />}
      {play === "yarqa" && <YarqaLab seed={seed} running={running} onRun={runKernel} />}
      {play === "lambda" && <LambdaLab seed={seed} running={running} onRun={runKernel} />}
      {play === "norm" && <NormLab seed={seed} running={running} onRun={runKernel} />}
      {play === "formula" && <FormulaLab seed={seed} running={running} onRun={runKernel} />}
      {play === "frontier" && (
        <FrontierLab seed={seed} running={running} onRun={runKernel} cut={cut} />
      )}
      {play === "anatomy" && <AnatomyLab seed={seed} running={running} onRun={runKernel} />}
      {play === "moons" && (
        <MoonsLab seed={seed} running={running} setRunning={setRunning} mint={mintFromMetrics} />
      )}
      {play === "khipu" && (
        <KhipuLab seed={seed} running={running} setRunning={setRunning} mint={mintFromMetrics} />
      )}

      {last && last.subject && (
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={last.lambda.verdict} />
            <span className="font-mono text-xs text-muted">{last.id}</span>
            <span className="text-xs text-subtle">{note}</span>
          </div>
          <KhipuCord hex={last.sha256} verdict={last.lambda.verdict} className="mt-3" />
          <ul className="mt-3 grid gap-1 font-mono text-[11px] text-muted">
            {last.lambda.checks.map((c) => (
              <li key={c.id} className={c.ok ? "text-live" : "text-blocked"}>
                {c.ok ? "hold" : "fail"} · {c.id} · {c.detail}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{last.lambda.reason}</p>
        </Panel>
      )}
    </div>
  );
}
