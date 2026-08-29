export type Honesty =
  | "LIVE"
  | "ADVISORY"
  | "RESEARCH"
  | "ROADMAP"
  | "UNAVAILABLE"
  | "MEASURED"
  | "REPORTED"
  | "UNKNOWN";

export type Verdict = "proved" | "conjecture" | "measured" | "blocked";
export type SubjectKind = "kernel" | "model" | "formula" | "frontier";
export type PlaySlug =
  | "attn"
  | "yarqa"
  | "lambda"
  | "norm"
  | "khipu"
  | "moons"
  | "formula"
  | "frontier"
  | "anatomy";

export type Bound = {
  metric: string;
  epsilon: number;
  direction: "lte" | "gte";
};

export type KernelSpec = {
  id: string;
  slug: PlaySlug | string;
  name: string;
  quechua: string;
  version: number;
  dim: number;
  params: Record<string, number>;
  bound: Bound;
  honesty: Honesty;
};

export type ModelSpec = {
  id: string;
  slug: string;
  name: string;
  quechua: string;
  version: number;
  trainableHere: boolean;
  params: number;
  bound: Bound;
  honesty: Honesty;
  note: string;
};

export type FormulaSpec = {
  id: string;
  slug: string;
  name: string;
  quechua: string;
  statement: string;
  lhs: string;
  rhs: string;
  epsilon: number;
  leanId?: string;
  lockedProven: boolean;
};

export type GateCheck = { id: string; ok: boolean; detail: string };

export type LambdaResult = {
  verdict: Verdict;
  lambda: number;
  checks: GateCheck[];
  reason: string;
  honesty: Honesty;
};

export type Receipt = {
  id: string;
  ts: number;
  subject: { kind: SubjectKind; id: string; version: number };
  seed: number;
  canonical: string;
  sha256: string;
  prevSha256: string | null;
  metrics: Record<string, number>;
  lambda: LambdaResult;
};

export type Frontier = {
  id: string;
  name: string;
  subject: { kind: Exclude<SubjectKind, "frontier">; id: string };
  metric: string;
  best: number;
  direction: "min" | "max";
  receiptId: string | null;
  attempts: number;
  beatenAt: number | null;
};

export const PLAYS: Array<{
  slug: PlaySlug;
  name: string;
  quechua: string;
  kind: SubjectKind;
  blurb: string;
}> = [
  {
    slug: "attn",
    name: "TileReceipt",
    quechua: "Tupu Q'uñi",
    kind: "kernel",
    blurb: "Tiled fused attention vs naive softmax. Receipt the tiles.",
  },
  {
    slug: "yarqa",
    name: "Canal Compartment",
    quechua: "Yarqa",
    kind: "kernel",
    blurb: "Attend only inside irrigation canals. Original cut.",
  },
  {
    slug: "lambda",
    name: "Λ Zero-Veto",
    quechua: "Kamachiq",
    kind: "kernel",
    blurb: "Weighted geometric mean. Conjecture 1 stays OPEN.",
  },
  {
    slug: "norm",
    name: "NormFiber",
    quechua: "Tupu Rumi",
    kind: "kernel",
    blurb: "RMSNorm with a hash-chained output digest.",
  },
  {
    slug: "khipu",
    name: "AbstainGauge",
    quechua: "Yachay Rimay",
    kind: "model",
    blurb: "Tiny navigator. NAVIGATE or ABSTAIN. Hard ID filter.",
  },
  {
    slug: "moons",
    name: "Yachay Ñawi",
    quechua: "Yachay Ñawi",
    kind: "model",
    blurb: "2→8→2 MLP. Two moons. Live decision boundary.",
  },
  {
    slug: "formula",
    name: "Tupu Yupay",
    quechua: "Tupu Yupay",
    kind: "formula",
    blurb: "Eight numeric identities. Lean locked-proven set is 8, not 21.",
  },
  {
    slug: "frontier",
    name: "Ñan",
    quechua: "Ñan",
    kind: "frontier",
    blurb: "Chaski, Ayni, ShardWitness. Beat a recorded bound.",
  },
  {
    slug: "anatomy",
    name: "Organ Integrity",
    quechua: "Kay Pacha",
    kind: "kernel",
    blurb: "Five organs. Fail closed. Not a 3D rehost.",
  },
];

export const PLAY_SLUGS = PLAYS.map((p) => p.slug);

export function isPlaySlug(s: string): s is PlaySlug {
  return (PLAY_SLUGS as string[]).includes(s);
}
