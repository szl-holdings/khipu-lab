import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ARM_JOBS,
  CUTS,
  DEFAULT_FRONTIERS,
  ESSAY_NAV,
  NAN_CUT,
  cutBySubject,
  frontierForSubject,
  labNav,
} from "./cuts.ts";

describe("cut registry", () => {
  it("ids and subjects are unique", () => {
    const ids = CUTS.map((c) => c.id);
    const subjects = CUTS.map((c) => c.subject.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(subjects).size, subjects.length);
  });

  it("board, arm, and nav are derived, not copied", () => {
    assert.equal(DEFAULT_FRONTIERS.length, CUTS.length);
    assert.equal(
      ARM_JOBS.length,
      CUTS.filter((c) => c.arm).length,
    );
    for (const c of CUTS) {
      assert.equal(frontierForSubject(c.subject.id), c.id);
      assert.equal(cutBySubject(c.subject.id)?.id, c.id);
      const nav = labNav(c.id);
      assert.equal(nav.play, c.play);
      if (c.navCut) assert.equal(nav.search?.cut, c.navCut);
    }
  });

  it("Ñan dispatch indices are stable", () => {
    const nan = CUTS.filter((c) => c.nanIndex != null);
    for (const c of nan) {
      assert.equal(NAN_CUT[c.id as keyof typeof NAN_CUT], c.nanIndex);
      const job = ARM_JOBS.find((j) => j.params?.cut === c.nanIndex);
      assert.ok(job, `missing arm job for ${c.id}`);
      assert.equal(job?.play, "frontier");
    }
  });

  it("attn modes are three subjects, not one", () => {
    assert.equal(cutBySubject("k.attn")?.id, "tilereceipt");
    assert.equal(cutBySubject("k.scoremod")?.id, "scoremod");
    assert.equal(cutBySubject("k.blockwitness")?.id, "blockwitness");
    assert.equal(cutBySubject("k.tiledigest")?.id, "tiledigest");
    assert.equal(labNav("scoremod").search?.cut, "scoremod");
    assert.equal(labNav("blockwitness").play, "attn");
    assert.equal(labNav("tiledigest").search?.cut, "tiledigest");
  });

  it("essay rows land on the kernel that enforces them", () => {
    assert.equal(labNav("govenvelope").search?.cut, "govsign");
    assert.equal(labNav("bindforge").search?.cut, "greenlight");
    assert.equal(labNav("receiptrail").search?.cut, "bay");
    assert.equal(labNav("joulenull").play, "anatomy");
    assert.equal(ESSAY_NAV.khipu.play, "khipu");
  });

  it("training plays are not armed", () => {
    assert.equal(CUTS.find((c) => c.id === "moons-loss")?.arm, false);
    assert.equal(CUTS.find((c) => c.id === "abstain")?.arm, false);
    assert.equal(CUTS.find((c) => c.id === "embed-replay")?.arm, false);
    assert.ok(ARM_JOBS.every((j) => j.play !== "moons" && j.play !== "khipu"));
  });
});
