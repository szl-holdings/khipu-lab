import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tiledAttn, naiveAttn } from "./attn.ts";
import { yarqaAttn } from "./yarqa.ts";
import { wgm, uniformWeights, checkA2, checkA3, checkA4, checkA1 } from "./lambda.ts";
import { rmsNorm } from "./norm.ts";
import { loopTax, OUROBOROS_SELFCHECK } from "./ouroboros.ts";
import { randomMat, dot, norm2 } from "./tensor.ts";
import { denyByDefault } from "./blocked.ts";
import { evaluateAnatomy } from "./anatomy.ts";
import { enqueueAll, drain, runChaski } from "./chaski.ts";
import { runAyni } from "./ayni.ts";
import { decodeRs, encodeRs, runShard, SHARD_K, SHARD_N } from "./shard.ts";

describe("lambda WGM", () => {
  it("zero-routes on a 0 axis", () => {
    const w = uniformWeights(4);
    assert.equal(wgm([0.9, 0.9, 0, 0.9], w), 0);
  });
  it("A2 A3 A4 hold on a random interior point", () => {
    const x = [0.4, 0.6, 0.8, 0.5];
    const w = uniformWeights(4);
    assert.equal(checkA2(x, w), true);
    assert.equal(checkA3(w), true);
    assert.equal(checkA4(x, w), true);
    assert.equal(checkA1(x, w), true);
  });
  it("Egyptian-exact Λ(c..c)=c", () => {
    const w = uniformWeights(13);
    assert.ok(Math.abs(wgm(w.map(() => 0.7), w) - 0.7) < 1e-9);
  });
});

describe("attention", () => {
  it("tiled matches naive within 1e-5", () => {
    const Q = randomMat(8, 4, 11, 0.5);
    const K = randomMat(8, 4, 12, 0.5);
    const V = randomMat(8, 4, 13, 0.5);
    const t = tiledAttn(Q, K, V, 4, 4);
    void naiveAttn(Q, K, V);
    assert.ok(t.residual < 1e-5, `residual ${t.residual}`);
  });
  it("YARQA leaks nothing across canals", () => {
    const Q = randomMat(12, 4, 3, 0.4);
    const K = randomMat(12, 4, 4, 0.4);
    const V = randomMat(12, 4, 5, 0.4);
    const y = yarqaAttn(Q, K, V, 4);
    assert.ok(y.leaked < 1e-12, `leaked ${y.leaked}`);
  });
});

describe("identities", () => {
  it("Cauchy–Schwarz holds", () => {
    const u = [0.2, -0.4, 0.9];
    const v = [1.1, 0.3, -0.2];
    assert.ok(dot(u, v) ** 2 <= norm2(u) ** 2 * norm2(v) ** 2 + 1e-12);
  });
  it("RMSNorm unit RMS", () => {
    const x = randomMat(4, 8, 9, 1);
    const r = rmsNorm(x, Array(8).fill(1));
    assert.ok(r.unitRms < 5e-5, `unitRms ${r.unitRms}`);
  });
});

describe("ouroboros + blocked", () => {
  it("selfcheck arithmetic", () => {
    assert.equal(OUROBOROS_SELFCHECK.modelMs, 1120);
    assert.equal(OUROBOROS_SELFCHECK.peakAttemptMs, 900);
    assert.equal(OUROBOROS_SELFCHECK.overheadMs, 180);
    assert.equal(OUROBOROS_SELFCHECK.serializationTaxMs, 220);
    assert.equal(OUROBOROS_SELFCHECK.deadHopMs, 220);
  });
  it("loop tax matches", () => {
    const t = loopTax(
      [
        { ok: false, ms: 220 },
        { ok: true, ms: 900 },
      ],
      1300,
      4,
    );
    assert.equal(t.exit, "converged");
  });
  it("BLOCKED output is always null", () => {
    const d = denyByDefault(false, false, true);
    assert.equal(d.blocked, true);
    assert.equal(d.output, null);
  });
});

describe("anatomy organ integrity", () => {
  it("default cycle is 5/5 LIVE and not blocked", () => {
    const ev = evaluateAnatomy({}, 11);
    assert.equal(ev.liveCount, 5);
    assert.equal(ev.blocked, false);
    assert.equal(ev.lockedProven, 8);
    assert.equal(ev.conjecture1, "OPEN");
    assert.equal(ev.energy, "UNAVAILABLE");
    assert.equal(ev.lambdaAdvisory, true);
  });
  it("zero heart fail-closes HEART and the body", () => {
    const ev = evaluateAnatomy({ zeroHeart: 1 }, 11);
    const heart = ev.organs.find((o) => o.id === "heart");
    assert.equal(heart?.status, "DOWN");
    assert.equal(ev.blocked, true);
    assert.ok(ev.liveCount < 5);
  });
  it("canal leak fail-closes BRAIN", () => {
    const ev = evaluateAnatomy({ leakCanal: 1 }, 11);
    assert.equal(ev.organs.find((o) => o.id === "brain")?.status, "DOWN");
    assert.equal(ev.blocked, true);
  });
  it("yawar tamper fail-closes CIRCULATORY", () => {
    const ev = evaluateAnatomy({ tamperChain: 1 }, 11);
    assert.equal(ev.organs.find((o) => o.id === "circulatory")?.status, "DOWN");
    assert.equal(ev.blocked, true);
  });
  it("fabricated joule fail-closes NERVOUS", () => {
    const ev = evaluateAnatomy({ fabricateJoule: 1 }, 11);
    const nerve = ev.organs.find((o) => o.id === "nervous");
    assert.equal(nerve?.status, "DOWN");
    assert.equal(nerve?.honesty, "UNAVAILABLE");
    assert.equal(ev.energy, "UNAVAILABLE");
    assert.equal(ev.blocked, true);
  });
  it("sorry painted green fail-closes SKELETON", () => {
    const ev = evaluateAnatomy({ breakSkeleton: 1 }, 11);
    assert.equal(ev.organs.find((o) => o.id === "skeleton")?.status, "DOWN");
    assert.equal(ev.lockedProven, 8);
  });
  it("WILLAY veto blocks even when organs are LIVE", () => {
    const ev = evaluateAnatomy({ willayFire: 1 }, 11);
    assert.equal(ev.liveCount, 5);
    assert.equal(ev.willay.refused, true);
    assert.equal(ev.blocked, true);
    assert.equal(ev.willay.classifiers.length, 5);
  });
});

describe("chaski FIFO", () => {
  it("drain(enqueueAll([], msgs)) = msgs", () => {
    const bodies = [3, 1, 4, 1, 5];
    assert.deepEqual(drain(enqueueAll(bodies)), bodies);
  });
  it("clean run holds", () => {
    const y = runChaski(11, {});
    assert.equal(y.fifoHold, 1);
    assert.equal(y.broken, 0);
    assert.equal(y.chainBreaks, 0);
  });
  it("swap fail-closes", () => {
    const y = runChaski(11, { reorder: 1 });
    assert.equal(y.fifoHold, 0);
    assert.ok(y.reorder > 0 || y.chainBreaks > 0);
    assert.equal(y.broken, 1);
  });
  it("drop fail-closes", () => {
    const y = runChaski(11, { drop: 1 });
    assert.equal(y.fifoHold, 0);
    assert.equal(y.broken, 1);
    assert.equal(y.n, 7);
  });
});

describe("ayni reciprocity", () => {
  it("identity skip conserves the bus", () => {
    const y = runAyni(11, 0);
    assert.ok(y.leak < 1e-12, `leak ${y.leak}`);
    assert.ok(y.mass < 1e-12, `mass ${y.mass}`);
  });
  it("scaled skip leaks", () => {
    const y = runAyni(11, 1);
    assert.ok(y.leak > 1e-3, `leak ${y.leak}`);
  });
});

describe("shard RS(10,6) GF(257)", () => {
  it("full codeword recovers", () => {
    const y = runShard(11);
    assert.equal(y.live, SHARD_N);
    assert.equal(y.recovered, 1);
    assert.deepEqual(y.decoded, y.data);
  });
  it("any 6 of 10 recover", () => {
    const y = runShard(7);
    const data = y.data;
    const code = encodeRs(data);
    const keep = [0, 2, 3, 5, 8, 9];
    const points = code.map((v, i) => (keep.includes(i) ? { x: i + 1, y: v } : null));
    const decoded = decodeRs(points);
    assert.deepEqual(decoded, data);
  });
  it("5 of 10 cannot recover", () => {
    const mask = (1 << (SHARD_K - 1)) - 1;
    const y = runShard(11, mask);
    assert.equal(y.live, 5);
    assert.equal(y.recovered, 0);
    assert.equal(y.decoded, null);
  });
});
