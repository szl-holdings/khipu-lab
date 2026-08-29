/** Census of SZLHOLDINGS Hub cards. Honesty over completeness. Not a scrape of Qwen. */

import type { Honesty } from "@/lib/types";

export type HubKind = "nano" | "kernel" | "research" | "roadmap" | "stub";

export type HubCard = {
  hub: string;
  name: string;
  kind: HubKind;
  honesty: Honesty;
  weights: "npz LIVE" | "safetensors RESEARCH" | "gguf RESEARCH" | "card-only" | "none";
  inferHere: boolean;
  bench: string;
  whatNot: string;
};

export const HUB_ESTATE: HubCard[] = [
  { hub: "SZLHOLDINGS/TinyKhipu-Nano", name: "TinyKhipu-Nano", kind: "nano", honesty: "LIVE", weights: "npz LIVE", inferHere: true, bench: "abstain ≥ 0.66 · hallucinated 0", whatNot: "Not Qwen. Not 1.5B." },
  { hub: "SZLHOLDINGS/Moons-Nano", name: "Moons-Nano", kind: "nano", honesty: "LIVE", weights: "npz LIVE", inferHere: true, bench: "NLL ≤ 0.22 · 2→8→2", whatNot: "Not a published benchmark." },
  { hub: "SZLHOLDINGS/ReceiptAgent-Nano", name: "ReceiptAgent-Nano", kind: "nano", honesty: "LIVE", weights: "npz LIVE", inferHere: true, bench: "agree vs ruleCheck ≥ 0.90", whatNot: "Kernel is truth. Not 1.5B." },
  { hub: "SZLHOLDINGS/MiniEmbed-Nano", name: "MiniEmbed-Nano", kind: "nano", honesty: "LIVE", weights: "npz LIVE", inferHere: true, bench: "self-NN replay on 16 toks", whatNot: "Not 3290×128 MiniEmbed. Not neural." },
  { hub: "SZLHOLDINGS/szl-khipu", name: "szl-khipu", kind: "kernel", honesty: "LIVE", weights: "npz LIVE", inferHere: true, bench: "numpy kernels · CUDA UNAVAILABLE", whatNot: "Not FlashAttention." },
  { hub: "SZLHOLDINGS/szl-khipu-kernels", name: "szl-khipu-kernels", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "Λ · YARQA · anatomy", whatNot: "Not CUDA cubins." },
  { hub: "SZLHOLDINGS/szl-lambda-gate", name: "szl-lambda-gate", kind: "kernel", honesty: "ADVISORY", weights: "card-only", inferHere: true, bench: "WGM · uniqueness OPEN", whatNot: "Not proven trust." },
  { hub: "SZLHOLDINGS/YARQA-ATTN", name: "YARQA-ATTN", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "canal leak = 0", whatNot: "Not SageAttention." },
  { hub: "SZLHOLDINGS/szl-receipt-attn", name: "szl-receipt-attn", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "tile vs naive residual", whatNot: "Not Dao .cu." },
  { hub: "SZLHOLDINGS/szl-maskmod", name: "szl-maskmod", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "future mass = 0", whatNot: "Not FlexAttention." },
  { hub: "SZLHOLDINGS/szl-block-kv", name: "szl-block-kv", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "table digest", whatNot: "Not vLLM." },
  { hub: "SZLHOLDINGS/szl-governed-norm", name: "szl-governed-norm", kind: "kernel", honesty: "ADVISORY", weights: "card-only", inferHere: true, bench: "unit RMS", whatNot: "Not a fused speed claim." },
  { hub: "SZLHOLDINGS/szl-invariants", name: "szl-invariants", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "locked-8 · chain · OPEN", whatNot: "Not pytest." },
  { hub: "SZLHOLDINGS/szl-govsign", name: "szl-govsign", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "STRUCTURAL-ONLY envelope", whatNot: "Not Sigstore. Never a fake key." },
  { hub: "SZLHOLDINGS/szl-provctl", name: "szl-provctl", kind: "kernel", honesty: "ADVISORY", weights: "card-only", inferHere: false, bench: "DAG walk ROADMAP", whatNot: "Not SLSA L3." },
  { hub: "SZLHOLDINGS/szl-blocked", name: "szl-blocked", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "deny-by-default", whatNot: "Not an EU certificate." },
  { hub: "SZLHOLDINGS/szl-ouroboros", name: "szl-ouroboros", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: true, bench: "loop-tax halt", whatNot: "Not Cardano." },
  { hub: "SZLHOLDINGS/szl-formulas", name: "szl-formulas", kind: "kernel", honesty: "ADVISORY", weights: "card-only", inferHere: true, bench: "locked-8 CHECKED ≠ PROVEN", whatNot: "Not 21 theorems." },
  { hub: "SZLHOLDINGS/szl-nemo", name: "szl-nemo", kind: "kernel", honesty: "UNAVAILABLE", weights: "card-only", inferHere: false, bench: "joblib missing", whatNot: "Not Nemotron." },
  { hub: "SZLHOLDINGS/szl-kernels", name: "MiniEmbed 3290×128", kind: "kernel", honesty: "LIVE", weights: "card-only", inferHere: false, bench: "SVD var 0.3146", whatNot: "Not neural. Not MiniEmbed-Nano." },
  { hub: "SZLHOLDINGS/governed-inference-meter", name: "inference-meter", kind: "kernel", honesty: "UNAVAILABLE", weights: "none", inferHere: false, bench: "energy UNAVAILABLE", whatNot: "Never a fabricated joule." },
  { hub: "SZLHOLDINGS/SZL-Khipu-1.5B", name: "SZL-Khipu-1.5B", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "abstain 2/6 blocker", whatNot: "Not trained here. Not from-scratch." },
  { hub: "SZLHOLDINGS/SZL-Khipu-1.5B-GGUF", name: "SZL-Khipu-1.5B-GGUF", kind: "research", honesty: "RESEARCH", weights: "gguf RESEARCH", inferHere: false, bench: "llama.cpp transport", whatNot: "Not in this tab." },
  { hub: "SZLHOLDINGS/KHIPU-R2", name: "KHIPU-R2", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "abstain 3/6 not a pass", whatNot: "Does not overwrite 1.5B." },
  { hub: "SZLHOLDINGS/khipu-r3", name: "khipu-r3", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "round 3 QLoRA · not trained here", whatNot: "Not TinyKhipu-Nano. Not from-scratch." },
  { hub: "SZLHOLDINGS/SZL-Forge-1.5B-ReceiptAgent", name: "ReceiptAgent 1.5B", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "tiny N · never executes", whatNot: "Not ReceiptAgent-Nano." },
  { hub: "SZLHOLDINGS/szl-receiptagent-qwen35-0.8b-v2", name: "RA 0.8B v2", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "JSON 5/5 · refusal 6/6", whatNot: "A11oy Brain corpus excluded." },
  { hub: "SZLHOLDINGS/szl-receiptagent-qwen35-0.8b-v3", name: "RA 0.8B v3", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "proposal", whatNot: "Not trained here." },
  { hub: "SZLHOLDINGS/chaski", name: "chaski 0.8B", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "json_draft 0/5 FAIL kept", whatNot: "Honest fail card. Not the FIFO kernel." },
  { hub: "SZLHOLDINGS/chaski-r2", name: "chaski-r2", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "adapter", whatNot: "Not the Chaski FIFO kernel." },
  { hub: "SZLHOLDINGS/chaski-5050", name: "chaski-5050", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "proposal-only", whatNot: "publication_eligible false." },
  { hub: "SZLHOLDINGS/brain-navigator-r2", name: "brain-navigator-r2", kind: "research", honesty: "RESEARCH", weights: "safetensors RESEARCH", inferHere: false, bench: "retrieval LoRA", whatNot: "Not TinyKhipu-Nano." },
  { hub: "SZLHOLDINGS/SZL-Khipu-1.5B-abstain", name: "1.5B-abstain", kind: "research", honesty: "RESEARCH", weights: "card-only", inferHere: false, bench: "grounded-only adapter", whatNot: "Not trained here." },
  { hub: "SZLHOLDINGS/szl-training-scripts", name: "szl-training-scripts", kind: "research", honesty: "RESEARCH", weights: "card-only", inferHere: false, bench: "forge scripts · not a checkpoint", whatNot: "Not weights. Not 1.5B trained here." },
  { hub: "SZLHOLDINGS/a11oy-v19-substrate", name: "a11oy-v19-substrate", kind: "research", honesty: "RESEARCH", weights: "card-only", inferHere: false, bench: "Zarf/UDS payload", whatNot: "Not a chatbot. Not TinyKhipu." },
  { hub: "SZLHOLDINGS/WILLAY", name: "WILLAY", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "no weights", whatNot: "Signed-refusal specialist. Do not treat as trained." },
  { hub: "SZLHOLDINGS/A11OY-MINI", name: "A11OY-MINI", kind: "roadmap", honesty: "ROADMAP", weights: "gguf RESEARCH", inferHere: false, bench: "no signed eval receipt", whatNot: "Convenience card." },
  { hub: "SZLHOLDINGS/KILLINCHU-EYE", name: "KILLINCHU-EYE", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "no weights", whatNot: "Not a CUAS product checkpoint." },
  { hub: "SZLHOLDINGS/qantu", name: "qantu", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "name only", whatNot: "Do not mint weights." },
  { hub: "SZLHOLDINGS/waman", name: "waman", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "name only", whatNot: "Do not mint weights." },
  { hub: "SZLHOLDINGS/chakana", name: "chakana", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "name only", whatNot: "Do not mint weights." },
  { hub: "SZLHOLDINGS/tinku", name: "tinku", kind: "roadmap", honesty: "ROADMAP", weights: "none", inferHere: false, bench: "name only", whatNot: "Do not mint weights." },
  { hub: "SZLHOLDINGS/SZLHOLDINGS", name: "SZLHOLDINGS stub", kind: "stub", honesty: "UNAVAILABLE", weights: "none", inferHere: false, bench: "org stub", whatNot: "Not a checkpoint." },
];

export const HUB_LIVE = HUB_ESTATE.filter((c) => c.inferHere);
export const HUB_NANO = HUB_ESTATE.filter((c) => c.kind === "nano");
