/** GreenLight — fail-closed promotion. A sorry cannot be painted green. */

import { DOCTRINE } from "../szl/doctrine.ts";

export type GreenFlags = {
  paintSorry: number;
  claimProven: number;
  stampJoule: number;
};

export type GreenCheck = {
  id: string;
  ok: boolean;
  detail: string;
};

const DEFAULT_FLAGS: GreenFlags = {
  paintSorry: 0,
  claimProven: 0,
  stampJoule: 0,
};

export function evaluateGreenLight(flags: Partial<GreenFlags> = {}) {
  const f: GreenFlags = { ...DEFAULT_FLAGS, ...flags };

  const checks: GreenCheck[] = [
    {
      id: "sorry",
      ok: f.paintSorry !== 1,
      detail:
        f.paintSorry === 1
          ? "BLOCKED · a sorry cannot be painted green"
          : `sorry stays sorry · locked-8 is ${DOCTRINE.lockedProvenCount}, not 21`,
    },
    {
      id: "conjecture1",
      ok: f.claimProven !== 1,
      detail:
        f.claimProven === 1
          ? "BLOCKED · proven_trust cannot be true while Λ is Conjecture 1"
          : "proven_trust locked false · uniqueness OPEN",
    },
    {
      id: "energy",
      ok: f.stampJoule !== 1,
      detail:
        f.stampJoule === 1
          ? "BLOCKED · fabricated joule · energy UNAVAILABLE"
          : "energy UNAVAILABLE · never a fabricated joule",
    },
  ];

  const painted = checks.filter((c) => !c.ok).length;
  const blocked = painted > 0;

  return {
    painted,
    blocked: blocked ? 1 : 0,
    greenlit: blocked ? 0 : 1,
    provenTrust: false as const,
    energy: "UNAVAILABLE" as const,
    lockedProven: DOCTRINE.lockedProvenCount,
    conjecture1: "OPEN" as const,
    checks,
    reason: blocked
      ? (checks.find((c) => !c.ok)?.detail ?? "promotion blocked")
      : "GREEN-LIGHT · LIVE bound · proven_trust false · energy UNAVAILABLE",
  };
}

export function runGreenLight(flags: Partial<GreenFlags> = {}) {
  const ev = evaluateGreenLight(flags);
  return {
    painted: ev.painted,
    blocked: ev.blocked,
    greenlit: ev.greenlit,
    provenTrust: ev.provenTrust ? 1 : 0,
    reason: ev.reason,
    checks: ev.checks,
    energy: ev.energy,
    conjecture1: ev.conjecture1,
    lockedProven: ev.lockedProven,
  };
}
