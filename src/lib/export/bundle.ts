import type { Frontier, Receipt } from "@/lib/types";

export const BUNDLE_SCHEMA = "szl.khipu.bundle.v1" as const;

/** Labeled honesty. Not a proof. Not 1.5B weights. */
export const HONESTY_NOTES = [
  "SHA-256 in browser, SHA3-256 on metal",
  "Λ Conjecture 1 OPEN",
  "energy UNAVAILABLE",
  "not 1.5B weights",
] as const;

export type LedgerBundle = {
  schema: typeof BUNDLE_SCHEMA;
  exportedAt: string;
  receipts: Receipt[];
  frontiers: Frontier[];
  honesty: string[];
};

export function ledgerBundle(receipts: Receipt[], frontiers: Frontier[]): LedgerBundle {
  return {
    schema: BUNDLE_SCHEMA,
    exportedAt: new Date().toISOString(),
    receipts: receipts.slice(),
    frontiers: frontiers.slice(),
    honesty: [...HONESTY_NOTES],
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
