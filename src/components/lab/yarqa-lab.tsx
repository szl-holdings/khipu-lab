import { useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { runPlay, type RunFace } from "@/lib/run/execute";
import { Heatmap } from "@/components/atlas/heatmap";
import { RunBar } from "./run-bar";

export function YarqaLab({
  seed,
  running,
  onRun,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
}) {
  const [canal, setCanal] = useState(4);
  const [face, setFace] = useState<RunFace | null>(() => runPlay("yarqa", seed, { canal: 4 }));

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          Not SageAttention. Original: contiguous canals (Quechua yarqa), attend only inside
          the compartment. A cross-canal leak is a chain break.
        </p>
        <label className="mt-4 block text-xs text-muted">
          canal size {canal}
          <input
            type="range"
            min={2}
            max={6}
            step={2}
            value={canal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCanal(v);
              setFace(runPlay("yarqa", seed, { canal: v }));
            }}
            className="mt-2 w-full"
          />
        </label>
        <p className="mt-2 font-mono text-xs tabular text-muted">
          leak {face?.metrics.leaked.toExponential(2)}
        </p>
      </Panel>
      {face?.heatmap && (
        <Panel>
          <Heatmap matrix={face.heatmap} canals={face.canals} caption="block-diagonal canal probs" />
        </Panel>
      )}
      <RunBar
        running={running}
        label="Run Yarqa"
        onRun={async () => {
          const f = await onRun({ canal });
          if (f) setFace(f);
        }}
      />
    </div>
  );
}
