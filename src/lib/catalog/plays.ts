import type { PlaySlug } from "@/lib/types";

/** Atlas frontierId → lab slug */
export const FRONTIER_TO_PLAY: Record<string, PlaySlug> = {
  tilereceipt: "attn",
  blockwitness: "attn",
  scoremod: "attn",
  canal: "yarqa",
  normfiber: "norm",
  lambda: "lambda",
  govenvelope: "frontier",
  abstain: "khipu",
  receiptrail: "frontier",
  bindforge: "moons",
  sorryledger: "formula",
  khipu: "khipu",
  joulenull: "frontier",
  looptax: "frontier",
  organ: "anatomy",
  "moons-loss": "moons",
  chaski: "frontier",
  ayni: "frontier",
  shard: "frontier",
  bay: "frontier",
};

/** RunFace.subjectId → beatable frontier id */
export const SUBJECT_TO_FRONTIER: Record<string, string> = {
  "k.attn": "tilereceipt",
  "k.yarqa": "canal",
  "k.lambda": "lambda",
  "k.norm": "normfiber",
  "k.anatomy": "organ",
  "k.chaski": "chaski",
  "k.ayni": "ayni",
  "k.shard": "shard",
  "k.bay": "bay",
  "k.frontier": "looptax",
  "m.mlp": "moons-loss",
  "m.khipu": "abstain",
  "f.ledger": "sorryledger",
};

export const NAN_CUT = {
  looptax: 0,
  chaski: 1,
  ayni: 2,
  shard: 3,
  bay: 4,
} as const;

export type NanCutId = keyof typeof NAN_CUT;

export const NAN_CUT_IDS: NanCutId[] = ["chaski", "ayni", "shard", "bay", "looptax"];

export function isNanCut(id: string | undefined): id is NanCutId {
  return (
    id === "chaski" || id === "ayni" || id === "shard" || id === "looptax" || id === "bay"
  );
}

export function playForFrontier(id: string): PlaySlug {
  return FRONTIER_TO_PLAY[id] ?? "attn";
}

export function frontierForSubject(subjectId: string): string | null {
  return SUBJECT_TO_FRONTIER[subjectId] ?? null;
}

export function labNav(frontierId: string): { play: PlaySlug; search?: { cut: string } } {
  const play = playForFrontier(frontierId);
  if (play === "frontier" && isNanCut(frontierId)) {
    return { play, search: { cut: frontierId } };
  }
  return { play };
}
