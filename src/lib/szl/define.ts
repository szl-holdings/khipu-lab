/** Canonical definitions. Duals: Ari (yes) and Kay Pacha (this world). */

export const ARI = {
  id: "greenlight",
  name: "GreenLight",
  quechua: "Ari",
  dualOf: "Willay — signed refusal",
  lean: "promotion",
  define:
    "Signed assent. A bound may enter the ledger only when every promotion check holds. The dual of Willay.",
  explain:
    "Three checks, never amber. Paint a sorry green — BLOCKED. Claim Λ uniqueness is a theorem while Conjecture 1 is OPEN — BLOCKED. Stamp a joule with no NVML — BLOCKED. proven_trust stays false. Energy stays UNAVAILABLE. Locked-proven is 8, not 21.",
  is: [
    "LIVE kernel in this tab",
    "fail-closed promotion of a CHECKED bound",
    "locked-proven exactly 8",
  ],
  isNot: [
    "CI green as a uniqueness proof",
    "proven_trust true",
    "MEASURED joules",
    "Qwen, 1.5B, or CUDA",
  ],
} as const;

export const KAYPACHA = {
  id: "anatomy",
  name: "Anatomy",
  quechua: "Kay Pacha",
  dualOf: "the 3D atlas — static viz, not this kernel",
  lean: "five organs",
  define:
    "This world. The living substrate. Five organs, each already a kernel in this estate. Any DOWN organ or a WILLAY veto fail-closes the body.",
  explain:
    "BRAIN / YACHAY is read-only cortex. HEART / YUYAY is advisory Λ. CIRCULATORY / YAWAR is the append-only receipt bus. NERVOUS / OTel refuses fabricated joules. SKELETON / Khipu will not paint a sorry. The public 3D atlas depicts this body. This lab is the integrity check.",
  is: [
    "LIVE 5/5 organ integrity",
    "fail-closed on a single DOWN organ",
    "WILLAY conscience, inspectable",
  ],
  isNot: [
    "a Three.js rehost",
    "tamper-proof (it is tamper-EVIDENT)",
    "a fabricated joule",
    "proven_trust",
  ],
} as const;

export const DUALS = [ARI, KAYPACHA] as const;
