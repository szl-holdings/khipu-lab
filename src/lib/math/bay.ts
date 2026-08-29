/** Evidence Bay — four rails. Collapse any two and the body fail-closes. */

export const BAY_RAILS = ["transport", "evidence", "verification", "authority"] as const;
export type BayRail = (typeof BAY_RAILS)[number];

export type BayFlags = {
  proofIntoProduct: number;
  hubAsProof: number;
  spaceAsReceipt: number;
};

export type BayOccupant = { id: string; rail: BayRail; home: BayRail; note: string };

const BASE: BayOccupant[] = [
  { id: "hub-listing", rail: "transport", home: "transport", note: "huggingface.co/SZLHOLDINGS" },
  { id: "space-running", rail: "transport", home: "transport", note: "Space RUNNING is transport" },
  { id: "atlas-json", rail: "evidence", home: "evidence", note: "a11oy.net/atlas.json" },
  { id: "record", rail: "evidence", home: "evidence", note: "a11oy.net RECORD" },
  { id: "lab-sha256", rail: "verification", home: "verification", note: "this lab SHA-256 cords" },
  { id: "verify-tool", rail: "verification", home: "verification", note: "a-11-oy.com/verify" },
  { id: "lambda", rail: "authority", home: "authority", note: "Λ advisory · Conjecture 1 OPEN" },
  { id: "willay", rail: "authority", home: "authority", note: "WILLAY signed refuse" },
];

export function evaluateBay(flags: Partial<BayFlags> = {}) {
  const f: BayFlags = {
    proofIntoProduct: flags.proofIntoProduct ?? 0,
    hubAsProof: flags.hubAsProof ?? 0,
    spaceAsReceipt: flags.spaceAsReceipt ?? 0,
  };
  const items = BASE.map((o) => ({ ...o }));
  const collapses: string[] = [];

  if (f.proofIntoProduct === 1) {
    const rec = items.find((i) => i.id === "record");
    if (rec) rec.rail = "authority";
    collapses.push("RECORD moved onto a-11-oy.com — evidence collapsed into product");
  }
  if (f.hubAsProof === 1) {
    const hub = items.find((i) => i.id === "hub-listing");
    if (hub) hub.rail = "evidence";
    collapses.push("Hub listing treated as proof — transport counted as evidence");
  }
  if (f.spaceAsReceipt === 1) {
    const sp = items.find((i) => i.id === "space-running");
    if (sp) sp.rail = "verification";
    collapses.push("RUNNING Space treated as signed receipt — transport counted as verification");
  }

  const occupancy: Record<BayRail, BayOccupant[]> = {
    transport: items.filter((i) => i.rail === "transport"),
    evidence: items.filter((i) => i.rail === "evidence"),
    verification: items.filter((i) => i.rail === "verification"),
    authority: items.filter((i) => i.rail === "authority"),
  };
  const empty = BAY_RAILS.filter((r) => occupancy[r].length === 0);
  const collapsed = collapses.length;
  const blocked = collapsed > 0;
  return {
    collapsed,
    empty: empty.length,
    blocked,
    occupancy,
    collapses,
    items,
    neverA11oyCom: true,
    reason: blocked
      ? collapses[0] ?? "rail collapse"
      : "four rails occupied · no collapse · never a11oy.com",
  };
}

export function runBay(flags: Partial<BayFlags> = {}) {
  const ev = evaluateBay(flags);
  return {
    collapsed: ev.collapsed,
    empty: ev.empty,
    blocked: ev.blocked ? 1 : 0,
    neverA11oyCom: ev.neverA11oyCom ? 1 : 0,
    reason: ev.reason,
    occupancy: ev.occupancy,
    collapses: ev.collapses,
    items: ev.items,
  };
}
