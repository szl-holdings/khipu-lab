/** Three origins. One product name. Never a11oy.com. */

export type RailStatus = "LIVE" | "REPORTED" | "ROADMAP" | "UNAVAILABLE" | "NEVER";

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

/** Honest as of the live a11oy.net/atlas.json snapshot (REPORTED). */
export const CUT_PUBLICATION: CutPublication[] = [
  {
    frontierId: "tilereceipt",
    name: "TileReceipt",
    lab: "LIVE",
    hub: "REPORTED",
    hubUrl: "https://huggingface.co/SZLHOLDINGS/szl-receipt-attn",
    proof: "ROADMAP",
    proofNote: "KERNEL original on a11oy.net GitHub surfaces · ROADMAP",
    product: "NEVER",
    whatNot: "Not a FlashAttention rehost. No tokens/s claim.",
  },
  {
    frontierId: "canal",
    name: "Canal Compartment",
    lab: "LIVE",
    hub: "REPORTED",
    hubUrl: "https://huggingface.co/SZLHOLDINGS/YARQA-ATTN",
    proof: "ROADMAP",
    proofNote: "Named in a11oy.net roadmap_cuts as YARQA-ATTN",
    product: "NEVER",
    whatNot: "Not SageAttention. GPU cubins UNAVAILABLE.",
  },
  {
    frontierId: "chaski",
    name: "Chaski FIFO",
    lab: "LIVE",
    hub: "UNAVAILABLE",
    hubUrl: null,
    proof: "ROADMAP",
    proofNote: "Name listed in a11oy.net roadmap_cuts. No RECORD row. Not weights.",
    product: "NEVER",
    whatNot: "Do not mint a Hub model card. This is a kernel, not a checkpoint.",
  },
  {
    frontierId: "ayni",
    name: "Ayni Reciprocity",
    lab: "LIVE",
    hub: "UNAVAILABLE",
    hubUrl: null,
    proof: "UNAVAILABLE",
    proofNote: "Not in a11oy.net/atlas.json. Draft pointer only, from this lab.",
    product: "NEVER",
    whatNot: "Not a ResNet. Not ImageNet. Not a Hub weight.",
  },
  {
    frontierId: "shard",
    name: "ShardWitness",
    lab: "LIVE",
    hub: "UNAVAILABLE",
    hubUrl: null,
    proof: "UNAVAILABLE",
    proofNote: "Not in a11oy.net/atlas.json. Draft pointer only, from this lab.",
    product: "NEVER",
    whatNot: "CHECKED ≠ Lean F18 PROVEN. Not RAID.",
  },
  {
    frontierId: "bay",
    name: "Evidence Bay",
    lab: "LIVE",
    hub: "UNAVAILABLE",
    hubUrl: null,
    proof: "UNAVAILABLE",
    proofNote: "The rail split is doctrine. This kernel is new. No RECORD row yet.",
    product: "NEVER",
    whatNot: "A RUNNING Space is transport, not proof. Never a11oy.com.",
  },
  {
    frontierId: "organ",
    name: "Organ Integrity",
    lab: "LIVE",
    hub: "REPORTED",
    hubUrl: "https://huggingface.co/spaces/SZLHOLDINGS/anatomy",
    proof: "REPORTED",
    proofNote: "Anatomy is a Hub Space + GitHub. RECORD stays on a11oy.net.",
    product: "REPORTED",
    whatNot: "3D atlas is visualization. This lab is the integrity kernel.",
  },
];

export function statusTone(
  s: RailStatus,
): "live" | "open" | "unavail" | "blocked" | "muted" {
  if (s === "LIVE") return "live";
  if (s === "REPORTED" || s === "ROADMAP") return "open";
  if (s === "NEVER") return "blocked";
  return "unavail";
}
