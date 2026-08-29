/** Three origins. One product name. Never a11oy.com. */

import { CUTS, type RailStatus } from "./cuts";

export type { RailStatus };
export type OriginId = "hub" | "proof" | "product";

export const ORIGINS: Record<
  OriginId | "forbidden",
  { id: string; name: string; url: string | null; role: string; never?: boolean }
> = {
  hub: {
    id: "hub",
    name: "Hub",
    url: "https://huggingface.co/SZLHOLDINGS",
    role: "Weights, packages, Spaces. A listing is transport. Reachability is not quality.",
  },
  proof: {
    id: "proof",
    name: "Proof registry",
    url: "https://a11oy.net",
    role: "RECORD, Hub atlas, ROADMAP cuts. Inspect without the product interface.",
  },
  product: {
    id: "product",
    name: "Command center",
    url: "https://a-11-oy.com",
    role: "Operate. Verify tool. Living anatomy. Not the RECORD store.",
  },
  forbidden: {
    id: "forbidden",
    name: "a11oy.com",
    url: null,
    role: "Not a canon origin. Never.",
    never: true,
  },
};

export type CutPublication = {
  frontierId: string;
  name: string;
  lab: RailStatus;
  hub: RailStatus;
  hubUrl: string | null;
  proof: RailStatus;
  proofNote: string;
  product: RailStatus;
  whatNot: string;
};

export const CUT_PUBLICATION: CutPublication[] = CUTS.map((c) => ({
  frontierId: c.id,
  name: c.name,
  ...c.rails,
}));

export function statusTone(
  s: RailStatus,
): "live" | "open" | "unavail" | "blocked" | "muted" {
  if (s === "LIVE") return "live";
  if (s === "REPORTED" || s === "ROADMAP") return "open";
  if (s === "NEVER") return "blocked";
  return "unavail";
}
