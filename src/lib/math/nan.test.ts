import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enqueueAll, drain, runChaski } from "./chaski.ts";
import { runAyni } from "./ayni.ts";
import { decodeRs, encodeRs, runShard, SHARD_K, SHARD_N } from "./shard.ts";
import { evaluateBay, runBay } from "./bay.ts";

describe("chaski FIFO", () => {
  it("drain(enqueueAll([], msgs)) = msgs", () => {
    const bodies = [3, 1, 4, 1, 5];
    const q = enqueueAll(bodies);
    assert.deepEqual(drain(q), bodies);
  });
  it("clean run holds", () => {
    const y = runChaski(11, {});
    assert.equal(y.fifoHold, 1);
    assert.equal(y.broken, 0);
  });
  it("swap fail-closes", () => {
    const y = runChaski(11, { reorder: 1 });
    assert.equal(y.fifoHold, 0);
    assert.ok(y.broken >= 1);
  });
  it("drop fail-closes", () => {
    const y = runChaski(11, { drop: 1 });
    assert.equal(y.fifoHold, 0);
    assert.ok(y.broken >= 1);
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
    assert.equal(y.data.length, SHARD_K);
    assert.ok(y.decoded);
  });
  it("any 6 of 10 recover", () => {
    const y = runShard(7);
    const pts = y.code.map((v, i) => ({ x: i + 1, y: v })).filter((_, i) => i % 2 === 0 || i === 1);
    assert.ok(pts.length >= 6);
    const dec = decodeRs(pts.slice(0, 6));
    assert.ok(dec);
    assert.deepEqual(dec, y.data);
  });
  it("5 of 10 cannot recover", () => {
    const y = runShard(7);
    const pts = encodeRs(y.data).map((v, i) => ({ x: i + 1, y: v })).slice(0, 5);
    assert.equal(decodeRs(pts), null);
    const mask = (1 << 5) - 1;
    const knocked = runShard(7, mask);
    assert.equal(knocked.live, 5);
    assert.equal(knocked.recovered, 0);
  });
});

describe("evidence bay", () => {
  it("default occupancy is four rails, not blocked", () => {
    const ev = evaluateBay({});
    assert.equal(ev.blocked, false);
    assert.equal(ev.collapsed, 0);
    assert.equal(ev.occupancy.transport.length, 2);
    assert.equal(ev.occupancy.evidence.length, 2);
    assert.equal(ev.occupancy.verification.length, 2);
    assert.equal(ev.occupancy.authority.length, 2);
  });
  it("RECORD on the product origin fail-closes", () => {
    const y = runBay({ proofIntoProduct: 1 });
    assert.equal(y.blocked, 1);
    assert.ok(y.collapsed >= 1);
  });
  it("Hub listing as proof fail-closes", () => {
    const y = runBay({ hubAsProof: 1 });
    assert.equal(y.blocked, 1);
  });
  it("RUNNING Space as receipt fail-closes", () => {
    const y = runBay({ spaceAsReceipt: 1 });
    assert.equal(y.blocked, 1);
  });
});
