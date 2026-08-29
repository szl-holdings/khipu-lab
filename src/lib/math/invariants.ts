/** Invariants — fail-closed doctrine checks. Not pytest. Not a painted sorry. */

import { DOCTRINE } from "../szl/doctrine.ts";

export type InvariantFlags = {
  paintSorry: number;
  claimProven: number;
  stampJoule: number;
  breakChain: number;
  foldLean: number;
};

export type InvariantCheck = { id: string; ok: boolean; detail: string };

const DEFAULTS: InvariantFlags = {
  paintSorry: 0,
  claimProven: 0,
  stampJoule: 0,
  breakChain: 0,
  foldLean: 0,
};

export function evaluateInvariants(flags: Partial<InvariantFlags> = {}) {
  const f: InvariantFlags = { ...DEFAULTS, ...flags };
  const checks: InvariantCheck[] = [
    {
      id: "locked8",
      ok: f.paintSorry !== 1 && f.foldLean !== 1,
      detail:
        f.paintSorry === 1 || f.foldLean === 1
          ? `BLOCKED · locked-proven is ${DOCTRINE.lockedProvenCount}, not 21`
          : `locked-8 holds · ${DOCTRINE.lockedIds.join(" ")}`,
    },
    {
      id: "conjecture1",
      ok: f.claimProven !== 1,
      detail:
        f.claimProven === 1
          ? "BLOCKED · uniqueness remains Conjecture 1 OPEN"
          : "Conjecture 1 OPEN · proven_trust locked false",
    },
    {
      id: "energy",
      ok: f.stampJoule !== 1,
      detail:
        f.stampJoule === 1
          ? "BLOCKED · fabricated joule · energy UNAVAILABLE"
          : "energy UNAVAILABLE · never a fabricated joule",
    },
    {
      id: "chain",
      ok: f.breakChain !== 1,
      detail:
        f.breakChain === 1
          ? "BLOCKED · receipt chain prev mismatch"
          : "chain head holds · SHA-256 silhouette",
    },
  ];
  const broken = checks.filter((c) => !c.ok).length;
  const blocked = broken > 0;
  return {
    broken,
    blocked: blocked ? 1 : 0,
    hold: blocked ? 0 : 1,
    provenTrust: false as const,
    energy: "UNAVAILABLE" as const,
    lockedProven: DOCTRINE.lockedProvenCount,
    checks,
    reason: blocked
      ? (checks.find((c) => !c.ok)?.detail ?? "invariants broken")
      : "INVARIANTS HOLD · LIVE · proven_trust false · energy UNAVAILABLE",
  };
}

export function runInvariants(flags: Partial<InvariantFlags> = {}) {
  const ev = evaluateInvariants(flags);
  return { ...ev, provenTrust: 0 };
}
