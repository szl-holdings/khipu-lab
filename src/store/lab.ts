import { create } from "zustand";
import type { Frontier, PlaySlug, Receipt, Verdict } from "@/lib/types";
import { DEFAULT_FRONTIERS } from "@/lib/catalog/frontiers";
import { loadFrontiers, loadLedger, mergeFrontiers, saveFrontiers, saveLedger, saveUi } from "@/lib/persist/storage";

type LabState = {
  receipts: Receipt[];
  frontiers: Frontier[];
  running: boolean;
  lastPlay: PlaySlug | null;
  hydrate: () => void;
  pushReceipt: (r: Receipt) => void;
  beatFrontier: (id: string, value: number, receiptId: string, verdict: Verdict) => boolean;
  setRunning: (v: boolean) => void;
  rememberPlay: (play: PlaySlug) => void;
};

function head(receipts: Receipt[]) {
  return receipts[0]?.sha256 ?? null;
}

export const useLab = create<LabState>((set, get) => ({
  receipts: [],
  frontiers: DEFAULT_FRONTIERS,
  running: false,
  lastPlay: null,
  hydrate: () => {
    const receipts = loadLedger();
    const stored = loadFrontiers();
    set({
      receipts,
      frontiers: mergeFrontiers(stored, DEFAULT_FRONTIERS),
    });
  },
  pushReceipt: (r) => {
    const next = [r, ...get().receipts].slice(0, 80);
    saveLedger(next);
    set({ receipts: next });
  },
  beatFrontier: (id, value, receiptId, verdict) => {
    if (verdict !== "proved") return false;
    const rows = get().frontiers.map((f) => {
      if (f.id !== id) return f;
      const better = f.direction === "min" ? value < f.best : value > f.best;
      if (!better) return { ...f, attempts: f.attempts + 1 };
      return {
        ...f,
        best: value,
        receiptId,
        attempts: f.attempts + 1,
        beatenAt: Date.now(),
      };
    });
    saveFrontiers(rows);
    set({ frontiers: rows });
    const f = rows.find((x) => x.id === id);
    return Boolean(f && f.receiptId === receiptId);
  },
  setRunning: (v) => set({ running: v }),
  rememberPlay: (play) => {
    saveUi({ play });
    set({ lastPlay: play });
  },
}));

export function ledgerHead() {
  return head(useLab.getState().receipts);
}
