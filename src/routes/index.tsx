import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { AtlasTable } from "@/components/atlas/table";
import { DefineDual } from "@/components/atlas/define";
import { HubEstate } from "@/components/atlas/hub-estate";
import { Badge, HonestyChip, Panel, Button } from "@/components/ui/primitives";
import { PLAYS } from "@/lib/types";
import { ATLAS, LIVE_FRONTIERS } from "@/lib/atlas/catalog";
import { ESTATE_MODELS } from "@/lib/catalog/models";
import { LOCKED_EIGHT } from "@/lib/catalog/formulas";
import { DOCTRINE } from "@/lib/szl/doctrine";
import { labNav, cutBySubject } from "@/lib/catalog/plays";
import { useLab } from "@/store/lab";
import { Chakana } from "@/components/shell/chakana";
import { runPlay } from "@/lib/run/execute";
import { ARM_JOBS, ARM_SEED, armEstate, mintFromMetrics } from "@/lib/run/arm";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const frontiers = useLab((s) => s.frontiers);
  const running = useLab((s) => s.running);
  const setRunning = useLab((s) => s.setRunning);
  const [arming, setArming] = useState(false);
  const [armLine, setArmLine] = useState<string | null>(null);

  function openLab(frontierId: string) {
    const nav = labNav(frontierId);
    void navigate({
      to: "/lab/$play",
      params: { play: nav.play },
      search: nav.search ?? {},
    });
  }

  async function onArmEstate() {
    if (arming || running) return;
    setArming(true);
    setRunning(true);
    setArmLine(`armed 0/${ARM_JOBS.length} · …`);
    let done = 0;
    try {
      await armEstate({
        runPlay,
        mint: async (play, face) => {
          await mintFromMetrics(play, face, ARM_SEED);
          done += 1;
          const cut = cutBySubject(face.subjectId);
          const metricVal = face.metrics[face.boundMetric];
          const shown =
            typeof metricVal === "number" && Number.isFinite(metricVal)
              ? metricVal.toExponential(2)
              : "—";
          setArmLine(
            `armed ${done}/${ARM_JOBS.length} · ${cut?.name ?? play} ${face.boundMetric} ${shown}`,
          );
        },
      });
    } finally {
      setArming(false);
      setRunning(false);
    }
  }

  const busy = arming || running;

  return (
    <AppShell>
      <div className="chakana-mark space-y-10">
        <section className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            SZL Holdings · Doctrine {DOCTRINE.version}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Knot the run. Hash the proof. Fail closed.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {ATLAS.length} field leaders, honest deltas, original cuts. Tiny models actually train in this
            tab. 1.5B QLoRA does not. Λ uniqueness is Conjecture 1 — OPEN. Energy is UNAVAILABLE.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="open">Λ = Conjecture 1 OPEN</Badge>
            <Badge tone="unavail">energy UNAVAILABLE</Badge>
            <Badge tone="live">{LIVE_FRONTIERS.length} live kernels</Badge>
            <Badge tone="muted">
              {DOCTRINE.lockedDeclarations} decls · {DOCTRINE.trackedSorries} sorries
            </Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void onArmEstate()}>
              {arming ? "Arming…" : "Arm estate"}
            </Button>
            <Link to="/lab/$play" params={{ play: "frontier" }} search={{ cut: "greenlight" }}>
              <Button>Push Ñan</Button>
            </Link>
            <Link to="/lab/$play" params={{ play: "moons" }}>
              <Button variant="ghost">Train moons MLP</Button>
            </Link>
            <Link to="/lab/$play" params={{ play: "khipu" }}>
              <Button variant="quiet">Train TinyKhipu</Button>
            </Link>
            <Link to="/lab/$play" params={{ play: "anatomy" }}>
              <Button variant="ghost">Walk anatomy</Button>
            </Link>
            <Link to="/rails">
              <Button variant="quiet">Three rails</Button>
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-muted">
            Public estate ·{" "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://holdings.a-11-oy.com/khipu/"
              target="_blank"
              rel="noreferrer"
            >
              Python FE+BE
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://github.com/szl-holdings/szl-khipu"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://huggingface.co/SZLHOLDINGS/szl-khipu"
              target="_blank"
              rel="noreferrer"
            >
              Hub
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://huggingface.co/spaces/SZLHOLDINGS/szl-khipu"
              target="_blank"
              rel="noreferrer"
            >
              Space
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://huggingface.co/SZLHOLDINGS/TinyKhipu-Nano"
              target="_blank"
              rel="noreferrer"
            >
              TinyKhipu-Nano
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://huggingface.co/SZLHOLDINGS/Moons-Nano"
              target="_blank"
              rel="noreferrer"
            >
              Moons-Nano
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://github.com/szl-holdings/anatomy"
              target="_blank"
              rel="noreferrer"
            >
              Anatomy
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://huggingface.co/spaces/SZLHOLDINGS/anatomy"
              target="_blank"
              rel="noreferrer"
            >
              3D atlas
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://a11oy.net"
              target="_blank"
              rel="noreferrer"
            >
              Proof
            </a>
            {" · "}
            <a
              className="text-accent underline-offset-2 hover:underline"
              href="https://a-11-oy.com"
              target="_blank"
              rel="noreferrer"
            >
              Product
            </a>
          </p>
          {armLine ? (
            <p
              className="mt-2 font-mono text-[11px] tabular tracking-wide text-muted"
              aria-live="polite"
            >
              {armLine}
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="font-display text-2xl">Define · two duals</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Ari is signed yes. Kay Pacha is this world. Both are LIVE kernels in this tab — not copy,
            not a 3D rehost, not a uniqueness theorem. Flip a failure. BLOCKED never writes the bound.
          </p>
          <div className="mt-4">
            <DefineDual />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Quad
            title="Kernels"
            kicker="North"
            body={`${LIVE_FRONTIERS.length} runnable · residual MEASURED`}
            to="/lab/$play"
            params={{ play: "attn" }}
          />
          <Quad
            title="Models"
            kicker="East"
            body={`${ESTATE_MODELS.filter((m) => m.trainableHere).length} train here · rest RESEARCH`}
            to="/lab/$play"
            params={{ play: "khipu" }}
          />
          <Quad
            title="Formulas"
            kicker="West"
            body={`Lean locked-8 · lab numerics CHECKED ≠ PROVEN`}
            to="/lab/$play"
            params={{ play: "formula" }}
          />
          <Quad
            title="Rails"
            kicker="South"
            body="Hub transport · a11oy.net proof · a-11-oy.com product"
            to="/rails"
          />
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Labs</h2>
              <p className="text-sm text-muted">Each RUN executes real math and mints a cord.</p>
            </div>
            <Chakana className="size-10 text-accent/50" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PLAYS.map((p) => (
              <Link
                key={p.slug}
                to="/lab/$play"
                params={{ play: p.slug }}
                className="rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
              >
                <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{p.kind}</div>
                <div className="mt-1 font-display text-xl">{p.quechua}</div>
                <p className="mt-1 text-xs text-muted">{p.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">New Ñan cuts</h2>
          <p className="mt-1 text-sm text-muted">
            Locked-8 silhouettes that actually run. GreenLight will not paint a sorry.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                {
                  id: "greenlight",
                  lean: "Ari",
                  name: "GreenLight",
                  line: "Signed assent. A sorry cannot be painted green.",
                },
                { id: "chaski", lean: "F7", name: "Chaski FIFO", line: "Hash-chained runner. Reorder is BLOCKED." },
                { id: "ayni", lean: "F11", name: "Ayni Reciprocity", line: "Residual bus. A skip leak cannot pass." },
                { id: "shard", lean: "F18", name: "ShardWitness", line: "RS(10,6) over GF(257). Need six of ten." },
                { id: "bay", lean: "rails", name: "Evidence Bay", line: "Four rails. Collapse proof into product — BLOCKED." },
                {
                  id: "invariants",
                  lean: "Kay",
                  name: "Invariants",
                  line: "Locked-8, OPEN uniqueness, UNAVAILABLE energy, chain. Break one — BLOCKED.",
                },
                {
                  id: "govsign",
                  lean: "DSSE",
                  name: "GovEnvelope",
                  line: "STRUCTURAL-ONLY. Tamper after digest — BLOCKED. Never a fake key.",
                },
                {
                  id: "prefix",
                  lean: "radix",
                  name: "PrefixWitness",
                  line: "Poison cached KV after the digest — BLOCKED. Not SGLang.",
                },
                {
                  id: "route",
                  lean: "MoE",
                  name: "RouteWitness",
                  line: "Swap an expert after routing — BLOCKED. Not Mixtral.",
                },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openLab(c.id)}
                className="rounded-xl border border-border bg-surface p-4 text-left transition-colors duration-150 hover:border-border-strong"
              >
                <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{c.lean}</div>
                <div className="mt-1 font-display text-xl">{c.name}</div>
                <p className="mt-1 text-xs text-muted">{c.line}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Frontier board</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {frontiers.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => openLab(f.id)}
                  className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left hover:bg-elevated/60"
                >
                  <span className="text-sm">{f.name}</span>
                  <span className="font-mono text-xs tabular text-muted">
                    {f.direction} {f.best} · n={f.attempts}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-2xl">Estate models</h2>
          <div className="grid gap-2">
            {ESTATE_MODELS.map((m) => (
              <Panel key={m.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <HonestyChip value={m.honesty as "LIVE" | "ADVISORY" | "RESEARCH" | "ROADMAP" | "UNAVAILABLE"} />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-subtle">{m.hub}</p>
                  <p className="mt-1 text-sm text-muted">{m.eval}</p>
                  <p className="mt-1 text-xs text-subtle">{m.whatNot}</p>
                </div>
                <div className="shrink-0 font-mono text-xs text-muted sm:text-right">
                  <div>{m.params}</div>
                  <div className="text-subtle">{m.trainableHere ? "trainable here" : "weights stay on Hub"}</div>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-2xl">Hub estate</h2>
          <HubEstate />
        </section>

        <section>
          <h2 className="mb-3 font-display text-2xl">Leader atlas</h2>
          <AtlasTable onOpenLab={openLab} />
        </section>

        <section>
          <h2 className="font-display text-2xl">Locked-8</h2>
          <p className="mt-1 text-sm text-muted">
            Exactly {LOCKED_EIGHT.length}. Experimental Lean never folds in. A sorry cannot be painted green.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {LOCKED_EIGHT.map((f) => (
              <li key={f.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                <span className="font-mono text-xs text-accent">{f.id}</span>
                <div className="text-sm">{f.name}</div>
                {f.caveat ? <div className="text-xs text-subtle">{f.caveat}</div> : null}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-subtle">
          {ATLAS.length} silhouettes · browser receipts are SHA-256 · production kernels SHA3-256 ·
          proven_trust locked false
        </p>
      </div>
    </AppShell>
  );
}

function Quad({
  title,
  kicker,
  body,
  to,
  params,
}: {
  title: string;
  kicker: string;
  body: string;
  to: "/lab/$play" | "/rails";
  params?: { play: string };
}) {
  if (to === "/rails") {
    return (
      <Link
        to="/rails"
        className="rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
      >
        <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{kicker}</div>
        <div className="mt-1 font-display text-2xl">{title}</div>
        <p className="mt-1 text-xs text-muted">{body}</p>
      </Link>
    );
  }
  return (
    <Link
      to={to}
      params={params ?? { play: "attn" }}
      className="rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
    >
      <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{kicker}</div>
      <div className="mt-1 font-display text-2xl">{title}</div>
      <p className="mt-1 text-xs text-muted">{body}</p>
    </Link>
  );
}
