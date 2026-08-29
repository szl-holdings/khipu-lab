import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ListOrdered, Scale, Grid3x3, Infinity as InfinityIcon, Columns2 } from "lucide-react";
import { Panel, Button, Badge, HonestyChip } from "@/components/ui/primitives";
import { useLab } from "@/store/lab";
import { denyByDefault } from "@/lib/math/blocked";
import { OUROBOROS_SELFCHECK } from "@/lib/math/ouroboros";
import { verifyReceipt } from "@/lib/crypto/receipt";
import { downloadJson, ledgerBundle } from "@/lib/export/bundle";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";
import { VerdictBadge } from "@/components/receipt/khipu-cord";
import { runChaski } from "@/lib/math/chaski";
import { runAyni } from "@/lib/math/ayni";
import { countLive, runShard, SHARD_K, SHARD_N, toggleMask } from "@/lib/math/shard";
import { evaluateBay } from "@/lib/math/bay";
import {
  isNanCut,
  labNav,
  NAN_CUT,
  type NanCutId,
  playForFrontier,
} from "@/lib/catalog/plays";
import { rowByFrontier } from "@/lib/atlas/catalog";
import { cn } from "@/lib/utils";

const CUT_META: Record<
  NanCutId,
  { title: string; quechua: string; lean: string; blurb: string }
> = {
  chaski: {
    title: "Chaski FIFO",
    quechua: "Chaski",
    lean: "F7",
    blurb: "Hash-chained runner FIFO. Reorder or drop is BLOCKED, not retried.",
  },
  ayni: {
    title: "Ayni Reciprocity",
    quechua: "Ayni",
    lean: "F11",
    blurb: "Residual bus conservation. Σ(out − in − F) = 0, or the bound fails closed.",
  },
  shard: {
    title: "ShardWitness",
    quechua: "Puriq",
    lean: "F18",
    blurb: "RS(10,6) over GF(257). Recoverable iff ≥ 6 of 10. CHECKED ≠ PROVEN.",
  },
  bay: {
    title: "Evidence Bay",
    quechua: "Willay",
    lean: "rails",
    blurb: "Four rails. Collapse proof into product and the body fail-closes. Never a11oy.com.",
  },
  looptax: {
    title: "Loop-Tax",
    quechua: "Ñan",
    lean: "F19 fragment",
    blurb: "Decreasing measure on an agent loop. Halt is fail-closed. Energy UNAVAILABLE.",
  },
};

export function FrontierLab({
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
  const navigate = useNavigate();
  const { frontiers, receipts } = useLab();
  const active: NanCutId = isNanCut(cut) ? cut : "chaski";
  const [tamper, setTamper] = useState<string>("untouched");
  const [gate, setGate] = useState(() => denyByDefault(true, false, true));
  const [reorder, setReorder] = useState(0);
  const [drop, setDrop] = useState(0);
  const [leak, setLeak] = useState(0);
  const [mask, setMask] = useState((1 << SHARD_N) - 1);
  const [proofIntoProduct, setProofIntoProduct] = useState(0);
  const [hubAsProof, setHubAsProof] = useState(0);
  const [spaceAsReceipt, setSpaceAsReceipt] = useState(0);
  const tax = OUROBOROS_SELFCHECK;

  const chaski = useMemo(
    () => runChaski(seed, { reorder, drop, n: 8 }),
    [seed, reorder, drop],
  );
  const ayni = useMemo(() => runAyni(seed, leak), [seed, leak]);
  const shard = useMemo(() => runShard(seed, mask), [seed, mask]);
  const bay = useMemo(
    () => evaluateBay({ proofIntoProduct, hubAsProof, spaceAsReceipt }),
    [proofIntoProduct, hubAsProof, spaceAsReceipt],
  );

  function pick(id: string) {
    const nav = labNav(id);
    void navigate({
      to: "/lab/$play",
      params: { play: nav.play },
      search: nav.search,
    });
  }

  async function tamperLast() {
    const last = receipts[0];
    if (!last) {
      setTamper("no receipt");
      return;
    }
    const clone = { ...last, seed: last.seed + 1 };
    const ok = await verifyReceipt(clone);
    setTamper(ok ? "unexpected pass" : "BLOCKED · seed changed, digest no longer matches (expected)");
    if (!ok) {
      await onRun({ cut: NAN_CUT.looptax, allow: 0, hardDeny: 1, expectBlock: 1 });
    }
  }

  function exportLedger() {
    const bundle = ledgerBundle(receipts, frontiers);
    downloadJson("szl.khipu.bundle.v1.json", bundle);
  }

  function runActive() {
    if (active === "chaski") return onRun({ cut: NAN_CUT.chaski, reorder, drop, n: 8 });
    if (active === "ayni") return onRun({ cut: NAN_CUT.ayni, leak });
    if (active === "shard") return onRun({ cut: NAN_CUT.shard, mask });
    if (active === "bay")
      return onRun({
        cut: NAN_CUT.bay,
        proofIntoProduct,
        hubAsProof,
        spaceAsReceipt,
      });
    return onRun({ cut: NAN_CUT.looptax, allow: 1, lambdaPass: 1 });
  }

  const meta = CUT_META[active];
  const row = rowByFrontier(active);

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Ñan cuts</h2>
          <Button type="button" variant="ghost" onClick={exportLedger}>
            Export ledger
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted">
          Three new named bounds plus Evidence Bay. Hub is transport. a11oy.net is proof.
          a-11-oy.com is the product. BLOCKED never writes the bound.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(Object.keys(CUT_META) as NanCutId[]).map((id) => {
            const f = frontiers.find((x) => x.id === id);
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-colors duration-150",
                  on
                    ? "border-accent bg-accent/10"
                    : "border-border bg-elevated hover:border-border-strong",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg">{CUT_META[id].title}</span>
                  <Badge tone={on ? "accent" : "muted"}>{CUT_META[id].lean}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{CUT_META[id].blurb}</p>
                {f ? (
                  <p className="mt-2 font-mono text-[11px] tabular text-subtle">
                    {f.direction} {fmtBound(f.best)} · n={f.attempts}
                    {f.beatenAt ? " · beaten" : ""}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {meta.quechua} · {meta.lean}
            </p>
            <h2 className="mt-1 font-display text-2xl">{meta.title}</h2>
          </div>
          <div className="shrink-0 pt-1">
            <HonestyChip value={row.honesty} />
          </div>
        </div>

        {active === "chaski" && (
          <ChaskiStage
            run={chaski}
            reorder={reorder}
            drop={drop}
            onReorder={setReorder}
            onDrop={setDrop}
          />
        )}
        {active === "ayni" && <AyniStage run={ayni} leak={leak} onLeak={setLeak} />}
        {active === "shard" && (
          <ShardStage
            run={shard}
            mask={mask}
            onToggle={(i) => setMask((m) => toggleMask(m, i))}
            onReset={() => setMask((1 << SHARD_N) - 1)}
            onKnock={() => setMask((1 << (SHARD_K - 1)) - 1)}
          />
        )}
        {active === "bay" && (
          <BayStage
            bay={bay}
            proofIntoProduct={proofIntoProduct}
            hubAsProof={hubAsProof}
            spaceAsReceipt={spaceAsReceipt}
            onProof={setProofIntoProduct}
            onHub={setHubAsProof}
            onSpace={setSpaceAsReceipt}
          />
        )}
        {active === "looptax" && (
          <LoopStage
            tax={tax}
            gate={gate}
            setGate={setGate}
            tamper={tamper}
            tamperLast={tamperLast}
          />
        )}
        <p className="mt-4 text-sm text-muted">{row.delta}</p>
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl">Recorded bounds</h2>
        <ul className="mt-3 space-y-1">
          {frontiers.map((f) => {
            const dedicated = playForFrontier(f.id);
            const here = isNanCut(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => pick(f.id)}
                  className="flex w-full items-baseline justify-between gap-3 border-b border-border py-2 text-left hover:text-accent"
                >
                  <span className="text-sm">
                    {f.name}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-subtle">
                      {here ? "ñan" : dedicated}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular text-muted">
                    {f.direction} {fmtBound(f.best)} · n={f.attempts}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {active !== "looptax" && (
        <Panel>
          <h2 className="font-display text-2xl">Fail-closed BLOCKED</h2>
          <p className="mt-1 text-sm text-muted">output is always null on deny. HARD_DENY dominates Λ.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setGate(denyByDefault(true, false, true))}>
              ALLOW path
            </Button>
            <Button variant="danger" onClick={() => setGate(denyByDefault(false, false, true))}>
              Deny default
            </Button>
            <Button variant="danger" onClick={() => setGate(denyByDefault(true, false, false))}>
              Λ veto
            </Button>
            <Button variant="quiet" onClick={tamperLast}>
              Tamper last receipt
            </Button>
          </div>
          <p className="mt-3 text-sm">
            <VerdictBadge verdict={gate.blocked ? "blocked" : "measured"} /> {gate.reason}
          </p>
          {tamper !== "untouched" ? <p className="mt-2 text-xs text-muted">{tamper}</p> : null}
        </Panel>
      )}

      <RunBar
        running={running}
        label={
          active === "chaski"
            ? "Push Chaski"
            : active === "ayni"
              ? "Push Ayni"
              : active === "shard"
                ? "Push ShardWitness"
                : active === "bay"
                  ? "Push Evidence Bay"
                  : "Push Ñan"
        }
        onRun={() => void runActive()}
      />
    </div>
  );
}

function fmtBound(v: number) {
  if (v === 0) return "0";
  if (Math.abs(v) >= 0.01 && Math.abs(v) < 1000) return String(v);
  return v.toExponential(2);
}

function ChaskiStage({
  run,
  reorder,
  drop,
  onReorder,
  onDrop,
}: {
  run: ReturnType<typeof runChaski>;
  reorder: number;
  drop: number;
  onReorder: (v: number) => void;
  onDrop: (v: number) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ListOrdered className="size-4 text-accent" />
        <Badge tone={run.fifoHold ? "live" : "blocked"}>
          {run.fifoHold ? "FIFO holds" : "FIFO broken"}
        </Badge>
        <span className="font-mono text-[11px] text-muted">
          reorder {run.reorder} · chain {run.chainBreaks} · n={run.n}
        </span>
      </div>
      <ol className="grid gap-1 sm:grid-cols-2">
        {run.queue.map((m, i) => (
          <li
            key={`${m.digest}-${i}`}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border px-3 py-2 font-mono text-[11px]",
              m.seq === i ? "border-border bg-elevated" : "border-blocked/40 bg-blocked/10",
            )}
          >
            <span>
              seq {m.seq} · body {m.body}
            </span>
            <span className="text-subtle">{m.digest}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button variant={reorder ? "danger" : "ghost"} onClick={() => onReorder(reorder ? 0 : 1)}>
          {reorder ? "Unswap" : "Swap two cords"}
        </Button>
        <Button variant={drop ? "danger" : "ghost"} onClick={() => onDrop(drop ? 0 : 1)}>
          {drop ? "Restore last" : "Drop last"}
        </Button>
      </div>
    </div>
  );
}

function AyniStage({
  run,
  leak,
  onLeak,
}: {
  run: ReturnType<typeof runAyni>;
  leak: number;
  onLeak: (v: number) => void;
}) {
  const maxAbs = Math.max(
    ...run.xin.map(Math.abs),
    ...run.force.map(Math.abs),
    ...run.xout.map(Math.abs),
    1e-6,
  );
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Scale className="size-4 text-accent" />
        <Badge tone={run.leak < 1e-9 ? "live" : "blocked"}>
          leak {run.leak < 1e-9 ? "0" : run.leak.toExponential(2)}
        </Badge>
        <span className="font-mono text-[11px] text-muted">mass {run.mass.toExponential(2)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <BarCol label="in" values={run.xin} max={maxAbs} />
        <BarCol label="F(in)" values={run.force} max={maxAbs} />
        <BarCol label="out" values={run.xout} max={maxAbs} />
      </div>
      <Button variant={leak ? "danger" : "ghost"} onClick={() => onLeak(leak ? 0 : 1)}>
        {leak ? "Restore identity skip" : "Scale skip to 0.62"}
      </Button>
    </div>
  );
}

function BarCol({ label, values, max }: { label: string; values: number[]; max: number }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-subtle">{label}</div>
      <div className="space-y-1">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.min(100, (Math.abs(v) / max) * 100)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-[10px] tabular text-muted">
              {v.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShardStage({
  run,
  mask,
  onToggle,
  onReset,
  onKnock,
}: {
  run: ReturnType<typeof runShard>;
  mask: number;
  onToggle: (i: number) => void;
  onReset: () => void;
  onKnock: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Grid3x3 className="size-4 text-accent" />
        <Badge tone={run.recovered ? "live" : "blocked"}>
          {run.recovered ? "recovered" : "unrecoverable"}
        </Badge>
        <span className="font-mono text-[11px] text-muted">
          live {run.live}/{SHARD_N} · need ≥ {SHARD_K} · Singleton {run.singleton}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {run.code.map((y, i) => {
          const on = run.present[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className={cn(
                "min-h-14 rounded-md border px-2 py-2 text-left font-mono text-[11px] transition-colors duration-150",
                on ? "border-border bg-elevated" : "border-blocked/40 bg-blocked/10 text-blocked",
              )}
            >
              <div className="text-subtle">s{i}</div>
              <div className="tabular">{on ? y : "—"}</div>
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] text-muted">
        data [{run.data.join(", ")}]
        {run.decoded ? ` · decoded [${run.decoded.join(", ")}]` : " · decoded ∅"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={onReset}>
          All ten live
        </Button>
        <Button variant="danger" onClick={onKnock}>
          Knock below six
        </Button>
        <span className="self-center font-mono text-[11px] text-subtle">
          mask live {countLive(mask)}
        </span>
      </div>
    </div>
  );
}

function BayStage({
  bay,
  proofIntoProduct,
  hubAsProof,
  spaceAsReceipt,
  onProof,
  onHub,
  onSpace,
}: {
  bay: ReturnType<typeof evaluateBay>;
  proofIntoProduct: number;
  hubAsProof: number;
  spaceAsReceipt: number;
  onProof: (v: number) => void;
  onHub: (v: number) => void;
  onSpace: (v: number) => void;
}) {
  const toggles = [
    {
      on: proofIntoProduct,
      set: onProof,
      label: "Put RECORD on a-11-oy.com",
      hint: "proof into product",
    },
    {
      on: hubAsProof,
      set: onHub,
      label: "Treat Hub listing as proof",
      hint: "transport as evidence",
    },
    {
      on: spaceAsReceipt,
      set: onSpace,
      label: "Count RUNNING Space as a receipt",
      hint: "transport as verification",
    },
  ] as const;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Columns2 className="size-4 text-accent" />
        <Badge tone={bay.blocked ? "blocked" : "live"}>
          {bay.blocked ? "COLLAPSED" : "four rails"}
        </Badge>
        <Badge tone="blocked">never a11oy.com</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {toggles.map((t) => (
          <Button
            key={t.label}
            type="button"
            variant={t.on ? "danger" : "ghost"}
            onClick={() => t.set(t.on ? 0 : 1)}
          >
            {t.on ? "undo · " : ""}
            {t.label}
            <span className="ml-2 font-mono text-[11px] text-subtle">{t.hint}</span>
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(["transport", "evidence", "verification", "authority"] as const).map((rail) => (
          <div key={rail} className="rounded-md border border-border bg-elevated p-3">
            <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{rail}</div>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {bay.occupancy[rail].map((o) => (
                <li key={o.id} className={o.rail !== o.home ? "text-blocked" : undefined}>
                  {o.note}
                </li>
              ))}
              {bay.occupancy[rail].length === 0 ? <li className="text-blocked">empty</li> : null}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">{bay.reason}</p>
    </div>
  );
}

function LoopStage({
  tax,
  gate,
  setGate,
  tamper,
  tamperLast,
}: {
  tax: typeof OUROBOROS_SELFCHECK;
  gate: ReturnType<typeof denyByDefault>;
  setGate: (g: ReturnType<typeof denyByDefault>) => void;
  tamper: string;
  tamperLast: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <InfinityIcon className="size-4 text-accent" />
        <span className="text-sm text-muted">
          Selfcheck from szl-ouroboros: 220 fail + 900 ok, wall 1300. serializationTax is DERIVED
          counterfactual, never a realized saving. Energy UNAVAILABLE.
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 font-mono text-xs tabular sm:grid-cols-3">
        <div>
          <dt className="text-subtle">modelMs MEASURED</dt>
          <dd>{tax.modelMs}</dd>
        </div>
        <div>
          <dt className="text-subtle">peak MEASURED</dt>
          <dd>{tax.peakAttemptMs}</dd>
        </div>
        <div>
          <dt className="text-subtle">overhead DERIVED</dt>
          <dd>{tax.overheadMs}</dd>
        </div>
        <div>
          <dt className="text-subtle">serial tax DERIVED</dt>
          <dd>{tax.serializationTaxMs}</dd>
        </div>
        <div>
          <dt className="text-subtle">deadHop DERIVED</dt>
          <dd>{tax.deadHopMs}</dd>
        </div>
        <div>
          <dt className="text-subtle">exit</dt>
          <dd>{tax.exit}</dd>
        </div>
      </dl>
      <div>
        <h3 className="font-display text-lg">Fail-closed BLOCKED</h3>
        <p className="mt-1 text-sm text-muted">output is always null on deny. HARD_DENY dominates Λ.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setGate(denyByDefault(true, false, true))}>
            ALLOW path
          </Button>
          <Button variant="danger" onClick={() => setGate(denyByDefault(false, false, true))}>
            Deny default
          </Button>
          <Button variant="danger" onClick={() => setGate(denyByDefault(true, false, false))}>
            Λ veto
          </Button>
        </div>
        <p className="mt-3 text-sm">
          <VerdictBadge verdict={gate.blocked ? "blocked" : "measured"} /> {gate.reason}
        </p>
        <p className="mt-2 font-mono text-xs text-subtle">output = {String(gate.output)}</p>
        <Button variant="quiet" className="mt-3" onClick={tamperLast}>
          Tamper last receipt
        </Button>
        <p className="mt-2 text-xs text-muted">{tamper}</p>
      </div>
    </div>
  );
}
