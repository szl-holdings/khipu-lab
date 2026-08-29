import { useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { runPlay, type RunFace } from "@/lib/run/execute";
import { Heatmap } from "@/components/atlas/heatmap";
import { RunBar } from "./run-bar";

export function NormLab({
  seed,
  running,
  onRun,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
}) {
  const [face, setFace] = useState<RunFace | null>(() => runPlay("norm", seed));
  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">
          RMSNorm with unit-RMS check. Digest is integrity, not authorship. No speedup claim.
          Energy for this op: UNAVAILABLE (no NVML in-browser).
        </p>
        <p className="mt-3 font-mono text-sm tabular">
          max |RMS(y/γ) − 1| = {face?.metrics.unitRms.toExponential(3)}
        </p>
      </Panel>
      {face?.heatmap && (
        <Panel>
          <Heatmap matrix={face.heatmap} caption="normalized rows" />
        </Panel>
      )}
      <RunBar
        running={running}
        label="Run NormFiber"
        onRun={async () => {
          const f = await onRun();
          if (f) setFace(f);
        }}
      />
    </div>
  );
}
