import { useEffect, useMemo, useState } from "react";
import { Panel, Button, Badge } from "@/components/ui/primitives";
import { runPlay, type RunFace } from "@/lib/run/execute";
import { Heatmap } from "@/components/atlas/heatmap";
import { RunBar } from "./run-bar";
import type { Mat } from "@/lib/math/tensor";
import { runTileGrid } from "@/lib/math/tilegrid";
import { cn } from "@/lib/utils";

const MODES = ["TileReceipt", "TileDigest", "ScoreMod", "BlockWitness"] as const;
type AttnMode = (typeof MODES)[number];

const MODE_ID: Record<AttnMode, number> = {
  TileReceipt: 0,
  ScoreMod: 1,
  BlockWitness: 2,
  TileDigest: 3,
};

const CUT_MODE: Record<string, AttnMode> = {
  tilereceipt: "TileReceipt",
  tiledigest: "TileDigest",
  scoremod: "ScoreMod",
  blockwitness: "BlockWitness",
};

function modeFromCut(cut?: string): AttnMode {
  return (cut && CUT_MODE[cut]) || "TileReceipt";
}

const DEFAULT_TABLE = [0, 2, 4, 6, 1, 3, 5, 7];

function tableParams(table: number[]): Record<string, number> {
  return Object.fromEntries(table.map((v, i) => [`p${i}`, v]));
}

function asMat(v: unknown): Mat | null {
  if (!Array.isArray(v) || v.length === 0 || !Array.isArray(v[0])) return null;
  return v as Mat;
}

function asIndexList(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "number")) return null;
  return v as number[];
}

const COPY: Record<AttnMode, string> = {
  TileReceipt:
    "Field leader: FlashAttention (Dao et al.). SZL cut: online-softmax tiles plus a receipt. Not a rehost of Dao CUDA. Residual is MEASURED in this tab.",
  TileDigest:
    "Field leader: FlashAttention Br×Bc schedule. SZL cut: hash the tiles. A matching residual does not prove the claimed grid. Not a CUDA rehost.",
  ScoreMod:
    "Field leader: FlexAttention. SZL cut: score_mod + causal mask, receipted. Bound: sum of future attention mass ≤ 1e-6. Not a rehost of flex_attention.py.",
  BlockWitness:
    "Field leader: PagedAttention / vLLM. SZL cut: gather pages and receipt the block table. A silent swap cannot hide. Triton page kernel ROADMAP. No tokens/s claim.",
};

const RUN_LABEL: Record<AttnMode, string> = {
  TileReceipt: "Run TileReceipt",
  TileDigest: "Seal tile grid",
  ScoreMod: "Run ScoreMod",
  BlockWitness: "Run BlockWitness",
};

export function AttnLab({
  seed,
  running,
  onRun,
  cut,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
  cut?: string;
}) {
  const [tile, setTile] = useState(4);
  const [mode, setMode] = useState<AttnMode>(() => modeFromCut(cut));
  const [gridTamper, setGridTamper] = useState(0);
  const [table, setTable] = useState<number[]>(() => [...DEFAULT_TABLE]);
  useEffect(() => {
    setMode(modeFromCut(cut));
  }, [cut]);
  const params = {
    tile,
    mode: MODE_ID[mode],
    gridTamper,
    ...tableParams(table),
  };
  const shown = runPlay("attn", seed, params);
  const grid = useMemo(() => runTileGrid(8, 4, tile, tile, gridTamper), [tile, gridTamper]);
  const extraTable = asIndexList(shown.extra?.table) ?? table;
  const perm = asMat(shown.extra?.perm);
  const gatheredValues = asMat(shown.extra?.gathered);

  async function mint(extra: Record<string, number> = {}) {
    await onRun({ ...params, ...extra });
  }

  function pick(next: AttnMode) {
    setMode(next);
  }

  async function swapPages() {
    const next = table.slice();
    const tmp = next[0];
    next[0] = next[1];
    next[1] = tmp;
    setTable(next);
    setMode("BlockWitness");
    await onRun({
      tile,
      mode: MODE_ID.BlockWitness,
      ...tableParams(next),
      tableChanged: 1,
      swapped: 1,
    });
  }

  const maskFuture = shown.metrics.maskFuture ?? 0;
  const residual = shown.metrics.residual ?? 0;
  const tableChanged = shown.metrics.tableChanged ?? 0;
  const gatherRows = shown.metrics.gatherRows ?? extraTable.length;

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted">{COPY[mode]}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODES.map((m) => (
            <Button
              key={m}
              variant={mode === m ? "primary" : "ghost"}
              className="min-h-11 px-2 text-xs sm:text-sm"
              onClick={() => pick(m)}
            >
              {m}
            </Button>
          ))}
        </div>
        {mode === "TileReceipt" || mode === "TileDigest" ? (
          <label className="mt-4 block text-xs text-muted">
            tile {tile}
            <input
              type="range"
              min={2}
              max={8}
              step={2}
              value={tile}
              onChange={(e) => {
                setTile(Number(e.target.value));
              }}
              className="mt-2 w-full"
            />
          </label>
        ) : null}
        {mode === "TileDigest" ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={grid.gridBreaks ? "blocked" : "live"}>
                {grid.gridBreaks ? "grid broken" : "grid holds"}
              </Badge>
              <span className="font-mono text-[11px] text-muted">
                cover {grid.cover} · ran {grid.ranDig} · claim {grid.claimDig}
              </span>
            </div>
            <p className="font-mono text-[11px] text-muted">
              residual {residual.toExponential(2)} · claimed Br={grid.claimedBr} · tiles {grid.tileCount}
            </p>
            <div
              className="grid gap-px rounded-md bg-border p-px"
              style={{ gridTemplateColumns: `repeat(${Math.ceil(8 / Math.max(1, grid.claimedBc))}, minmax(0, 1fr))` }}
            >
              {grid.claimed.map((t, i) => (
                <div
                  key={`${t.i0}-${t.j0}-${i}`}
                  className={cn(
                    "min-h-11 rounded-sm px-2 py-2 font-mono text-[10px]",
                    grid.gridBreaks ? "bg-blocked/15 text-blocked" : "bg-elevated text-muted",
                  )}
                >
                  Q {t.i0}–{t.i1} · K {t.j0}–{t.j1}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={gridTamper === 1 ? "danger" : "ghost"}
                onClick={() => setGridTamper(gridTamper === 1 ? 0 : 1)}
              >
                {gridTamper === 1 ? "Undo coarser Br" : "Claim a coarser Br"}
              </Button>
              <Button
                variant={gridTamper === 2 ? "danger" : "ghost"}
                onClick={() => setGridTamper(gridTamper === 2 ? 0 : 2)}
              >
                {gridTamper === 2 ? "Restore last tile" : "Drop last K-tile"}
              </Button>
            </div>
          </div>
        ) : null}
        {mode === "ScoreMod" ? (
          <p className="mt-4 font-mono text-xs tabular text-muted">
            future mass {maskFuture.toExponential(2)} · bound ≤ 1e-6
          </p>
        ) : null}
        {mode === "BlockWitness" ? (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-xs tabular text-muted">
              tableChanged {tableChanged} · gatherRows {gatherRows} · pages {shown.metrics.pages}
            </p>
            <Button variant="ghost" className="min-h-11" onClick={() => void swapPages()}>
              Swap two pages
            </Button>
          </div>
        ) : null}
        {mode === "TileReceipt" ? (
          <p className="mt-3 font-mono text-xs tabular text-muted">
            residual {residual.toExponential(2)}
          </p>
        ) : null}
      </Panel>
      {mode === "BlockWitness" ? (
        <>
          <Panel>
            <p className="text-[11px] uppercase tracking-widest text-subtle">block table</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {extraTable.map((phys, i) => (
                <div key={i} className="rounded-md border border-border bg-elevated p-2">
                  <div className="font-mono text-[11px] text-subtle">slot {i}</div>
                  <div className="mt-1 font-mono text-sm tabular text-fg">page {phys}</div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel>
              {shown.heatmap ? (
                <Heatmap matrix={shown.heatmap} caption="original page order" />
              ) : null}
            </Panel>
            <Panel>
              {perm ? <Heatmap matrix={perm} caption="gathered" /> : null}
            </Panel>
          </div>
          {gatheredValues ? (
            <Panel>
              <p className="text-[11px] uppercase tracking-widest text-subtle">gathered rows</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] tabular">
                  <thead className="text-subtle">
                    <tr>
                      <th className="py-1 pr-3 font-medium">slot</th>
                      <th className="py-1 pr-3 font-medium">from</th>
                      <th className="py-1 font-medium">row</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted">
                    {extraTable.map((phys, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5 pr-3 text-fg">{i}</td>
                        <td className="py-1.5 pr-3">{phys}</td>
                        <td className="py-1.5 text-fg">
                          {(gatheredValues[i] ?? []).map((v) => v.toFixed(2)).join("  ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}
        </>
      ) : shown.heatmap ? (
        <Panel>
          <Heatmap
            matrix={shown.heatmap}
            tile={mode === "TileReceipt" || mode === "TileDigest" ? tile : 0}
            caption={
              mode === "ScoreMod"
                ? `masked probs · future mass ${maskFuture.toExponential(2)}`
                : mode === "TileDigest"
                  ? `tiled probs · grid ${grid.gridBreaks ? "broken" : "holds"} · residual ${residual.toExponential(2)}`
                  : `probs · residual ${residual.toExponential(2)}`
            }
          />
        </Panel>
      ) : null}
      <RunBar running={running} label={RUN_LABEL[mode]} onRun={() => void mint()} />
    </div>
  );
}
