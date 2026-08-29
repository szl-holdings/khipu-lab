import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Heart } from "lucide-react";
import { Badge, Button, Panel } from "@/components/ui/primitives";
import { evaluateGreenLight } from "@/lib/math/greenlight";
import { evaluateAnatomy } from "@/lib/math/anatomy";
import { ARI, KAYPACHA } from "@/lib/szl/define";
import { cn } from "@/lib/utils";

export function DefineDual() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <AriCard />
      <KaypachaCard />
    </div>
  );
}

function AriCard() {
  const [paintSorry, setPaintSorry] = useState(0);
  const [claimProven, setClaimProven] = useState(0);
  const [stampJoule, setStampJoule] = useState(0);
  const green = useMemo(
    () => evaluateGreenLight({ paintSorry, claimProven, stampJoule }),
    [paintSorry, claimProven, stampJoule],
  );
  const lit = green.greenlit === 1;
  const toggles = [
    { on: paintSorry, set: setPaintSorry, label: "Paint a sorry green" },
    { on: claimProven, set: setClaimProven, label: "Claim uniqueness proven" },
    { on: stampJoule, set: setStampJoule, label: "Stamp a joule" },
  ] as const;

  return (
    <Panel>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {ARI.quechua} · {ARI.lean} · dual of {ARI.dualOf.split("—")[0].trim()}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl">{ARI.name}</h3>
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full border font-mono text-[11px] uppercase tracking-widest",
            lit ? "border-live/40 bg-live/20 text-live" : "border-blocked/40 bg-blocked/20 text-blocked",
          )}
          aria-label={lit ? "green-light" : "blocked"}
        >
          {lit ? "ARI" : "NO"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{ARI.define}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{ARI.explain}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Is</dt>
          <dd className="mt-1 text-muted">{ARI.is.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-widest text-subtle">Is not</dt>
          <dd className="mt-1 text-muted">{ARI.isNot.join(" · ")}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ShieldCheck className="size-4 text-accent" />
        <Badge tone={lit ? "live" : "blocked"}>{lit ? "GREEN-LIGHT" : "BLOCKED"}</Badge>
        <Badge tone="open">Λ OPEN</Badge>
        <Badge tone="unavail">energy UNAVAILABLE</Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {toggles.map((t) => (
          <Button
            key={t.label}
            type="button"
            variant={t.on ? "danger" : "ghost"}
            onClick={() => t.set(t.on ? 0 : 1)}
          >
            {t.on ? "undo · " : ""}
            {t.label}
          </Button>
        ))}
      </div>
      <p className={`mt-3 text-sm ${lit ? "text-live" : "text-blocked"}`}>{green.reason}</p>
      <Link
        to="/lab/$play"
        params={{ play: "frontier" }}
        search={{ cut: "greenlight" }}
        className="mt-4 inline-flex min-h-11 items-center text-sm text-accent underline-offset-2 hover:underline"
      >
        Open the GreenLight lab
      </Link>
    </Panel>
  );
}

function KaypachaCard() {
  const [zeroHeart, setZeroHeart] = useState(0);
  const ev = useMemo(() => evaluateAnatomy({ zeroHeart }, 11), [zeroHeart]);

  return (
    <Panel>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {KAYPACHA.quechua} · {KAYPACHA.lean}
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl">{KAYPACHA.name}</h3>
        <Heart className={cn("size-5 shrink-0", ev.blocked ? "text-blocked" : "text-live")} />
      </div>
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
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={ev.blocked ? "blocked" : "live"}>
          {ev.liveCount}/5 {ev.blocked ? "BLOCKED" : "LIVE"}
        </Badge>
        {ev.organs.map((o) => (
          <Badge key={o.id} tone={o.status === "LIVE" ? "live" : "blocked"}>
            {o.quechua} {o.status}
          </Badge>
        ))}
      </div>
      <div className="mt-3">
        <Button
          type="button"
          variant={zeroHeart ? "danger" : "ghost"}
          onClick={() => setZeroHeart(zeroHeart ? 0 : 1)}
        >
          {zeroHeart ? "undo · " : ""}
          Zero HEART / Yuyay
        </Button>
      </div>
      <p className={`mt-3 text-sm ${ev.blocked ? "text-blocked" : "text-live"}`}>{ev.reason}</p>
      <Link
        to="/lab/$play"
        params={{ play: "anatomy" }}
        className="mt-4 inline-flex min-h-11 items-center text-sm text-accent underline-offset-2 hover:underline"
      >
        Walk the anatomy lab
      </Link>
    </Panel>
  );
}
