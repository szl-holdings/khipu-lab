import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import {
  accuracy,
  finiteWeights,
  forwardMlp,
  initMlp,
  stepMlp,
  twoMoons,
  type MlpWeights,
} from "@/lib/train/mlp";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";
import { saveWeights, loadWeights } from "@/lib/persist/weights";

function mlpFromBuffers(buffers?: Record<string, Float32Array> | null): MlpWeights | null {
  if (!buffers) return null;
  const { W1, b1, W2, b2 } = buffers;
  if (!W1 || !b1 || !W2 || !b2) return null;
  if (W1.length !== 16 || b1.length !== 8 || W2.length !== 16 || b2.length !== 2) return null;
  return { W1, b1, W2, b2 };
}

export function MoonsLab({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loss, setLoss] = useState<number[]>([]);
  const [acc, setAcc] = useState(0);
  const [steps, setSteps] = useState(0);
  const [reloaded, setReloaded] = useState(false);
  const abort = useRef(false);

  function paint(w: MlpWeights, data: ReturnType<typeof twoMoons>) {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    const toX = (x: number) => ((x + 1.6) / 3.4) * W;
    const toY = (y: number) => H - ((y + 1.2) / 2.8) * H;
    ctx.fillStyle = getComputedStyle(c).getPropertyValue("--color-bg") || "#080b10";
    ctx.fillRect(0, 0, W, H);
    const g = 36;
    for (let i = 0; i < g; i++) {
      for (let j = 0; j < g; j++) {
        const x = -1.6 + (3.4 * i) / g;
        const y = -1.2 + (2.8 * j) / g;
        const p = forwardMlp(w, x, y).p[1];
        ctx.fillStyle = p > 0.5 ? "rgba(143,212,196,0.18)" : "rgba(193,122,114,0.16)";
        ctx.fillRect(toX(x), toY(y), W / g + 1, H / g + 1);
      }
    }
    for (const pt of data) {
      ctx.fillStyle = pt.yLabel ? "#8fd4c4" : "#c17a72";
      ctx.beginPath();
      ctx.arc(toX(pt.x), toY(pt.y), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  async function train() {
    abort.current = false;
    setRunning(true);
    setReloaded(false);
    const data = twoMoons(200, seed);
    const w = initMlp(seed);
    const hist: number[] = [];
    const total = 400;
    try {
      for (let s = 0; s < total; s++) {
        if (abort.current) break;
        const start = (s * 32) % 168;
        const batch = data.slice(start, start + 32);
        const L = stepMlp(w, batch, 0.25);
        if (s % 8 === 0) {
          hist.push(L);
          setLoss(hist.slice());
          setSteps(s + 1);
          setAcc(accuracy(w, data));
          paint(w, data);
          await new Promise((r) => requestAnimationFrame(r));
        }
      }
      const finite = finiteWeights(w);
      const finalLoss = hist[hist.length - 1] ?? 1;
      const a = accuracy(w, data);
      saveWeights("m.mlp", {
        seed,
        steps: total,
        loss: finalLoss,
        buffers: { W1: w.W1, b1: w.b1, W2: w.W2, b2: w.b2 },
      });
      await mint(
        {
          metrics: { loss: finalLoss, acc: a, steps: total },
          boundMetric: "loss",
          boundEps: 0.22,
          direction: "lte",
          subjectId: "m.mlp",
          version: 1,
          kind: "model",
          note: "2→8→2 tanh softmax · two moons · in-browser SGD. Not 1.5B.",
        },
        finite,
      );
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    const saved = loadWeights("m.mlp");
    const wLoaded = mlpFromBuffers(saved?.buffers);
    if (saved && wLoaded) {
      const data = twoMoons(200, saved.seed);
      setSteps(saved.steps);
      setLoss([saved.loss]);
      setAcc(accuracy(wLoaded, data));
      setReloaded(true);
      paint(wLoaded, data);
      return;
    }
    setReloaded(false);
    paint(initMlp(seed), twoMoons(200, seed));
  }, [seed]);

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          Tiny sovereign MLP. 2→8→2, tanh, softmax, SGD on two moons. Bound: NLL ≤ 0.22 after 400
          steps. This is not SZL-Khipu-1.5B.
        </p>
        {reloaded && (
          <p className="mt-2 font-mono text-xs text-live">reloaded last train</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs tabular">
          <div>
            <div className="text-subtle">steps</div>
            <div>{steps}</div>
          </div>
          <div>
            <div className="text-subtle">loss</div>
            <div>{loss.length ? loss[loss.length - 1].toFixed(4) : "—"}</div>
          </div>
          <div>
            <div className="text-subtle">acc</div>
            <div>{(acc * 100).toFixed(1)}%</div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={480}
          height={280}
          className="mt-4 w-full rounded-md border border-border"
        />
      </Panel>
      <RunBar running={running} label="Train 400 steps" onRun={train} />
    </div>
  );
}
