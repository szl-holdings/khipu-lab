/** Live estate bench. Kernel is truth. Surrogates are REPORTED. */

import { evaluateGreenLight } from "@/lib/math/greenlight";
import { evaluateAnatomy } from "@/lib/math/anatomy";
import { evaluateLambda, defaultYuyay } from "@/lib/math/lambda";
import { yarqaAttn } from "@/lib/math/yarqa";
import { runChaski } from "@/lib/math/chaski";
import { runAyni } from "@/lib/math/ayni";
import { runShard } from "@/lib/math/shard";
import { runBay } from "@/lib/math/bay";
import { runPrefix } from "@/lib/math/prefix";
import { runRoute } from "@/lib/math/route";
import { runGovSign } from "@/lib/math/govsign";
import { runInvariants } from "@/lib/math/invariants";
import { randomMat } from "@/lib/math/tensor";

export type BenchRow = {
  id: string;
  name: string;
  metric: string;
  value: number;
  pass: boolean;
  honesty: "LIVE" | "ADVISORY" | "REPORTED";
  note: string;
};

export function benchKernels(seed = 11): BenchRow[] {
  const axes = defaultYuyay();
  const lam = evaluateLambda(axes);
  const Q = randomMat(12, 4, seed, 1);
  const K = randomMat(12, 4, seed + 3, 1);
  const V = randomMat(12, 4, seed + 5, 1);
  const yq = yarqaAttn(Q, K, V, 4);
  const green = evaluateGreenLight({});
  const sorry = evaluateGreenLight({ paintSorry: 1 });
  const body = evaluateAnatomy({}, seed);
  const heart = evaluateAnatomy({ zeroHeart: 1 }, seed);
  const fifo = runChaski(seed, { reorder: 0, drop: 0, n: 8 });
  const ayni = runAyni(seed, 0);
  const shard = runShard(seed, (1 << 10) - 1);
  const bay = runBay({});
  const prefix = runPrefix(seed, 0);
  const route = runRoute(seed, 0);
  const gov = runGovSign(seed, 0);
  const inv = runInvariants({});

  return [
    {
      id: "lambda",
      name: "Λ gate",
      metric: "blocked",
      value: lam.blocked ? 1 : 0,
      pass: !lam.blocked,
      honesty: "ADVISORY",
      note: "Conjecture 1 OPEN · proven_trust false",
    },
    {
      id: "yarqa",
      name: "YARQA canals",
      metric: "leaked",
      value: yq.leaked,
      pass: yq.leaked <= 1e-9,
      honesty: "LIVE",
      note: "Not SageAttention · CUDA UNAVAILABLE",
    },
    {
      id: "greenlight",
      name: "GreenLight Ari",
      metric: "greenlit",
      value: green.greenlit,
      pass: green.greenlit === 1 && sorry.blocked === 1,
      honesty: "LIVE",
      note: "sorry cannot paint · dual of Willay",
    },
    {
      id: "anatomy",
      name: "Kay Pacha",
      metric: "liveCount",
      value: body.liveCount,
      pass: body.liveCount === 5 && heart.blocked,
      honesty: "LIVE",
      note: "zero HEART fail-closes",
    },
    {
      id: "chaski",
      name: "Chaski FIFO",
      metric: "broken",
      value: fifo.broken,
      pass: fifo.fifoHold === 1,
      honesty: "LIVE",
      note: "kernel, not a Hub checkpoint",
    },
    {
      id: "ayni",
      name: "Ayni",
      metric: "leak",
      value: ayni.leak,
      pass: ayni.leak < 1e-9,
      honesty: "LIVE",
      note: "Not a ResNet weight",
    },
    {
      id: "shard",
      name: "ShardWitness",
      metric: "recovered",
      value: shard.recovered ? 1 : 0,
      pass: Boolean(shard.recovered),
      honesty: "LIVE",
      note: "RS(10,6) CHECKED ≠ Lean PROVEN",
    },
    {
      id: "bay",
      name: "Evidence Bay",
      metric: "collapsed",
      value: bay.collapsed,
      pass: bay.collapsed === 0,
      honesty: "LIVE",
      note: "four rails · Space is not proof",
    },
    {
      id: "prefix",
      name: "PrefixWitness",
      metric: "hold",
      value: prefix.hold,
      pass: prefix.hold === 1,
      honesty: "LIVE",
      note: "original cut of RadixAttention · not SGLang",
    },
    {
      id: "route",
      name: "RouteWitness",
      metric: "hold",
      value: route.hold,
      pass: route.hold === 1,
      honesty: "LIVE",
      note: "original cut of Mixtral routing · not Mixtral",
    },
    {
      id: "govsign",
      name: "GovEnvelope",
      metric: "hold",
      value: gov.hold,
      pass: gov.hold === 1,
      honesty: "LIVE",
      note: "STRUCTURAL-ONLY · never a fake key",
    },
    {
      id: "invariants",
      name: "Invariants",
      metric: "broken",
      value: inv.broken,
      pass: inv.broken === 0,
      honesty: "LIVE",
      note: "locked-8 · energy UNAVAILABLE",
    },
  ];
}
