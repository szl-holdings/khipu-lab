import { useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { runPlay, type RunFace } from "@/lib/run/execute";
import { LOCKED_EIGHT } from "@/lib/catalog/formulas";
import { RunBar } from "./run-bar";
import { structuralPuriq } from "@/lib/math/formulas";

export function FormulaLab({
  seed,
  running,
  onRun,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
}) {
  const [face, setFace] = useState<RunFace | null>(() => runPlay("formula", seed));
  const rows = (face?.extra?.rows ?? []) as Array<{
    id: string;
    name: string;
    residual: number;
    epsilon: number;
    ok: boolean;
  }>;
  const puriq = (face?.extra?.puriq as ReturnType<typeof structuralPuriq>) ?? structuralPuriq(seed);

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          Two ledgers. Lean locked-8 is PROVEN in Lean (kernel c7c0ba17). Lab numerics are CHECKED
          here. CHECKED ≠ PROVEN. Λ uniqueness stays Conjecture 1.
        </p>
      </Panel>
      <Panel>
        <h2 className="font-display text-2xl">Locked-8 (Lean)</h2>
        <ul className="mt-3 space-y-2">
          {LOCKED_EIGHT.map((f) => {
            const s = puriq[f.id as keyof typeof puriq];
            return (
              <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2">
                <span className="font-mono text-xs text-accent">{f.id}</span>
                <span className="flex-1 text-sm">{f.name}</span>
                <span className={s.ok ? "font-mono text-xs text-live" : "font-mono text-xs text-blocked"}>
                  {s.ok ? "silhouette holds" : "fail"}
                </span>
                {f.caveat ? <span className="w-full text-xs text-subtle">{f.caveat}</span> : null}
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel>
        <h2 className="font-display text-2xl">Lab numerics</h2>
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-baseline justify-between gap-3">
              <span className="text-sm">{r.name}</span>
              <span className={`font-mono text-xs tabular ${r.ok ? "text-live" : "text-blocked"}`}>
                {r.residual.toExponential(2)} / ε {r.epsilon}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <RunBar
        running={running}
        label="Re-prove numerically"
        onRun={async () => {
          const f = await onRun();
          if (f) setFace(f);
        }}
      />
    </div>
  );
}
