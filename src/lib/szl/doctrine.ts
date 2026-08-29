/** Frozen doctrine facts. Do not paint a sorry green. */

export const DOCTRINE = {
  version: "v11 LOCKED",
  kernelCommit: "c7c0ba17",
  lockedDeclarations: 749,
  uniqueAxioms: 14,
  trackedSorries: 163,
  lockedProvenCount: 8,
  lockedIds: ["F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"] as const,
  trustCeiling: 0.97,
  conjecture1:
    "Any two aggregators satisfying A1–A4 agree on every input. OPEN (sorry). Unconditional uniqueness under kernel A1–A5 is machine-checked FALSE.",
  energyPolicy: "MEASURED-NVML or UNAVAILABLE. Never a fabricated joule.",
  lambdaAdvisory: true,
  provenTrust: false,
} as const;

export const AXIOMS = {
  A1: "IsMonotone",
  A2: "IsHomogeneous  Λ(c·x)=c·Λ(x)",
  A3: "IsEgyptianExact  Λ(c,…,c)=c",
  A4: "IsBounded  Λ(x)≤max(x)",
  A5: "IsPermutationInvariant",
} as const;

export const YUYAY_AXES = [
  "moralGrounding",
  "measurabilityHonesty",
  "empiricalGrounding",
  "logicalConsistency",
  "sourceTransparency",
  "reproducibility",
  "licenseHygiene",
  "scopeDiscipline",
  "claimCalibration",
  "evalAwareness",
  "deceptionKeywords",
  "conflictingDirectives",
  "reversalDirective",
] as const;

export const YUYAY_FLOORS = [
  0.95, 0.95, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
] as const;

export const QUECHUA = {
  khipu: "knotted-cord ledger / witnessed consensus",
  yarqa: "irrigation canal / compartment attention",
  hatun: "great / orchestrator",
  yuyay: "thought / 13-axis conjunctive gate",
  willay: "to tell / signed refusal",
  ari: "yes / signed green-light / dual of willay",
  chaski: "runner / message FIFO",
  nan: "road / frontier",
  tinkuy: "meeting / command center",
  ayni: "reciprocity / residual conservation",
  puriq: "to walk / locked formula set",
  yachay: "knowing / read-only cortex",
  yawar: "blood / append-only receipt bus",
  kaypacha: "this world / living organ substrate",
} as const;
