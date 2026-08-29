import { useEffect, useMemo, useState, type JSX } from "react";
import { Badge, Button, HonestyChip, Panel } from "@/components/ui/primitives";
import { Heatmap } from "@/components/atlas/heatmap";
import { LIVE_FRONTIERS, rowByFrontier } from "@/lib/atlas/catalog";
import { shortHex } from "@/lib/atlas/crypto";
import {
  YUYAY,
  axiomChecks,
  canalBounds,
  canalMask,
  digestMat,
  gatherPaged,
  lambdaAggregate,
  makeCache,
  maskMod,
  randn,
  rmsNorm,
  sdpa,
  type BlockTable,
  type MaskKind,
} from "@/lib/atlas/kernels";
import { useAtlas } from "@/lib/atlas/store";

function useVerify() {
  const receipts = useAtlas((s) => s.receipts);
  const verify = useAtlas((s) => s.verify);
  const [v, setV] = useState({ ok: true, depth: 0, firstBreak: -1 });
  useEffect(() => {
    void verify().then(setV);
  }, [receipts, verify]);
  return v;
}

function ChainStrip() {
  const receipts = useAtlas((s) => s.receipts);
  const tamperLast = useAtlas((s) => s.tamperLast);
  const reset = useAtlas((s) => s.reset);
  const v = useVerify();
  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-subtle">UnifiedReceiptChain</span>
          <HonestyChip value={v.ok ? "LIVE" : "UNAVAILABLE"} />
          <Badge tone={v.ok ? "live" : "blocked"}>{v.ok ? "verify ok" : `break @ ${v.firstBreak}`}</Badge>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted tabular-nums">
          depth {v.depth} · alg SHA-256 (browser) · SHA3-256 is the production kernel
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={tamperLast} disabled={!receipts.length}>
          Tamper last
        </Button>
        <Button variant="quiet" onClick={reset}>
          Reset chain
        </Button>
      </div>
    </Panel>
  );
}

function TileReceipt() {
  const emit = useAtlas((s) => s.emit);
  const [seed, setSeed] = useState(7);
  const seq = 8;
  const dim = 8;
  const tile = 4;
  const q = useMemo(() => randn(seq, dim, seed), [seed]);
  const k = useMemo(() => randn(seq, dim, seed + 1), [seed]);
  const v = useMemo(() => randn(seq, dim, seed + 2), [seed]);
  const { weights } = useMemo(() => sdpa(q, k, v, (i, j) => j <= i), [q, k, v]);
  const [last, setLast] = useState<string>("");

  async function run() {
    const tiles = [];
    for (let ti = 0; ti < seq; ti += tile) {
      for (let tj = 0; tj < seq; tj += tile) {
        const block = weights.slice(ti, ti + tile).map((row) => row.slice(tj, tj + tile));
        tiles.push({ ti, tj, digest: digestMat(block) });
      }
    }
    const rec = await emit("tile_fused_attn", "szl-receipt-attn", {
      seq,
      dim,
      tile,
      causal: true,
      n_tiles: tiles.length,
      tiles,
    });
    setLast(rec.digest);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Heatmap
        matrix={weights}
        tile={tile}
        caption="Causal SDPA weights · 4×4 SRAM tiles outlined. Not a FlashAttention kernel — a receipted silhouette."
      />
      <div className="space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          Each tile of the fused path is hashed into UnifiedReceiptChain. Dao’s FA never signs a tile. This demo
          is CPU math, labeled, with no tokens/s claim.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => void run()}>Emit tile receipts</Button>
          <Button variant="ghost" onClick={() => setSeed((s) => s + 3)}>
            Reseed QKV
          </Button>
        </div>
        {last ? (
          <p className="font-mono text-[11px] text-accent break-all">head {shortHex(last, 16)}</p>
        ) : null}
      </div>
    </div>
  );
}

function BlockWitness() {
  const emit = useAtlas((s) => s.emit);
  const [cache, setCache] = useState<BlockTable>(() => makeCache());
  const gathered = useMemo(() => gatherPaged(cache), [cache]);

  async function stamp() {
    await emit("block_table", "szl-block-kv", {
      map: cache.map,
      nLogical: cache.nLogical,
      nPhysical: cache.nPhysical,
      gather: digestMat(gathered),
    });
  }

  function swapPage() {
    const map = [...cache.map];
    if (map.length >= 2 && map[0] >= 0 && map[1] >= 0) {
      const t = map[0];
      map[0] = map[1];
      map[1] = t;
    }
    setCache({ ...cache, map });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cache.map.map((phys, i) => (
          <div key={i} className="rounded-md border border-border bg-elevated p-3">
            <div className="font-mono text-[11px] text-subtle">logical blk {i}</div>
            <div className="mt-1 font-mono text-sm tabular-nums">
              {phys < 0 ? "UNMAPPED" : `phys ${phys}`}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted leading-relaxed">
        vLLM pages KV for occupancy. BlockWitness receipts the table so a silent page swap fails verify(). Triton
        page kernel stays ROADMAP — this is the labeled torch-gather silhouette.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void stamp()}>Receipt block table</Button>
        <Button variant="ghost" onClick={swapPage}>
          Swap two pages
        </Button>
        <Button variant="quiet" onClick={() => setCache(makeCache())}>
          New cache
        </Button>
      </div>
    </div>
  );
}

function ScoreModFiber() {
  const emit = useAtlas((s) => s.emit);
  const [kind, setKind] = useState<MaskKind>("causal");
  const seq = 8;
  const q = useMemo(() => randn(seq, 8, 21), []);
  const k = useMemo(() => randn(seq, 8, 22), []);
  const v = useMemo(() => randn(seq, 8, 23), []);
  const mask = useMemo(() => maskMod(kind), [kind]);
  const { weights } = useMemo(() => sdpa(q, k, v, mask), [q, k, v, mask]);
  const pattern = useMemo(
    () => Array.from({ length: seq }, (_, i) => Array.from({ length: seq }, (__, j) => (mask(i, j) ? 1 : 0))),
    [mask],
  );

  async function stamp() {
    await emit("score_mod_mask", "szl-maskmod", { kind, mask_digest: digestMat(pattern) });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Heatmap matrix={weights} caption={`score_mod identity · mask_mod=${kind}`} />
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["causal", "sliding", "prefix"] as MaskKind[]).map((knd) => (
            <Button key={knd} variant={kind === knd ? "primary" : "ghost"} onClick={() => setKind(knd)}>
              {knd}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted leading-relaxed">
          FlexAttention compiles score_mod + BlockMask for speed. ScoreMod Fiber receipts the mask digest so a
          swapped policy cannot hide inside a fused kernel.
        </p>
        <Button onClick={() => void stamp()}>Receipt this mask</Button>
      </div>
    </div>
  );
}

function CanalCompartment() {
  const emit = useAtlas((s) => s.emit);
  const [nCanals, setNCanals] = useState(4);
  const seq = 16;
  const q = useMemo(() => randn(seq, 8, 31), []);
  const k = useMemo(() => randn(seq, 8, 32), []);
  const v = useMemo(() => randn(seq, 8, 33), []);
  const ends = canalBounds(seq, nCanals);
  const { weights } = useMemo(() => sdpa(q, k, v, canalMask(seq, nCanals)), [q, k, v, nCanals]);

  async function stamp() {
    await emit("canal_partition", "YARQA-ATTN", { seq, n_canals: nCanals, bounds: ends });
  }

  return (
    <div className="space-y-4">
      <Heatmap
        matrix={weights}
        canals={ends}
        caption={`n_canals=${nCanals} · block-diagonal by construction · not INT8 Sage`}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-3 text-sm text-muted">
          canals
          <input
            type="range"
            min={2}
            max={8}
            value={nCanals}
            onChange={(e) => setNCanals(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <span className="font-mono tabular-nums text-fg w-6">{nCanals}</span>
        </label>
        <Button onClick={() => void stamp()}>Receipt partition</Button>
      </div>
      <p className="text-sm text-muted leading-relaxed">
        SageAttention is quantized fused attention. YARQA is plug-flow: attend inside a canal, never across.
        GPU cubins UNAVAILABLE. This is the original compartment cut.
      </p>
    </div>
  );
}

function LambdaZeroVeto() {
  const emit = useAtlas((s) => s.emit);
  const [axes, setAxes] = useState<number[]>(() => YUYAY.map(() => 0.86));
  const score = lambdaAggregate(axes);
  const axioms = axiomChecks(axes);
  const passed = score >= 0.5;

  async function stamp() {
    await emit("lambda_gate", "szl-lambda-gate", {
      score,
      passed,
      advisory: true,
      uniqueness: "Conjecture 1 OPEN",
      axioms,
      proven_trust: false,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-subtle">Λ (weighted geometric mean)</div>
          <div className="font-mono text-3xl tabular-nums tracking-tight">{score.toFixed(4)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={passed ? "live" : "blocked"}>{passed ? "advisory pass" : "advisory fail"}</Badge>
          <Badge tone="open">uniqueness OPEN</Badge>
          <Badge tone="open">never proven trust</Badge>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {YUYAY.map((name, i) => (
          <label key={name} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-2 text-xs">
            <span className="text-muted truncate">{name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={axes[i]}
              onChange={(e) => {
                const next = [...axes];
                next[i] = Number(e.target.value);
                setAxes(next);
              }}
              className="accent-accent"
            />
            <span className="font-mono tabular-nums text-right">{axes[i].toFixed(2)}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 font-mono text-[11px]">
        <Badge tone={axioms.monotone ? "live" : "blocked"}>A1 monotone</Badge>
        <Badge tone={axioms.homogeneous ? "live" : "blocked"}>A2 homogeneous</Badge>
        <Badge tone={axioms.egyptian ? "live" : "blocked"}>A3 egyptian</Badge>
        <Badge tone={axioms.bounded ? "live" : "blocked"}>A4 ≤ max</Badge>
      </div>
      <p className="text-sm text-muted leading-relaxed">
        Zero any axis. The whole aggregate collapses. That is the veto — HDI-style WGM plus fail-closed NaN
        routing. Empirical A1–A4 are not a uniqueness proof.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void stamp()}>Receipt advisory gate</Button>
        <Button variant="ghost" onClick={() => setAxes(YUYAY.map((_, i) => (i === 0 ? 0 : 0.9)))}>
          Zero first axis
        </Button>
      </div>
    </div>
  );
}

function GovEnvelope() {
  const receipts = useAtlas((s) => s.receipts);
  const emit = useAtlas((s) => s.emit);
  const demoKey = useAtlas((s) => s.demoKey);
  const [claimProven, setClaimProven] = useState(false);
  const [envelope, setEnvelope] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const head = receipts.at(-1)?.digest ?? "0".repeat(64);

  async function sign() {
    if (claimProven) {
      setStatus("BLOCKED — proven_trust cannot be true while Λ is Conjecture 1");
      setEnvelope("");
      await emit("govsign_blocked", "szl-govsign", {
        reason: "proven_trust_locked_false",
        honest_blocked: true,
      });
      return;
    }
    const payload = {
      payloadType: "application/vnd.in-toto+json",
      predicateType: "https://slsa.dev/provenance/v1",
      subjects: [{ name: "UnifiedReceiptChain", digest: { sha256: head } }],
      predicate: {
        lambda: { verdict: "ADVISORY", uniqueness: "Conjecture 1 OPEN", proven_trust: false },
        energy: { joules: null, label: "UNAVAILABLE_NO_NVML" },
        slsa: "L1 honest / L2 roadmap",
        builder: { id: "szl-frontier-atlas/demo" },
      },
    };
    const rec = await emit("dsse_attest", "szl-govsign", payload);
    setEnvelope(
      JSON.stringify(
        {
          payloadType: payload.payloadType,
          payload,
          signatures: [
            {
              keyid: "demo-ephemeral",
              sig: rec.digest,
              note: "HMAC-shaped SHA-256 over payload. Production is ECDSA P-256. Not Sigstore keyless.",
            },
          ],
        },
        null,
        2,
      ),
    );
    setStatus("SIGNED (demo key) · UNSIGNED would be the honest fallback without a key");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted leading-relaxed">
        in-toto/SLSA/Sigstore sign builds. GovEnvelope signs a governance predicate over the live chain head and
        refuses to upgrade Λ to a theorem.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={claimProven}
          onChange={(e) => setClaimProven(e.target.checked)}
          className="size-4 accent-blocked"
        />
        Claim Λ uniqueness is proven
      </label>
      <Button onClick={() => void sign()} disabled={!receipts.length && !claimProven}>
        Attest chain head
      </Button>
      {status ? <p className="font-mono text-[11px] text-open">{status}</p> : null}
      {envelope ? (
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-elevated p-3 font-mono text-[11px] leading-relaxed text-muted">
          {envelope}
        </pre>
      ) : (
        <p className="text-sm text-subtle">Run another frontier first so there is a chain head to sign.</p>
      )}
      <p className="font-mono text-[11px] text-subtle">key = {demoKey}</p>
    </div>
  );
}

const WITNESSES = ["Yuyay", "Khipu", "Willay", "Yawar"] as const;
type Vote = "allow" | "block" | "offline";

function KhipuQuorum() {
  const emit = useAtlas((s) => s.emit);
  const [votes, setVotes] = useState<Vote[]>(["allow", "allow", "allow", "offline"]);
  const [action, setAction] = useState("export-receipt-bundle");
  const allows = votes.filter((v) => v === "allow").length;
  const decided = allows >= 3;

  async function settle() {
    await emit("khipu_quorum", "khipu-consensus", {
      action,
      votes,
      allows,
      threshold: "3-of-4",
      decided,
      safety: "Conjecture 2 OPEN",
      liveness: "Conjecture 3 OPEN",
    });
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm text-muted">
        action hash subject
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="mt-1 w-full rounded-sm border border-border bg-elevated px-3 py-2 font-mono text-sm text-fg"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {WITNESSES.map((name, i) => (
          <div key={name} className="rounded-md border border-border bg-elevated p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{name}</span>
              <Badge
                tone={votes[i] === "allow" ? "live" : votes[i] === "block" ? "blocked" : "unavail"}
              >
                {votes[i]}
              </Badge>
            </div>
            <div className="mt-2 flex gap-1">
              {(["allow", "block", "offline"] as Vote[]).map((vt) => (
                <Button
                  key={vt}
                  variant={votes[i] === vt ? "primary" : "quiet"}
                  className="min-h-9 flex-1 text-xs"
                  onClick={() => {
                    const next = [...votes] as Vote[];
                    next[i] = vt;
                    setVotes(next);
                  }}
                >
                  {vt}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={decided ? "live" : "blocked"}>{decided ? "QUORUM 3-of-4" : "NO QUORUM"}</Badge>
        <span className="font-mono text-[11px] text-muted tabular-nums">{allows} allow · 1 Byzantine tolerated</span>
      </div>
      <p className="text-sm text-muted leading-relaxed">
        CRDTs merge; PBFT replicates. Khipu is four independent governance organs signing the same action hash.
        Safety remains Conjecture 2.
      </p>
      <Button onClick={() => void settle()}>Receipt decision</Button>
    </div>
  );
}

function LoopTax() {
  const emit = useAtlas((s) => s.emit);
  const [budget, setBudget] = useState(8);
  const [hops, setHops] = useState<{ hop: number; tax: number; remain: number }[]>([]);
  const halted = budget <= 0;

  async function hop() {
    if (budget <= 0) return;
    const tax = 1 + (hops.length % 3 === 2 ? 1 : 0);
    const remain = Math.max(0, budget - tax);
    const row = { hop: hops.length, tax, remain };
    setHops((h) => [...h, row]);
    setBudget(remain);
    await emit("loop_tax", "szl-ouroboros", {
      ...row,
      halted: remain <= 0,
      bekenstein: "metaphorical budget, not a physics proof",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-subtle">remaining budget</div>
          <div className="font-mono text-3xl tabular-nums">{budget}</div>
        </div>
        <Badge tone={halted ? "blocked" : "live"}>{halted ? "HALT fail-closed" : "OPEN loop"}</Badge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full bg-accent transition-[width] duration-200"
          style={{ width: `${(budget / 8) * 100}%` }}
        />
      </div>
      <ol className="space-y-1 font-mono text-[11px] text-muted">
        {hops.map((h) => (
          <li key={h.hop}>
            hop {h.hop} · tax {h.tax} · remain {h.remain}
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted leading-relaxed">
        Cardano Ouroboros is PoS. Bekenstein is a physics bound. Loop-Tax is a decreasing measure on an agent
        loop — dual-witnessed, halt-closed, not a consensus protocol.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => void hop()} disabled={halted}>
          Take hop
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setBudget(8);
            setHops([]);
          }}
        >
          Reset budget
        </Button>
      </div>
    </div>
  );
}

function NormFiberMini() {
  const x = useMemo(() => randn(1, 12, 41)[0], []);
  const y = rmsNorm(x);
  return (
    <p className="font-mono text-[11px] text-subtle">
      companion NormFiber (not live): RMS in={x[0].toFixed(3)}… out={y[0].toFixed(3)}… receipted in production
      szl-governed-norm
    </p>
  );
}

const DEMOS: Record<string, () => JSX.Element> = {
  tilereceipt: TileReceipt,
  blockwitness: BlockWitness,
  scoremod: ScoreModFiber,
  canal: CanalCompartment,
  lambda: LambdaZeroVeto,
  govenvelope: GovEnvelope,
  khipu: KhipuQuorum,
  looptax: LoopTax,
};

export function LabBench({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  const row = rowByFrontier(active);
  const Demo = DEMOS[active] ?? TileReceipt;
  return (
    <div className="space-y-4">
      <ChainStrip />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {LIVE_FRONTIERS.map((f) => (
          <button
            key={f.frontierId}
            type="button"
            onClick={() => onSelect(f.frontierId)}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm transition-colors duration-150 ${
              f.frontierId === active
                ? "border-transparent bg-accent text-accent-fg"
                : "border-border bg-elevated text-muted hover:text-fg"
            }`}
          >
            {f.frontier}
          </button>
        ))}
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-tight">{row.frontier}</h2>
            <p className="mt-1 text-sm text-muted">
              {row.szl} · silhouette of {row.leader}
            </p>
          </div>
          <HonestyChip value={row.honesty} />
        </div>
        <Demo />
        <div className="mt-4 border-t border-border pt-3">
          <NormFiberMini />
        </div>
      </Panel>
    </div>
  );
}
