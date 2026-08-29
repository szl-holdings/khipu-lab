import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { YUYAY_AXES, YUYAY_FLOORS, DOCTRINE } from "@/lib/szl/doctrine";
import { evaluateLambda } from "@/lib/math/lambda";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";

export function LambdaLab({
  running,
  onRun,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
}) {
  const [axes, setAxes] = useState<number[]>(() => [...YUYAY_FLOORS]);
  const ev = useMemo(() => evaluateLambda(axes), [axes]);
  const params = Object.fromEntries(axes.map((v, i) => [`a${i}`, v]));

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          Λ = ∏ xᵢ^wᵢ over 13 Yuyay axes. Advisory always. {DOCTRINE.conjecture1}
        </p>
        <p className="mt-3 font-display text-3xl tabular">Λ {ev.value.toFixed(4)}</p>
        <p className={`mt-1 text-sm ${ev.blocked ? "text-blocked" : "text-live"}`}>{ev.reason}</p>
        <ul className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
          {ev.axioms.map((a) => (
            <li key={a.id} className={a.ok ? "text-live" : "text-blocked"}>
              {a.id} {a.ok ? "hold" : "fail"}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          {YUYAY_AXES.map((name, i) => (
            <label key={name} className="text-xs text-muted">
              <span className="flex justify-between font-mono">
                <span>{name}</span>
                <span className="tabular text-fg">{axes[i].toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={axes[i]}
                onChange={(e) => {
                  const next = axes.slice();
                  next[i] = Number(e.target.value);
                  setAxes(next);
                }}
                className="mt-1 w-full"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 min-h-11 text-xs text-accent"
          onClick={() => {
            const next = axes.slice();
            next[0] = 0;
            setAxes(next);
          }}
        >
          Zero-route sacred axis
        </button>
      </Panel>
      <RunBar running={running} label="Mint Λ receipt" onRun={() => onRun(params)} />
    </div>
  );
}
