import { create } from "zustand";
import {
  DIGEST_NOTE,
  ZERO,
  type Receipt,
  receiptDigest,
  verifyChain,
} from "./crypto";

type AtlasState = {
  receipts: Receipt[];
  demoKey: string;
  emit: (op: string, kernel: string, payload: Record<string, unknown>) => Promise<Receipt>;
  verify: () => Promise<{ ok: boolean; depth: number; firstBreak: number }>;
  tamperLast: () => void;
  reset: () => void;
};

export const useAtlas = create<AtlasState>((set, get) => ({
  receipts: [],
  demoKey: "szl-demo-ephemeral-not-ecdsa-p256",
  emit: async (op, kernel, payload) => {
    const prev = get().receipts.at(-1)?.digest ?? ZERO;
    const seq = get().receipts.length;
    const draft: Omit<Receipt, "digest"> = {
      seq,
      op,
      kernel,
      payload,
      prev,
      alg: "SHA-256",
      note: DIGEST_NOTE,
    };
    const digest = await receiptDigest(draft);
    const rec = { ...draft, digest };
    set({ receipts: [...get().receipts, rec] });
    return rec;
  },
  verify: () => verifyChain(get().receipts),
  tamperLast: () => {
    const list = get().receipts;
    if (!list.length) return;
    const last = { ...list[list.length - 1], payload: { ...list[list.length - 1].payload, tampered: true } };
    set({ receipts: [...list.slice(0, -1), last] });
  },
  reset: () => set({ receipts: [] }),
}));
