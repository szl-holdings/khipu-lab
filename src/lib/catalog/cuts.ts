/** Single operational registry. Atlas essays stay in catalog.ts. Everything that
 *  arms, beats, navigates, or publishes a cut is derived from this list. */

import type { Frontier, PlaySlug, SubjectKind } from "@/lib/types";

export type RailStatus = "LIVE" | "REPORTED" | "ROADMAP" | "UNAVAILABLE" | "NEVER";

export type CutDef = {
  id: string;
  name: string;
  subject: { kind: Exclude<SubjectKind, "frontier">; id: string };
  metric: string;
  best: number;
  direction: "min" | "max";
  play: PlaySlug;
  params?: Record<string, number>;
  /** Ñan dispatch index in execute.ts. */
  nanIndex?: number;
  /** search.cut for /lab/$play */
  navCut?: string;
  /** Armed from Tinkuy. Training plays stay user-initiated. */
  arm: boolean;
  rails: {
    lab: RailStatus;
    hub: RailStatus;
    hubUrl: string | null;
    proof: RailStatus;
    proofNote: string;
    product: RailStatus;
    whatNot: string;
  };
};

const UNAVAIL = {
  hub: "UNAVAILABLE" as const,
  hubUrl: null,
  proof: "UNAVAILABLE" as const,
  product: "NEVER" as const,
};

export const CUTS: CutDef[] = [
  {
    id: "tilereceipt",
    name: "Tile vs naive residual",
    subject: { kind: "kernel", id: "k.attn" },
    metric: "residual",
    best: 1e-5,
    direction: "min",
    play: "attn",
    params: { mode: 0 },
    navCut: "tilereceipt",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/szl-receipt-attn",
      proof: "ROADMAP",
      proofNote: "KERNEL original on a11oy.net GitHub surfaces · ROADMAP",
      product: "NEVER",
      whatNot: "Not a FlashAttention rehost. No tokens/s claim.",
    },
  },
  {
    id: "tiledigest",
    name: "TileDigest schedule",
    subject: { kind: "kernel", id: "k.tiledigest" },
    metric: "gridBreaks",
    best: 1,
    direction: "min",
    play: "attn",
    params: { mode: 3 },
    navCut: "tiledigest",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Br×Bc schedule is minted here. Residual-vs-naive is a different pin.",
      whatNot: "A matching residual does not prove the claimed tile grid. Not Dao CUDA.",
    },
  },
  {
    id: "scoremod",
    name: "ScoreMod future mass",
    subject: { kind: "kernel", id: "k.scoremod" },
    metric: "maskFuture",
    best: 1,
    direction: "min",
    play: "attn",
    params: { mode: 1 },
    navCut: "scoremod",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Mask digest is minted here. No RECORD row yet.",
      whatNot: "Not FlexAttention. A swapped mask cannot stay silent.",
    },
  },
  {
    id: "blockwitness",
    name: "BlockWitness table digest",
    subject: { kind: "kernel", id: "k.blockwitness" },
    metric: "tableChanged",
    best: 1,
    direction: "min",
    play: "attn",
    params: { mode: 2 },
    navCut: "blockwitness",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Paged gather is minted here. Triton page kernel ROADMAP.",
      whatNot: "Not vLLM. No tokens/s claim.",
    },
  },
  {
    id: "canal",
    name: "Canal leak",
    subject: { kind: "kernel", id: "k.yarqa" },
    metric: "leaked",
    best: 1e-9,
    direction: "min",
    play: "yarqa",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/YARQA-ATTN",
      proof: "ROADMAP",
      proofNote: "Named in a11oy.net roadmap_cuts as YARQA-ATTN",
      product: "NEVER",
      whatNot: "Not SageAttention. GPU cubins UNAVAILABLE.",
    },
  },
  {
    id: "lambda",
    name: "Λ zero-veto",
    subject: { kind: "kernel", id: "k.lambda" },
    metric: "blocked",
    best: 1,
    direction: "min",
    play: "lambda",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/szl-lambda-gate",
      proof: "ROADMAP",
      proofNote: "Kernel is advisory. Conjecture 1 stays OPEN.",
      product: "NEVER",
      whatNot: "Not proven trust. Uniqueness is a sorry.",
    },
  },
  {
    id: "normfiber",
    name: "NormFiber unit RMS",
    subject: { kind: "kernel", id: "k.norm" },
    metric: "unitRms",
    best: 1,
    direction: "min",
    play: "norm",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Digest is integrity, not authorship. Standalone repo DEPRECATED into λ-gate.",
      whatNot: "Not a fused RMSNorm speed claim.",
    },
  },
  {
    id: "sorryledger",
    name: "SorryLedger residual",
    subject: { kind: "formula", id: "f.ledger" },
    metric: "worstResidual",
    best: 1,
    direction: "min",
    play: "formula",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Lab numerics CHECKED ≠ Lean locked-8 PROVEN.",
      whatNot: "A sorry cannot be painted green. Locked-proven is 8, not 21.",
    },
  },
  {
    id: "looptax",
    name: "Loop-tax halt",
    subject: { kind: "kernel", id: "k.frontier" },
    metric: "blocked",
    best: 1,
    direction: "min",
    play: "frontier",
    params: { allow: 1, lambdaPass: 1 },
    nanIndex: 0,
    navCut: "looptax",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "F19 fragment. Energy UNAVAILABLE.",
      whatNot: "Not Cardano Ouroboros. Halt is fail-closed.",
    },
  },
  {
    id: "chaski",
    name: "Chaski FIFO",
    subject: { kind: "kernel", id: "k.chaski" },
    metric: "broken",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 1,
    navCut: "chaski",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proof: "ROADMAP",
      proofNote: "Name listed in a11oy.net roadmap_cuts. No RECORD row. Not weights.",
      whatNot: "Do not mint a Hub model card. This is a kernel, not a checkpoint.",
    },
  },
  {
    id: "ayni",
    name: "Ayni Reciprocity",
    subject: { kind: "kernel", id: "k.ayni" },
    metric: "leak",
    best: 1e-3,
    direction: "min",
    play: "frontier",
    nanIndex: 2,
    navCut: "ayni",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Not in a11oy.net/atlas.json. Draft pointer only, from this lab.",
      whatNot: "Not a ResNet. Not ImageNet. Not a Hub weight.",
    },
  },
  {
    id: "shard",
    name: "ShardWitness RS(10,6)",
    subject: { kind: "kernel", id: "k.shard" },
    metric: "recovered",
    best: 0,
    direction: "max",
    play: "frontier",
    nanIndex: 3,
    navCut: "shard",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Not in a11oy.net/atlas.json. Draft pointer only, from this lab.",
      whatNot: "CHECKED ≠ Lean F18 PROVEN. Not RAID.",
    },
  },
  {
    id: "bay",
    name: "Evidence Bay rails",
    subject: { kind: "kernel", id: "k.bay" },
    metric: "collapsed",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 4,
    navCut: "bay",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "The rail split is doctrine. This kernel is new. No RECORD row yet.",
      whatNot: "A RUNNING Space is transport, not proof. Never a11oy.com.",
    },
  },
  {
    id: "greenlight",
    name: "GreenLight promotion",
    subject: { kind: "kernel", id: "k.greenlight" },
    metric: "painted",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 5,
    navCut: "greenlight",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Promotion predicate lives here. Dual of WILLAY. No RECORD row yet.",
      whatNot: "A GitHub green check is not a theorem. Never amber. Never a painted sorry.",
    },
  },
  {
    id: "invariants",
    name: "Doctrine invariants",
    subject: { kind: "kernel", id: "k.invariants" },
    metric: "broken",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 6,
    navCut: "invariants",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/szl-invariants",
      proof: "ROADMAP",
      proofNote: "Doctrine invariants run here. Hub card is the kernel listing.",
      product: "NEVER",
      whatNot: "Not pytest. Not a painted sorry. Locked-proven is 8.",
    },
  },
  {
    id: "govsign",
    name: "GovEnvelope DSSE",
    subject: { kind: "kernel", id: "k.govsign" },
    metric: "broken",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 7,
    navCut: "govsign",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/szl-govsign",
      proof: "ROADMAP",
      proofNote: "STRUCTURAL-ONLY envelope. UNSIGNED is honest. No fake key.",
      product: "NEVER",
      whatNot: "Not Sigstore. Not a Fulcio identity. Never a fabricated signature.",
    },
  },
  {
    id: "prefix",
    name: "PrefixWitness radix",
    subject: { kind: "kernel", id: "k.prefix" },
    metric: "broken",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 8,
    navCut: "prefix",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Original cut of RadixAttention. Digest the cached prefix. No RECORD row yet.",
      whatNot: "Not SGLang. No tokens/s claim. A poisoned cache cannot stay silent.",
    },
  },
  {
    id: "route",
    name: "RouteWitness MoE",
    subject: { kind: "kernel", id: "k.route" },
    metric: "broken",
    best: 1,
    direction: "min",
    play: "frontier",
    nanIndex: 9,
    navCut: "route",
    arm: true,
    rails: {
      lab: "LIVE",
      ...UNAVAIL,
      proofNote: "Original cut of Mixtral/Switch routing. Assignment digest is minted here.",
      whatNot: "Not Mixtral. Not a tokens/s claim. An expert swap after routing fail-closes.",
    },
  },
  {
    id: "organ",
    name: "Organ integrity (5/5)",
    subject: { kind: "kernel", id: "k.anatomy" },
    metric: "blocked",
    best: 1,
    direction: "min",
    play: "anatomy",
    arm: true,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/spaces/SZLHOLDINGS/anatomy",
      proof: "REPORTED",
      proofNote: "Anatomy is a Hub Space + GitHub. RECORD stays on a11oy.net.",
      product: "REPORTED",
      whatNot: "3D atlas is visualization. This lab is the integrity kernel.",
    },
  },
  {
    id: "moons-loss",
    name: "Moons NLL",
    subject: { kind: "model", id: "m.mlp" },
    metric: "loss",
    best: 0.22,
    direction: "min",
    play: "moons",
    arm: false,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/Moons-Nano",
      proof: "UNAVAILABLE",
      proofNote: "Trains in this tab. Not a published benchmark.",
      product: "NEVER",
      whatNot: "Not 1.5B. Energy UNAVAILABLE.",
    },
  },
  {
    id: "abstain",
    name: "TinyKhipu abstain",
    subject: { kind: "model", id: "m.khipu" },
    metric: "abstain",
    best: 0.66,
    direction: "max",
    play: "khipu",
    arm: false,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/TinyKhipu-Nano",
      proof: "UNAVAILABLE",
      proofNote: "Hard ID filter. Honesty REPORTED on the surrogate, RESEARCH on 1.5B.",
      product: "NEVER",
      whatNot: "Not Qwen. Not 1.5B.",
    },
  },
  {
    id: "embed-replay",
    name: "MiniEmbed self-NN",
    subject: { kind: "model", id: "m.embed" },
    metric: "replay",
    best: 1,
    direction: "max",
    play: "khipu",
    arm: false,
    rails: {
      lab: "LIVE",
      hub: "REPORTED",
      hubUrl: "https://huggingface.co/SZLHOLDINGS/MiniEmbed-Nano",
      proof: "UNAVAILABLE",
      proofNote: "Hash+table L2 infers here. Not neural. npz LIVE on Hub.",
      product: "NEVER",
      whatNot: "Not 3290×128 MiniEmbed. No analogy score.",
    },
  },
];

/** Essay-only atlas rows. Open lab lands on the kernel that actually enforces the cut. */
export const ESSAY_NAV: Record<string, { play: PlaySlug; search?: { cut: string } }> = {
  govenvelope: { play: "frontier", search: { cut: "govsign" } },
  bindforge: { play: "frontier", search: { cut: "greenlight" } },
  receiptrail: { play: "frontier", search: { cut: "bay" } },
  joulenull: { play: "anatomy" },
  khipu: { play: "khipu" },
};

export const CUT_BY_ID: Record<string, CutDef> = Object.fromEntries(CUTS.map((c) => [c.id, c]));

export const CUT_BY_SUBJECT: Record<string, CutDef> = Object.fromEntries(
  CUTS.map((c) => [c.subject.id, c]),
);

export const DEFAULT_FRONTIERS: Frontier[] = CUTS.map((c) => ({
  id: c.id,
  name: c.name,
  subject: c.subject,
  metric: c.metric,
  best: c.best,
  direction: c.direction,
  receiptId: null,
  attempts: 0,
  beatenAt: null,
}));

export const ARM_JOBS: Array<{ play: PlaySlug; params?: Record<string, number> }> = CUTS.filter(
  (c) => c.arm,
).map((c) => {
  const params = { ...c.params };
  if (c.nanIndex != null) params.cut = c.nanIndex;
  return { play: c.play, params: Object.keys(params).length ? params : undefined };
});

export const NAN_CUT = {
  looptax: 0,
  chaski: 1,
  ayni: 2,
  shard: 3,
  bay: 4,
  greenlight: 5,
  invariants: 6,
  govsign: 7,
  prefix: 8,
  route: 9,
} as const;

export type NanCutId = keyof typeof NAN_CUT;

export const NAN_CUT_IDS: NanCutId[] = CUTS.filter((c) => c.nanIndex != null).map(
  (c) => c.id,
) as NanCutId[];

export function isNanCut(id: string | undefined): id is NanCutId {
  return id != null && id in NAN_CUT;
}

export function cutBySubject(subjectId: string): CutDef | undefined {
  return CUT_BY_SUBJECT[subjectId];
}

export function frontierForSubject(subjectId: string): string | null {
  return CUT_BY_SUBJECT[subjectId]?.id ?? null;
}

export function playForFrontier(id: string): PlaySlug {
  return CUT_BY_ID[id]?.play ?? ESSAY_NAV[id]?.play ?? "attn";
}

export function labNav(frontierId: string): { play: PlaySlug; search?: { cut: string } } {
  const cut = CUT_BY_ID[frontierId];
  if (cut) {
    return cut.navCut ? { play: cut.play, search: { cut: cut.navCut } } : { play: cut.play };
  }
  return ESSAY_NAV[frontierId] ?? { play: "attn" };
}

export const FRONTIER_TO_PLAY: Record<string, PlaySlug> = {
  ...Object.fromEntries(CUTS.map((c) => [c.id, c.play])),
  ...Object.fromEntries(Object.entries(ESSAY_NAV).map(([id, nav]) => [id, nav.play])),
};

export const SUBJECT_TO_FRONTIER: Record<string, string> = Object.fromEntries(
  CUTS.map((c) => [c.subject.id, c.id]),
);
