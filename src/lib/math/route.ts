/** RouteWitness — expert-assignment digest. Original cut of Mixtral/Switch MoE.
 *  Swap an expert after routing — BLOCKED. Not Mixtral. No tokens/s claim. */

import { mulberry32 } from "./tensor.ts";

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export const ROUTE_N = 8;
export const ROUTE_E = 4;

export function runRoute(seed: number, tamper = 0) {
  const rng = mulberry32(seed);
  const scores: number[][] = Array.from({ length: ROUTE_N }, () =>
    Array.from({ length: ROUTE_E }, () => rng()),
  );
  const assignment = scores.map((row) => {
    let best = 0;
    for (let e = 1; e < row.length; e++) if (row[e] > row[best]) best = e;
    return best;
  });
  const digest = djb2(assignment.join(","));
  const routed = assignment.slice();
  if (tamper === 1) routed[0] = (routed[0] + 1) % ROUTE_E;
  const now = djb2(routed.join(","));
  const hold = now === digest && tamper !== 1 ? 1 : 0;
  const load = Array.from({ length: ROUTE_E }, () => 0);
  for (const e of routed) load[e] += 1;
  return {
    hold,
    broken: hold ? 0 : 1,
    n: ROUTE_N,
    experts: ROUTE_E,
    assignment: routed,
    digest,
    now,
    load,
    reason: hold
      ? "RouteWitness HOLDS · assignment digest matches · not Mixtral · no tokens/s claim"
      : "RouteWitness BROKEN · expert swapped after routing · fail closed · not a silent MoE rehost",
  };
}
