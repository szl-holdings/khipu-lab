import { mulberry32 } from "./tensor.ts";

/** Hash-chained runner FIFO. F7 silhouette: drain(enqueueAll([], msgs)) = msgs.
 *  A swap or drop is BLOCKED — not retried. Not a Kafka rehost. */

export type ChaskiMsg = {
  seq: number;
  body: number;
  prev: string;
  digest: string;
};

const GENESIS = "00000000";

export function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function enqueueAll(bodies: number[], genesis = GENESIS): ChaskiMsg[] {
  const out: ChaskiMsg[] = [];
  let prev = genesis;
  for (let i = 0; i < bodies.length; i++) {
    const digest = djb2(`${i}|${bodies[i]}|${prev}`);
    out.push({ seq: i, body: bodies[i], prev, digest });
    prev = digest;
  }
  return out;
}

export function drain(queue: ChaskiMsg[]): number[] {
  return queue.map((m) => m.body);
}

export function verifyChain(msgs: ChaskiMsg[]): { chainBreaks: number; reorder: number } {
  let chainBreaks = 0;
  let reorder = 0;
  let prev = GENESIS;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    const expect = djb2(`${m.seq}|${m.body}|${m.prev}`);
    if (m.digest !== expect) chainBreaks += 1;
    if (m.prev !== prev) chainBreaks += 1;
    if (m.seq !== i) reorder += 1;
    prev = m.digest;
  }
  return { chainBreaks, reorder };
}

export function swapAdjacent(msgs: ChaskiMsg[], at: number): ChaskiMsg[] {
  const q = msgs.map((m) => ({ ...m }));
  if (at < 0 || at >= q.length - 1) return q;
  const tmp = q[at];
  q[at] = q[at + 1];
  q[at + 1] = tmp;
  return q;
}

export function dropAt(msgs: ChaskiMsg[], at: number): ChaskiMsg[] {
  return msgs.filter((_, i) => i !== at).map((m) => ({ ...m }));
}

export type ChaskiRun = {
  n: number;
  broken: number;
  reorder: number;
  chainBreaks: number;
  dropped: number;
  fifoHold: number;
  queue: ChaskiMsg[];
  bodies: number[];
};

export function runChaski(
  seed: number,
  flags: { reorder?: number; drop?: number; n?: number } = {},
): ChaskiRun {
  const rng = mulberry32(seed);
  const n = Math.max(3, Math.min(12, flags.n ?? 8));
  const bodies = Array.from({ length: n }, () => (rng() * 1000) | 0);
  let q = enqueueAll(bodies);
  if (flags.reorder === 1) q = swapAdjacent(q, Math.min(2, q.length - 2));
  if (flags.drop === 1) q = dropAt(q, q.length - 1);
  const v = verifyChain(q);
  const drained = drain(q);
  const orderHold =
    flags.drop !== 1 && drained.length === bodies.length && drained.every((b, i) => b === bodies[i]);
  const fifoHold = orderHold && v.chainBreaks === 0 && v.reorder === 0 ? 1 : 0;
  return {
    n: q.length,
    broken: fifoHold ? 0 : 1,
    reorder: v.reorder,
    chainBreaks: v.chainBreaks,
    dropped: flags.drop === 1 ? 1 : 0,
    fifoHold,
    queue: q,
    bodies,
  };
}
