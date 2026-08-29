import type { Frontier, Receipt } from "@/lib/types";
import { CUT_PUBLICATION, ORIGINS } from "@/lib/catalog/rails";
import { DOCTRINE } from "@/lib/szl/doctrine";

export const RECORD_DRAFT_SCHEMA = "szl.khipu.record.draft.v1" as const;

/** Draft pointer for a11oy.net. Not signed. Not published. Not a Hub card. */
export function recordDraft(receipts: Receipt[], frontiers: Frontier[]) {
  return {
    schema: RECORD_DRAFT_SCHEMA,
    honesty: "DRAFT pointer. Not a published RECORD. Not signed. proven_trust locked false.",
    destination: ORIGINS.proof.url,
    not_destination: [ORIGINS.product.url, "https://a11oy.com"],
    hub: ORIGINS.hub.url,
    product: ORIGINS.product.url,
    doctrine: {
      version: DOCTRINE.version,
      kernelCommit: DOCTRINE.kernelCommit,
      lockedProvenCount: DOCTRINE.lockedProvenCount,
      conjecture1: "OPEN",
      energy: "UNAVAILABLE",
      proven_trust: DOCTRINE.provenTrust,
    },
    cuts: CUT_PUBLICATION.map((c) => ({
      frontierId: c.frontierId,
      name: c.name,
      lab: c.lab,
      hub: c.hub,
      hubUrl: c.hubUrl,
      proof: c.proof,
      proofNote: c.proofNote,
      product: c.product,
      whatNot: c.whatNot,
      bound: frontiers.find((f) => f.id === c.frontierId) ?? null,
    })),
    receiptIndex: receipts.slice(0, 24).map((r) => ({
      id: r.id,
      sha256: r.sha256,
      subject: r.subject,
      verdict: r.lambda.verdict,
      ts: r.ts,
    })),
    mintedAt: new Date().toISOString(),
    thisLabCannot: [
      "write huggingface.co/SZLHOLDINGS",
      "append a11oy.net RECORD",
      "mutate a-11-oy.com",
    ],
  };
}
