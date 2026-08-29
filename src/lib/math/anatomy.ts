import type { Honesty } from "@/lib/types";
import { defaultYuyay, evaluateLambda } from "./lambda";
import { yarqaAttn } from "./yarqa";
import { structuralPuriq } from "./formulas";
import { loopTax } from "./ouroboros";
import { randomMat } from "./tensor";
import { DOCTRINE } from "@/lib/szl/doctrine";

export type OrganId = "heart" | "circulatory" | "brain" | "nervous" | "skeleton";
export type OrganStatus = "LIVE" | "DOWN";

export type OrganPulse = {
  id: OrganId;
  name: string;
  quechua: string;
  formulas: readonly string[];
  status: OrganStatus;
  honesty: Honesty;
  detail: string;
  metric: number;
};

export type WillayClassifier = {
  id: string;
  title: string;
  firesOn: string;
  lineage: string;
};

export type AnatomyParams = {
  zeroHeart?: number;
  leakCanal?: number;
  tamperChain?: number;
  fabricateJoule?: number;
  breakSkeleton?: number;
  willayFire?: number;
};

export type AnatomyEval = {
  organs: OrganPulse[];
  liveCount: number;
  blocked: boolean;
  willay: {
    refused: boolean;
    category: string;
    note: string;
    classifiers: readonly WillayClassifier[];
  };
  energy: "UNAVAILABLE";
  lambdaAdvisory: true;
  conjecture1: "OPEN";
  lockedProven: 8;
  kernelCommit: string;
  chainHead: string;
  chainOk: boolean;
  reason: string;
};

export const ORGAN_SPEC = [
  {
    id: "brain" as const,
    name: "BRAIN",
    quechua: "YACHAY",
    formulas: ["F1"] as const,
    role: "read-only reasoning cortex — never holds write authority",
  },
  {
    id: "heart" as const,
    name: "HEART",
    quechua: "YUYAY",
    formulas: ["F4", "F11"] as const,
    role: "13-axis conjunctive critique gate — advisory Λ",
  },
  {
    id: "circulatory" as const,
    name: "CIRCULATORY",
    quechua: "YAWAR",
    formulas: ["F7", "F22"] as const,
    role: "append-only receipt bus — SHA-256 silhouette",
  },
  {
    id: "nervous" as const,
    name: "NERVOUS",
    quechua: "OTel",
    formulas: ["F12"] as const,
    role: "telemetry spine — energy UNAVAILABLE",
  },
  {
    id: "skeleton" as const,
    name: "SKELETON",
    quechua: "Khipu",
    formulas: ["F18", "F19"] as const,
    role: "locked-8 formula spine — CHECKED ≠ Lean PROVEN",
  },
] as const;

export const WILLAY_CLASSIFIERS: readonly WillayClassifier[] = [
  {
    id: "cyber",
    title: "Cyber dual-use",
    firesOn: "offensive exploit generation, credential theft, ransomware playbooks",
    lineage: "inspectable signed refusal — not an Anthropic classifier",
  },
  {
    id: "bio",
    title: "Bio dual-use",
    firesOn: "pathogen enhancement, synthesis assistance beyond public literature",
    lineage: "inspectable signed refusal",
  },
  {
    id: "hidden",
    title: "Hidden-reasoning extraction",
    firesOn: "attempts to dump chain-of-thought or strip governance receipts",
    lineage: "inspectable signed refusal",
  },
  {
    id: "bypass",
    title: "Governance bypass",
    firesOn: "prompt injection that asks to skip Λ, the ledger, or WILLAY",
    lineage: "inspectable signed refusal",
  },
  {
    id: "harm",
    title: "Self-harm",
    firesOn: "requests for self-harm methods or encouragement",
    lineage: "inspectable signed refusal",
  },
];

export const WILLAY_NOTE =
  "Refusals are tamper-EVIDENT, not tamper-proof. Auditable rules. Trust ceiling 0.97. WILLAY is conscience, not a sixth proven organ.";

const ZERO = "0".repeat(8);

/** Sync FNV-1a silhouette of SHA-256. Browser SubtleCrypto is async; production metal is SHA3-256. */
function fnv1aHex(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

type Hop = { seq: number; op: string; prev: string; digest: string };

function yawarChain(seed: number, tamper: boolean): { hops: Hop[]; ok: boolean; head: string } {
  const hops: Hop[] = [];
  let prev = ZERO;
  for (let seq = 0; seq < 3; seq++) {
    const op = `organ.${seq}.${seed}`;
    const digest = fnv1aHex(`${seq}|${op}|${prev}`);
    hops.push({ seq, op, prev, digest });
    prev = digest;
  }
  if (tamper && hops[1]) {
    hops[1] = { ...hops[1], prev: "deadbeef" };
  }
  let walk = ZERO;
  let ok = true;
  for (const hop of hops) {
    if (hop.prev !== walk) {
      ok = false;
      break;
    }
    const expect = fnv1aHex(`${hop.seq}|${hop.op}|${hop.prev}`);
    if (expect !== hop.digest) {
      ok = false;
      break;
    }
    walk = hop.digest;
  }
  return { hops, ok, head: hops[hops.length - 1]?.digest ?? ZERO };
}

export function evaluateAnatomy(params: AnatomyParams = {}, seed = 11): AnatomyEval {
  const axes = defaultYuyay().slice();
  if (params.zeroHeart === 1) axes[0] = 0;
  const heartEv = evaluateLambda(axes);

  const chain = yawarChain(seed, params.tamperChain === 1);

  const n = 12;
  const d = 4;
  const Q = randomMat(n, d, seed, 0.5);
  const K = randomMat(n, d, seed + 1, 0.5);
  const V = randomMat(n, d, seed + 2, 0.5);
  const y = yarqaAttn(Q, K, V, 4);
  const leaked = params.leakCanal === 1 ? Math.max(y.leaked, 1) : y.leaked;
  const brainOk = leaked <= 1e-9;

  const tax = loopTax(
    [
      { ok: false, ms: 220 },
      { ok: true, ms: 900 },
    ],
    1300,
    4,
  );
  const fabricated = params.fabricateJoule === 1;
  const nervousOk = !fabricated && tax.exit === "converged";

  const puriq = structuralPuriq(seed);
  const rows = Object.entries(puriq).map(([id, row]) => ({
    id,
    ok: params.breakSkeleton === 1 && id === "F18" ? false : row.ok,
  }));
  const skeletonOk = rows.every((r) => r.ok);
  const skeletonPass = rows.filter((r) => r.ok).length;

  const organs: OrganPulse[] = [
    {
      id: "brain",
      name: "BRAIN",
      quechua: "YACHAY",
      formulas: ["F1"],
      status: brainOk ? "LIVE" : "DOWN",
      honesty: "LIVE",
      detail: brainOk
        ? `read-only cortex · canal leak ${leaked.toExponential(2)} · no write authority`
        : `cross-canal leak ${leaked.toExponential(2)} — YACHAY cannot reason across a broken partition`,
      metric: leaked,
    },
    {
      id: "heart",
      name: "HEART",
      quechua: "YUYAY",
      formulas: ["F4", "F11"],
      status: heartEv.blocked ? "DOWN" : "LIVE",
      honesty: "ADVISORY",
      detail: heartEv.blocked
        ? `Λ ${heartEv.value.toFixed(4)} · ${heartEv.reason}`
        : `Λ ${heartEv.value.toFixed(4)} · advisory · Conjecture 1 OPEN`,
      metric: heartEv.value,
    },
    {
      id: "circulatory",
      name: "CIRCULATORY",
      quechua: "YAWAR",
      formulas: ["F7", "F22"],
      status: chain.ok ? "LIVE" : "DOWN",
      honesty: "LIVE",
      detail: chain.ok
        ? `3-hop FNV-1a silhouette · head ${chain.head} · SHA-256 of the mint is later`
        : "chain break — prev pointer does not walk. Fail closed.",
      metric: chain.ok ? 0 : 1,
    },
    {
      id: "nervous",
      name: "NERVOUS",
      quechua: "OTel",
      formulas: ["F12"],
      status: nervousOk ? "LIVE" : "DOWN",
      honesty: "UNAVAILABLE",
      detail: fabricated
        ? "fabricated joule refused — energy stays UNAVAILABLE"
        : `loop-tax ${tax.exit} · energy UNAVAILABLE · never a fabricated joule`,
      metric: fabricated ? 1 : 0,
    },
    {
      id: "skeleton",
      name: "SKELETON",
      quechua: "Khipu",
      formulas: ["F18", "F19"],
      status: skeletonOk ? "LIVE" : "DOWN",
      honesty: "ADVISORY",
      detail: skeletonOk
        ? `locked-8 silhouettes ${skeletonPass}/8 · CHECKED ≠ Lean PROVEN @ ${DOCTRINE.kernelCommit}`
        : `locked-8 silhouettes ${skeletonPass}/8 — a sorry cannot be painted green`,
      metric: skeletonPass,
    },
  ];

  const willayRefused = params.willayFire === 1;
  const liveCount = organs.filter((o) => o.status === "LIVE").length;
  const organDown = organs.some((o) => o.status === "DOWN");
  const blocked = organDown || willayRefused;
  const reason = willayRefused
    ? "WILLAY conscience veto — governance bypass refused (tamper-EVIDENT, not tamper-proof)"
    : organDown
      ? `organ integrity FAIL · ${organs.filter((o) => o.status === "DOWN").map((o) => o.name).join(", ")} DOWN · fail closed`
      : `organ integrity ${liveCount}/5 LIVE · Λ advisory · energy UNAVAILABLE · Conjecture 1 OPEN`;

  return {
    organs,
    liveCount,
    blocked,
    willay: {
      refused: willayRefused,
      category: willayRefused ? "bypass" : "none",
      note: WILLAY_NOTE,
      classifiers: WILLAY_CLASSIFIERS,
    },
    energy: "UNAVAILABLE",
    lambdaAdvisory: true,
    conjecture1: "OPEN",
    lockedProven: 8,
    kernelCommit: DOCTRINE.kernelCommit,
    chainHead: chain.head,
    chainOk: chain.ok,
    reason,
  };
}
