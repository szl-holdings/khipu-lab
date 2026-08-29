import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import {
  evalKhipu,
  initKhipu,
  stepKhipu,
  synthKhipu,
  KHIPU_V,
  KHIPU_D,
  type KhipuWeights,
} from "@/lib/train/khipu";
import {
  evalRa,
  finiteRa,
  initRa,
  raBuffers,
  raFromBuffers,
  stepRa,
  synthRa,
} from "@/lib/train/receipt-agent";
import { loadWeights, saveWeights } from "@/lib/persist/weights";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";

function khipuFromBuffers(buffers?: Record<string, Float32Array> | null): KhipuWeights | null {
  if (!buffers) return null;
  const { E, W, b, Wc } = buffers;
  if (!E || !W || !b || !Wc) return null;
  if (E.length !== KHIPU_V * KHIPU_D || W.length !== 2 * KHIPU_D || b.length !== 2 || Wc.length !== KHIPU_D) {
    return null;
  }
  return { E, W, b, Wc };
}

function take<T>(arr: T[], start: number, size: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < size; i++) out.push(arr[(start + i) % arr.length]);
  return out;
}

export function KhipuLab({
  seed,
  running,
  setRunning,
  mint,
}: {
  seed: number;
  running: boolean;
  setRunning: (v: boolean) => void;
  mint: (face: RunFace, finite?: boolean) => Promise<unknown>;
}) {
  const [loss, setLoss] = useState<number[]>([]);
  const [stats, setStats] = useState({ planValid: 0, abstain: 0, hallucinated: 0 });
  const [khipuReloaded, setKhipuReloaded] = useState(false);
  const [raLoss, setRaLoss] = useState<number[]>([]);
  const [raAgree, setRaAgree] = useState(0);
  const [raSteps, setRaSteps] = useState(0);
  const [raReloaded, setRaReloaded] = useState(false);

  useEffect(() => {
    const saved = loadWeights("m.khipu");
    const w = khipuFromBuffers(saved?.buffers);
    if (saved && w) {
      const data = synthKhipu(80, saved.seed);
      setStats(evalKhipu(w, data.slice(64)));
      setLoss([saved.loss]);
      setKhipuReloaded(true);
    }
    const ra = loadWeights("m.ra");
    const rw = raFromBuffers(ra?.buffers);
    if (ra && rw) {
      const data = synthRa(400, ra.seed);
      const ev = evalRa(rw, data.slice(320));
      setRaAgree(ev.agree);
      setRaLoss([ra.loss]);
      setRaSteps(ra.steps);
      setRaReloaded(true);
    }
  }, []);

  async function train() {
    setRunning(true);
    setKhipuReloaded(false);
    try {
      const data = synthKhipu(80, seed);
      const held = data.slice(64);
      const trainSet = data.slice(0, 64);
      const w = initKhipu(seed);
      const hist: number[] = [];
      const total = 280;
      for (let s = 0; s < total; s++) {
        const start = (s * 8) % 56;
        const batch = trainSet.slice(start, start + 8);
        const L = stepKhipu(w, batch, 0.08);
        if (s % 10 === 0) {
          hist.push(L);
          setLoss(hist.slice());
          setStats(evalKhipu(w, held));
          await new Promise((r) => requestAnimationFrame(r));
        }
      }
      const ev = evalKhipu(w, held);
      setStats(ev);
      const finalLoss = hist[hist.length - 1] ?? 1;
      saveWeights("m.khipu", {
        seed,
        steps: total,
        loss: finalLoss,
        buffers: { E: w.E, W: w.W, b: w.b, Wc: w.Wc },
      });
      await mint({
        metrics: {
          loss: finalLoss,
          planValid: ev.planValid,
          abstain: ev.abstain,
          hallucinated: ev.hallucinated,
        },
        boundMetric: "abstain",
        boundEps: 0.66,
        direction: "gte",
        subjectId: "m.khipu",
        version: 1,
        kind: "model",
        note: "TinyKhipu silhouette. Hard ID filter. Not Qwen. Abstain is the thing to beat.",
      });
    } finally {
      setRunning(false);
    }
  }

  async function trainRa() {
    setRunning(true);
    setRaReloaded(false);
    try {
      const data = synthRa(400, seed);
      const trainSet = data.slice(0, 320);
      const held = data.slice(320);
      const w = initRa(seed);
      const hist: number[] = [];
      const total = 200;
      for (let s = 0; s < total; s++) {
        const L = stepRa(w, take(trainSet, s * 32, 32), 0.25);
        if (s % 10 === 0) {
          hist.push(L);
          setRaLoss(hist.slice());
          setRaSteps(s + 1);
          setRaAgree(evalRa(w, held).agree);
          await new Promise((r) => requestAnimationFrame(r));
        }
      }
      const ev = evalRa(w, held);
      setRaAgree(ev.agree);
      setRaSteps(total);
      const finalLoss = hist[hist.length - 1] ?? ev.loss;
      saveWeights("m.ra", {
        seed,
        steps: total,
        loss: finalLoss,
        buffers: raBuffers(w),
      });
      await mint(
        {
          metrics: { agree: ev.agree, loss: finalLoss, steps: total },
          boundMetric: "agree",
          boundEps: 0.90,
          direction: "gte",
          subjectId: "m.ra",
          version: 1,
          kind: "model",
          note: "ReceiptAgent surrogate 24→16 ReLU→8 ReLU→4. Kernel ruleCheck wins. Not 1.5B ReceiptAgent.",
        },
        finiteRa(w),
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          Tiny navigator: NAVIGATE or ABSTAIN. Cited IDs are hard-filtered to the offered set.
          1.5B Khipu abstain is 2/6 (blocker). KHIPU-R2 is 3/6 — not a pass. This tab trains a few
          thousand floats in-browser.
        </p>
        {khipuReloaded && (
          <p className="mt-2 font-mono text-xs text-live">reloaded last train</p>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs tabular">
          <div>
            <dt className="text-subtle">plan-valid</dt>
            <dd>{(stats.planValid * 100).toFixed(0)}%</dd>
          </div>
          <div>
            <dt className="text-subtle">abstain</dt>
            <dd>{(stats.abstain * 100).toFixed(0)}%</dd>
          </div>
          <div>
            <dt className="text-subtle">hallucinated ids</dt>
            <dd>{stats.hallucinated}</dd>
          </div>
        </dl>
        <p className="mt-3 font-mono text-xs text-muted">
          loss {loss.length ? loss[loss.length - 1].toFixed(3) : "—"} · pass bar abstain ≥ 0.66 held-out
        </p>
      </Panel>
      <Panel>
        <p className="text-sm text-muted">
          ReceiptAgent surrogate. 24→16 ReLU → 8 ReLU → 4 softmax (ALLOW / WARN / BLOCKED /
          ESCALATE). Kernel ruleCheck is ground truth; the surrogate may disagree. Not a substitute
          for 1.5B ReceiptAgent.
        </p>
        {raReloaded && (
          <p className="mt-2 font-mono text-xs text-live">reloaded last train</p>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs tabular">
          <div>
            <dt className="text-subtle">steps</dt>
            <dd>{raSteps}</dd>
          </div>
          <div>
            <dt className="text-subtle">loss</dt>
            <dd>{raLoss.length ? raLoss[raLoss.length - 1].toFixed(3) : "—"}</dd>
          </div>
          <div>
            <dt className="text-subtle">agree vs ruleCheck</dt>
            <dd>{(raAgree * 100).toFixed(1)}%</dd>
          </div>
        </dl>
        <p className="mt-3 font-mono text-xs text-muted">
          pass bar agree ≥ 0.90 held-out · kernel wins
        </p>
      </Panel>
      <RunBar running={running} label="Train TinyKhipu" onRun={train} />
      <RunBar running={running} label="Train ReceiptAgent" onRun={trainRa} />
    </div>
  );
}
