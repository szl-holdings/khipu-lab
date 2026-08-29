/** PrefixWitness — radix-prefix KV digest. Original cut of SGLang RadixAttention.
 *  A poisoned cache after digest fail-closes. Not SGLang. No tokens/s claim. */

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export const PREFIX_STEMS = ["NAV", "NAV ABSTAIN", "YUYAY", "YUYAY WILLAY ARI"] as const;

export type PrefixNode = {
  prefix: string;
  kv: string;
  digest: string;
};

export function longestHit(query: string, nodes: PrefixNode[]): PrefixNode | null {
  let best: PrefixNode | null = null;
  for (const n of nodes) {
    if (query === n.prefix || query.startsWith(`${n.prefix} `)) {
      if (!best || n.prefix.length > best.prefix.length) best = n;
    }
  }
  return best;
}

export function runPrefix(seed: number, hijack = 0, query = "NAV") {
  const nodes: PrefixNode[] = PREFIX_STEMS.map((prefix) => {
    const kv = `kv:${seed}:${prefix}`;
    return { prefix, kv, digest: djb2(kv) };
  });
  const claimed = nodes.map((n) => n.digest).join("|");
  if (hijack === 1) {
    nodes[0] = { ...nodes[0], kv: `${nodes[0].kv}#POISON` };
  }
  const now = nodes.map((n) => djb2(n.kv)).join("|");
  const hit = longestHit(query, nodes);
  const hitOk = hit != null && djb2(hit.kv) === hit.digest;
  const hold = now === claimed && hitOk && hijack !== 1 ? 1 : 0;
  return {
    hold,
    broken: hold ? 0 : 1,
    hijack: hijack === 1 ? 1 : 0,
    hitOk: hitOk ? 1 : 0,
    nodes,
    query,
    hit: hit?.prefix ?? "∅",
    hitDigest: hit?.digest ?? "",
    claimed,
    now,
    reason: hold
      ? "PrefixWitness HOLDS · radix digest matches · not SGLang · no tokens/s claim"
      : "PrefixWitness BROKEN · cached KV mutated after digest · fail closed · not a silent reuse",
  };
}
