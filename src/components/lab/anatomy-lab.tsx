import { useMemo, useState } from "react";
import { Activity, Bone, Brain, Heart, Radio, Shield } from "lucide-react";
import { Badge, HonestyChip, Panel } from "@/components/ui/primitives";
import { evaluateAnatomy, ORGAN_SPEC, type OrganId, type OrganPulse } from "@/lib/math/anatomy";
import { DOCTRINE } from "@/lib/szl/doctrine";
import { KAYPACHA } from "@/lib/szl/define";
import { RunBar } from "./run-bar";
import type { RunFace } from "@/lib/run/execute";
import { cn } from "@/lib/utils";

const ICONS: Record<OrganId, typeof Heart> = {
  heart: Heart,
  brain: Brain,
  circulatory: Activity,
  nervous: Radio,
  skeleton: Bone,
};

const TOGGLES: Array<{
  key: "zeroHeart" | "leakCanal" | "tamperChain" | "fabricateJoule" | "breakSkeleton" | "willayFire";
  label: string;
  hint: string;
}> = [
  { key: "zeroHeart", label: "Zero Yuyay axis", hint: "HEART fail-closes" },
  { key: "leakCanal", label: "Leak a canal", hint: "BRAIN partition breaks" },
  { key: "tamperChain", label: "Tamper YAWAR", hint: "CIRCULATORY chain break" },
  { key: "fabricateJoule", label: "Fabricate a joule", hint: "NERVOUS refuses" },
  { key: "breakSkeleton", label: "Paint a sorry green", hint: "SKELETON rejects" },
  { key: "willayFire", label: "Governance bypass", hint: "WILLAY conscience veto" },
];

export function AnatomyLab({
  seed,
  running,
  onRun,
}: {
  seed: number;
  running: boolean;
  onRun: (p?: Record<string, number>) => Promise<RunFace | void>;
}) {
  const [flags, setFlags] = useState({
    zeroHeart: 0,
    leakCanal: 0,
    tamperChain: 0,
    fabricateJoule: 0,
    breakSkeleton: 0,
    willayFire: 0,
  });
  const ev = useMemo(() => evaluateAnatomy(flags, seed), [flags, seed]);
  const byId = Object.fromEntries(ev.organs.map((o) => [o.id, o])) as Record<OrganId, OrganPulse>;

  function flip(key: keyof typeof flags) {
    setFlags((prev) => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
  }

  return (
    <div className="space-y-4">
      <Panel>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          five organs · fail closed · not a 3D rehost
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{KAYPACHA.define}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{KAYPACHA.explain}</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Is</dt>
            <dd className="mt-1 text-muted">{KAYPACHA.is.join(" · ")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Is not</dt>
            <dd className="mt-1 text-muted">{KAYPACHA.isNot.join(" · ")}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={ev.blocked ? "blocked" : "live"}>
            {ev.liveCount}/5 {ev.blocked ? "BLOCKED" : "LIVE"}
          </Badge>
          <Badge tone="open">Λ Conjecture 1 OPEN</Badge>
          <Badge tone="unavail">energy UNAVAILABLE</Badge>
          <Badge tone="muted">locked-8 · {DOCTRINE.kernelCommit}</Badge>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <OrganCard organ={byId.brain} className="md:col-start-2" />
        <OrganCard organ={byId.circulatory} className="md:col-start-1 md:row-start-2" />
        <OrganCard organ={byId.heart} className="md:col-start-2 md:row-start-2" />
        <OrganCard organ={byId.nervous} className="md:col-start-3 md:row-start-2" />
        <OrganCard organ={byId.skeleton} className="md:col-start-2 md:row-start-3" />
      </div>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">WILLAY · conscience</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">{ev.willay.note}</p>
          </div>
          <Badge tone={ev.willay.refused ? "blocked" : "open"}>
            {ev.willay.refused ? "REFUSED" : "inspectable"}
          </Badge>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ev.willay.classifiers.map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-elevated p-3">
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-muted" />
                <span className="text-sm">{c.title}</span>
              </div>
              <p className="mt-1 text-xs text-subtle">{c.firesOn}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl">Dissection</h2>
        <p className="mt-1 text-sm text-muted">
          Flip a failure. The map updates before the mint. BLOCKED never writes a frontier.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TOGGLES.map((t) => {
            const on = flags[t.key] === 1;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => flip(t.key)}
                aria-pressed={on}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm transition-colors duration-150",
                  on
                    ? "border-blocked/50 bg-blocked/10 text-fg"
                    : "border-border bg-elevated text-muted hover:border-border-strong hover:text-fg",
                )}
              >
                <span>{t.label}</span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-subtle">{t.hint}</span>
              </button>
            );
          })}
        </div>
        <p className={`mt-3 text-sm ${ev.blocked ? "text-blocked" : "text-live"}`}>{ev.reason}</p>
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl">Evidence Bay</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Purpose</dt>
            <dd className="mt-1 text-muted">
              Fail-closed integrity of the five-organ substrate. Read-only. Cannot actuate.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Try</dt>
            <dd className="mt-1 text-muted">
              Run the cycle. Tamper an organ. A DOWN organ or a WILLAY veto blocks the body.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Evidence</dt>
            <dd className="mt-1 text-muted">
              Live NumPy / browser kernels. Receipt SHA-256 on mint. 3D Space is SLSA L1 static viz.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Limits</dt>
            <dd className="mt-1 text-muted">
              Λ uniqueness OPEN. Energy UNAVAILABLE. Locked-8 stays 8. WILLAY is not tamper-proof.
              No joules, no CUDA, no 1.5B.
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Reproduce</dt>
            <dd className="mt-1 text-muted">
              Canonical source{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://github.com/szl-holdings/anatomy"
                target="_blank"
                rel="noreferrer"
              >
                szl-holdings/anatomy
              </a>
              {" · "}
              3D atlas{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://huggingface.co/spaces/SZLHOLDINGS/anatomy"
                target="_blank"
                rel="noreferrer"
              >
                SZLHOLDINGS/anatomy
              </a>
              {" · "}
              this kernel in{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://github.com/szl-holdings/szl-khipu"
                target="_blank"
                rel="noreferrer"
              >
                szl-khipu
              </a>
              . Formula map: {ORGAN_SPEC.map((o) => `${o.formulas.join("+")}→${o.name}`).join(" · ")}.
            </dd>
          </div>
        </dl>
      </Panel>

      <RunBar running={running} label="Run organ cycle" onRun={() => onRun(flags)} />
    </div>
  );
}

function OrganCard({ organ, className }: { organ: OrganPulse; className?: string }) {
  const Icon = ICONS[organ.id];
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4 shadow-panel",
        organ.status === "LIVE" ? "border-border" : "border-blocked/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "size-4",
              organ.status === "LIVE" ? "text-accent organ-pulse" : "text-blocked",
            )}
          />
          <div>
            <div className="font-display text-xl leading-none">{organ.name}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-subtle">
              {organ.quechua} · {organ.formulas.join("+")}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={organ.status === "LIVE" ? "live" : "blocked"}>{organ.status}</Badge>
          <HonestyChip value={organ.honesty as "LIVE" | "ADVISORY" | "RESEARCH" | "ROADMAP" | "UNAVAILABLE"} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{organ.detail}</p>
    </div>
  );
}
