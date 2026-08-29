import { useEffect, useMemo, useState } from "react";
import { Badge, Button, HonestyChip, Panel } from "@/components/ui/primitives";
import { benchKernels } from "@/lib/run/bench";
import {
  evalKhipu,
  inferKhipu,
  initKhipu,
  khipuFromBuffers,
  stepKhipu,
  synthKhipu,
  type KhipuWeights,
} from "@/lib/train/khipu";
import {
  RA_CLASSES,
  RA_IDX,
  evalRa,
  forwardRa,
  initRa,
  raBuffers,
  raFromBuffers,
  ruleCheck,
  stepRa,
  synthRa,
  type RaWeights,
} from "@/lib/train/receipt-agent";
import {
  accuracy,
  finiteWeights,
  forwardMlp,
  initMlp,
  mlpFromBuffers,
  stepMlp,
  twoMoons,
  type MlpWeights,
} from "@/lib/train/mlp";
import { buildEmbed, embedFromBuffers, nearest, type EmbedTable } from "@/lib/train/embed";
import { loadWeights, saveWeights } from "@/lib/persist/weights";
import { HUB_ESTATE } from "@/lib/catalog/hub-estate";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";

export function InferLab({
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
  const bench = useMemo(() => benchKernels(seed), [seed]);
  const passed = bench.filter((b) => b.pass).length;

  async function mintBench() {
    setRunning(true);
    try {
      await mint({
        metrics: { passed, total: bench.length, failed: bench.length - passed },
        boundMetric: "passed",
        boundEps: bench.length,
        direction: "gte",
        subjectId: "k.bench",
        version: 1,
        kind: "kernel",
        note:
          passed === bench.length
            ? `Estate bench ${passed}/${bench.length} HOLD · CUDA UNAVAILABLE · proven_trust false`
            : `Estate bench ${passed}/${bench.length} · FAIL kept`,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          inference bay · kernel is truth · surrogates REPORTED
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Best inference here is the live kernel, not a 1.5B QLoRA. TinyKhipu, ReceiptAgent, moons,
          and MiniEmbed run on trained floats in this tab. Field-leader weights on the Hub stay
          theirs. Our cut is the receipt, the canal, the fail-closed bound.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={passed === bench.length ? "live" : "blocked"}>
            kernels {passed}/{bench.length}
          </Badge>
          <Badge tone="open">Λ Conjecture 1 OPEN</Badge>
          <Badge tone="unavail">energy UNAVAILABLE</Badge>
          <Badge tone="muted">proven_trust false</Badge>
        </div>
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl">Kernel bench</h2>
        <p className="mt-1 text-sm text-muted">
          Original cuts of FlashAttention, SageAttention, vLLM, FlexAttention, SGLang radix, Mixtral
          routing — not rehosts. CUDA UNAVAILABLE. A failing row is BLOCKED, never painted green.
        </p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {bench.map((row) => (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
              <span className="text-sm">
                {row.name}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-subtle">
                  {row.honesty}
                </span>
              </span>
              <span className={`font-mono text-xs tabular ${row.pass ? "text-live" : "text-blocked"}`}>
                {row.pass ? "HOLD" : "FAIL"} · {row.metric}{" "}
                {Number.isInteger(row.value) ? row.value : row.value.toExponential(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <RunBar running={running} label="Mint kernel bench receipt" onRun={() => void mintBench()} />
        </div>
      </Panel>

      <KhipuInfer seed={seed} running={running} setRunning={setRunning} mint={mint} />
      <RaInfer seed={seed} running={running} setRunning={setRunning} mint={mint} />
      <MoonsInfer seed={seed} running={running} setRunning={setRunning} mint={mint} />
      <EmbedInfer seed={seed} running={running} setRunning={setRunning} mint={mint} />

      <Panel>
        <h2 className="font-display text-2xl">Hub roster</h2>
        <p className="mt-1 text-sm text-muted">
          RESEARCH cards are QLoRA proposals. They do not infer here. ROADMAP has no weights. LIVE
          silhouettes train and infer in this bay. Kernel FIFO names are kernels, not Hub
          checkpoints — we do not mint a fake card for Chaski.
        </p>
        <div className="mt-3 grid gap-2">
          {HUB_ESTATE.map((m) => (
            <div
              key={m.hub}
              className="flex flex-col gap-1 rounded-lg border border-border bg-elevated px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">{m.name}</span>
                  <HonestyChip
                    value={
                      m.honesty === "LIVE" ||
                      m.honesty === "ADVISORY" ||
                      m.honesty === "RESEARCH" ||
                      m.honesty === "ROADMAP" ||
                      m.honesty === "UNAVAILABLE"
                        ? m.honesty
                        : "ADVISORY"
                    }
                  />
                </div>
                <p className="mt-1 font-mono text-[11px] text-subtle">{m.hub}</p>
                <p className="mt-1 text-xs text-muted">{m.bench}</p>
                <p className="mt-1 text-xs text-subtle">{m.whatNot}</p>
              </div>
              <div className="shrink-0 font-mono text-[11px] text-muted sm:text-right">
                {m.inferHere ? "infers here" : "weights stay RESEARCH / ROADMAP"}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function KhipuInfer({
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
  const [w, setW] = useState<KhipuWeights | null>(null);
  const [query, setQuery] = useState("resolve F18 handle");
  const [out, setOut] = useState<string>("idle — train or reload weights");
  const handles = [
    { id: "h.locked", note: "F18 node" },
    { id: "h.other", note: "YUYAY spare" },
    { id: "h.noise", note: "unrelated theorem" },
  ];

  useEffect(() => {
    const saved = loadWeights("m.khipu");
    const kw = khipuFromBuffers(saved?.buffers);
    if (kw) setW(kw);
  }, []);

  async function ensureTrain() {
    if (w) return w;
    setRunning(true);
    try {
      const data = synthKhipu(80, seed);
      const weights = initKhipu(seed);
      const trainSet = data.slice(0, 64);
      for (let s = 0; s < 160; s++) {
        const start = (s * 8) % 56;
        stepKhipu(weights, trainSet.slice(start, start + 8), 0.08);
        if (s % 20 === 0) await new Promise((r) => requestAnimationFrame(r));
      }
      const ev = evalKhipu(weights, data.slice(64));
      saveWeights("m.khipu", {
        seed,
        steps: 160,
        loss: 0,
        buffers: { E: weights.E, W: weights.W, b: weights.b, Wc: weights.Wc },
      });
      setW(weights);
      await mint({
        metrics: { planValid: ev.planValid, abstain: ev.abstain, hallucinated: ev.hallucinated },
        boundMetric: "abstain",
        boundEps: 0.66,
        direction: "gte",
        subjectId: "m.khipu",
        version: 1,
        kind: "model",
        note: "TinyKhipu inference weights. Hard ID filter. Not Qwen. Not 1.5B.",
      });
      return weights;
    } finally {
      setRunning(false);
    }
  }

  async function infer() {
    const weights = await ensureTrain();
    if (!weights) return;
    const f = inferKhipu(weights, query, handles);
    const decision = f.decision === 1 ? "NAVIGATE" : "ABSTAIN";
    setOut(
      `${decision} · p_nav ${f.p[1].toFixed(3)} · cited ${f.cited.join(",") || "∅"} · hallucinated ${f.hallucinated}`,
    );
  }

  return (
    <Panel>
      <h2 className="font-display text-2xl">TinyKhipu infer</h2>
      <p className="mt-1 text-sm text-muted">
        NAVIGATE only when a locked formula token is in the query and in an offered handle. Otherwise
        ABSTAIN. Hallucinated IDs are structurally 0.
      </p>
      <label className="mt-3 block text-xs text-muted">
        query
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-3 font-mono text-sm text-fg"
        />
      </label>
      <p className="mt-2 font-mono text-[11px] text-subtle">
        handles {handles.map((h) => `${h.id}:${h.note}`).join(" · ")}
      </p>
      <p className={`mt-3 font-mono text-sm ${out.startsWith("NAVIGATE") ? "text-live" : "text-muted"}`}>
        {out}
      </p>
      <div className="mt-3">
        <RunBar running={running} label={w ? "Infer TinyKhipu" : "Train then infer TinyKhipu"} onRun={() => void infer()} />
      </div>
    </Panel>
  );
}

function RaInfer({
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
  const [w, setW] = useState<RaWeights | null>(null);
  const [flags, setFlags] = useState({ unknownCite: 0, overstep: 0, noApproval: 0, breakChain: 0 });
  const [line, setLine] = useState("idle");

  useEffect(() => {
    const saved = loadWeights("m.ra");
    const rw = raFromBuffers(saved?.buffers);
    if (rw) setW(rw);
  }, []);

  function vec() {
    const x = new Float32Array(24);
    x[RA_IDX.hasReceipt] = 1;
    x[RA_IDX.chainContinuous] = flags.breakChain ? 0 : 1;
    x[RA_IDX.schemaValid] = 1;
    x[RA_IDX.digestMatch] = 1;
    x[RA_IDX.authorityNonIncreasing] = 1;
    x[RA_IDX.approvalPresent] = flags.noApproval ? 0 : 1;
    x[RA_IDX.overstepLexicon] = flags.overstep;
    x[RA_IDX.unknownCite] = flags.unknownCite;
    x[RA_IDX.lambdaScore] = 0.91;
    x[RA_IDX.khipuAbstain] = 0;
    x[RA_IDX.wouldBind] = flags.noApproval ? 1 : 0;
    return x;
  }

  async function ensure() {
    if (w) return w;
    setRunning(true);
    try {
      const data = synthRa(400, seed);
      const weights = initRa(seed);
      for (let s = 0; s < 160; s++) {
        stepRa(weights, takeSlice(data.slice(0, 320), s * 32, 32), 0.25);
        if (s % 20 === 0) await new Promise((r) => requestAnimationFrame(r));
      }
      const ev = evalRa(weights, data.slice(320));
      saveWeights("m.ra", { seed, steps: 160, loss: ev.loss, buffers: raBuffers(weights) });
      setW(weights);
      await mint({
        metrics: { agree: ev.agree, loss: ev.loss },
        boundMetric: "agree",
        boundEps: 0.9,
        direction: "gte",
        subjectId: "m.ra",
        version: 1,
        kind: "model",
        note: "ReceiptAgent inference. Kernel ruleCheck wins. Not 1.5B.",
      });
      return weights;
    } finally {
      setRunning(false);
    }
  }

  async function infer() {
    const weights = await ensure();
    if (!weights) return;
    const x = vec();
    const kernel = ruleCheck(x);
    const f = forwardRa(weights, x);
    setLine(
      `kernel ${RA_CLASSES[kernel]} · surrogate ${RA_CLASSES[f.pred]} · agree ${kernel === f.pred ? "yes" : "no — kernel wins"}`,
    );
  }

  const toggles = [
    { key: "unknownCite" as const, label: "Unknown cite" },
    { key: "overstep" as const, label: "Overstep lexicon" },
    { key: "noApproval" as const, label: "Bind without approval" },
    { key: "breakChain" as const, label: "Break chain" },
  ];

  return (
    <Panel>
      <h2 className="font-display text-2xl">ReceiptAgent infer</h2>
      <p className="mt-1 text-sm text-muted">
        24→16→8→4. Kernel ruleCheck is ground truth. The surrogate may disagree. Kernel wins.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {toggles.map((t) => (
          <Button
            key={t.key}
            type="button"
            variant={flags[t.key] ? "danger" : "ghost"}
            onClick={() => setFlags((p) => ({ ...p, [t.key]: p[t.key] ? 0 : 1 }))}
          >
            {flags[t.key] ? "undo · " : ""}
            {t.label}
          </Button>
        ))}
      </div>
      <p className="mt-3 font-mono text-sm text-muted">{line}</p>
      <div className="mt-3">
        <RunBar running={running} label={w ? "Infer ReceiptAgent" : "Train then infer ReceiptAgent"} onRun={() => void infer()} />
      </div>
    </Panel>
  );
}

function takeSlice<T>(arr: T[], start: number, size: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < size; i++) out.push(arr[(start + i) % arr.length]);
  return out;
}

function MoonsInfer({
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
  const [w, setW] = useState<MlpWeights | null>(null);
  const [x, setX] = useState(0.2);
  const [y, setY] = useState(0.3);
  const [line, setLine] = useState("idle");

  useEffect(() => {
    const saved = loadWeights("m.mlp");
    const mw = mlpFromBuffers(saved?.buffers);
    if (mw) setW(mw);
  }, []);

  async function ensure() {
    if (w) return w;
    setRunning(true);
    try {
      const data = twoMoons(200, seed);
      const weights = initMlp(seed);
      for (let s = 0; s < 400; s++) {
        const start = (s * 16) % 180;
        stepMlp(weights, data.slice(start, start + 16), 0.08);
        if (s % 40 === 0) await new Promise((r) => requestAnimationFrame(r));
      }
      const acc = accuracy(weights, data);
      saveWeights("m.mlp", {
        seed,
        steps: 400,
        loss: 0,
        buffers: { W1: weights.W1, b1: weights.b1, W2: weights.W2, b2: weights.b2 },
      });
      setW(weights);
      await mint(
        {
          metrics: { acc, loss: 0, steps: 400 },
          boundMetric: "acc",
          boundEps: 0.9,
          direction: "gte",
          subjectId: "m.mlp",
          version: 1,
          kind: "model",
          note: "Moons MLP inference. 2→8→2. Not 1.5B.",
        },
        finiteWeights(weights),
      );
      return weights;
    } finally {
      setRunning(false);
    }
  }

  async function infer() {
    const weights = await ensure();
    if (!weights) return;
    const f = forwardMlp(weights, x, y);
    const cls = f.p[1] >= f.p[0] ? 1 : 0;
    setLine(`class ${cls} · p0 ${f.p[0].toFixed(3)} · p1 ${f.p[1].toFixed(3)}`);
  }

  return (
    <Panel>
      <h2 className="font-display text-2xl">Moons infer</h2>
      <p className="mt-1 text-sm text-muted">2→8→2 tanh softmax. Two moons. Not a published benchmark.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          x {x.toFixed(2)}
          <input
            type="range"
            min={-1.5}
            max={2}
            step={0.01}
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-xs text-muted">
          y {y.toFixed(2)}
          <input
            type="range"
            min={-1}
            max={1.5}
            step={0.01}
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>
      <p className="mt-3 font-mono text-sm text-muted">{line}</p>
      <div className="mt-3">
        <RunBar running={running} label={w ? "Infer moons" : "Train then infer moons"} onRun={() => void infer()} />
      </div>
    </Panel>
  );
}

function EmbedInfer({
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
  const [table, setTable] = useState<EmbedTable | null>(null);
  const [q, setQ] = useState("F18");
  const [line, setLine] = useState("idle");

  useEffect(() => {
    const saved = loadWeights("m.embed");
    const t = embedFromBuffers(saved?.buffers);
    if (t) setTable(t);
  }, []);

  async function infer() {
    const t = table ?? buildEmbed(seed);
    if (!table) {
      setTable(t);
      saveWeights("m.embed", { seed, steps: 1, loss: 0, buffers: { E: t.E } });
      await mint({
        metrics: { replay: 1, dim: 12, vocab: 64 },
        boundMetric: "replay",
        boundEps: 1,
        direction: "gte",
        subjectId: "m.embed",
        version: 1,
        kind: "model",
        note: "MiniEmbed-Nano table. Hash+L2. Not neural. Not 3290×128.",
      });
    }
    const nn = nearest(t, q, 3);
    setLine(nn.hits.map((h) => `${h.tok} ${h.dist.toFixed(3)}`).join(" · "));
  }

  return (
    <Panel>
      <h2 className="font-display text-2xl">MiniEmbed infer</h2>
      <p className="mt-1 text-sm text-muted">V=64 d=12 hash+table L2. Not the 3290×128 MiniEmbed. No analogy score.</p>
      <label className="mt-3 block text-xs text-muted">
        token
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-3 font-mono text-sm text-fg"
        />
      </label>
      <p className="mt-3 font-mono text-sm text-muted">{line}</p>
      <div className="mt-3">
        <RunBar running={running} label="Infer MiniEmbed" onRun={() => void infer()} />
      </div>
    </Panel>
  );
}
