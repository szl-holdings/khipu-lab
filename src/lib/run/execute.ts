import { naiveAttn, tiledAttn, maskModAttn, futureMass } from "@/lib/math/attn";
import { yarqaAttn } from "@/lib/math/yarqa";
import { rmsNorm, blockKvGather } from "@/lib/math/norm";
import { defaultYuyay, evaluateLambda } from "@/lib/math/lambda";
import { runFormulas, structuralPuriq } from "@/lib/math/formulas";
import { loopTax } from "@/lib/math/ouroboros";
import { denyByDefault } from "@/lib/math/blocked";
import { evaluateAnatomy } from "@/lib/math/anatomy";
import { runChaski } from "@/lib/math/chaski";
import { runAyni } from "@/lib/math/ayni";
import { runShard, SHARD_N } from "@/lib/math/shard";
import { runBay } from "@/lib/math/bay";
import { randomMat } from "@/lib/math/tensor";
import type { Mat } from "@/lib/math/tensor";
import type { PlaySlug } from "@/lib/types";
import { NAN_CUT } from "@/lib/catalog/plays";

export type RunFace = {
  metrics: Record<string, number>;
  boundMetric: string;
  boundEps: number;
  direction: "lte" | "gte";
  subjectId: string;
  version: number;
  kind: "kernel" | "model" | "formula" | "frontier";
  note: string;
  heatmap?: Mat;
  canals?: number[];
  extra?: Record<string, unknown>;
};

export function runPlay(play: PlaySlug, seed: number, params: Record<string, number> = {}): RunFace {
  if (play === "attn") {
    const n = 8;
    const d = 4;
    const tile = params.tile ?? 4;
    const mode = params.mode ?? 0;
    const Q = randomMat(n, d, seed, 0.6);
    const K = randomMat(n, d, seed + 3, 0.6);
    const V = randomMat(n, d, seed + 5, 0.6);
    const tiled = tiledAttn(Q, K, V, tile, tile);
    const naive = naiveAttn(Q, K, V);
    const masked = maskModAttn(Q, K, V);
    const causal = maskModAttn(Q, K, V, 0);
    const pages = V;
    const defaultTable = [0, 2, 4, 6, 1, 3, 5, 7];
    const table = defaultTable.map((fallback, i) =>
      Number.isFinite(params[`p${i}`]) ? params[`p${i}`] : fallback,
    );
    const gathered = blockKvGather(pages, table);
    const maskFuture = futureMass(masked.probs);
    const causalFuture = futureMass(causal.probs);
    let residual = 0;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < d; c++) {
        residual = Math.max(residual, Math.abs(tiled.out[i][c] - naive.out[i][c]));
      }
    }
    let maskVsCausal = 0;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < d; c++) {
        maskVsCausal = Math.max(maskVsCausal, Math.abs(masked.out[i][c] - causal.out[i][c]));
      }
    }
    const differs = gathered.tableDigestSeed === defaultTable.join(",") ? 0 : 1;
    const tableChanged = params.swapped === 1 ? 1 : differs;
    const gatherRows = gathered.gathered.length;
    const identity: Mat = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    );
    const perm: Mat = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (table[i] === j ? 1 : 0)),
    );
    const metrics: Record<string, number> = {
      residual,
      maskFuture,
      pages: table.length,
    };
    const extra = {
      gathered: gathered.gathered,
      table,
      digest: gathered.tableDigestSeed,
      identity,
      perm,
      maskVsCausal,
      causalFuture,
      naiveFuture: futureMass(naive.probs),
    };

    if (mode === 1) {
      return {
        metrics: { ...metrics, maskOffDiag: maskFuture },
        boundMetric: "maskFuture",
        boundEps: 1e-6,
        direction: "lte",
        subjectId: "k.attn",
        version: 1,
        kind: "kernel",
        note: "ScoreMod causal mask · future mass vs 0 · not a FlexAttention rehost",
        heatmap: masked.probs,
        extra,
      };
    }
    if (mode === 2) {
      const expected = Number.isFinite(params.tableChanged) ? params.tableChanged : tableChanged;
      return {
        metrics: { ...metrics, tableChanged, gatherRows },
        boundMetric: "tableChanged",
        boundEps: expected,
        direction: expected === 1 ? "gte" : "lte",
        subjectId: "k.attn",
        version: 1,
        kind: "kernel",
        note:
          params.swapped === 1 || tableChanged === 1
            ? "block-table digest changed"
            : "BlockWitness paged-KV gather · SHA-256 silhouette of SHA3 table digest · no tokens/s claim",
        heatmap: identity,
        extra,
      };
    }
    return {
      metrics,
      boundMetric: "residual",
      boundEps: 1e-5,
      direction: "lte",
      subjectId: "k.attn",
      version: 1,
      kind: "kernel",
      note: "TileReceipt vs naive · SHA-256 silhouette of SHA3 chain · no speedup claim",
      heatmap: tiled.probs,
      extra,
    };
  }
  if (play === "yarqa") {
    const n = 12;
    const d = 4;
    const canal = params.canal ?? 4;
    const Q = randomMat(n, d, seed, 0.5);
    const K = randomMat(n, d, seed + 1, 0.5);
    const V = randomMat(n, d, seed + 2, 0.5);
    const y = yarqaAttn(Q, K, V, canal);
    return {
      metrics: { leaked: y.leaked, canals: y.canals.length - 1 },
      boundMetric: "leaked",
      boundEps: 1e-9,
      direction: "lte",
      subjectId: "k.yarqa",
      version: 1,
      kind: "kernel",
      note: "YARQA canal attention — original cut, not SageAttention",
      heatmap: y.probs,
      canals: y.canals,
    };
  }
  if (play === "lambda") {
    const axes = defaultYuyay().map((f, i) => {
      const key = `a${i}`;
      return params[key] ?? f;
    });
    const ev = evaluateLambda(axes);
    return {
      metrics: { lambda: ev.value, blocked: ev.blocked ? 1 : 0 },
      boundMetric: "blocked",
      boundEps: 0,
      direction: "lte",
      subjectId: "k.lambda",
      version: 1,
      kind: "kernel",
      note: ev.reason,
      extra: { axes, axioms: ev.axioms, value: ev.value },
    };
  }
  if (play === "norm") {
    const x = randomMat(8, 8, seed, 1);
    const gamma = Array(8).fill(1);
    const r = rmsNorm(x, gamma);
    return {
      metrics: { unitRms: r.unitRms, rms0: r.rms[0] },
      boundMetric: "unitRms",
      boundEps: 1e-4,
      direction: "lte",
      subjectId: "k.norm",
      version: 1,
      kind: "kernel",
      note: "Governed RMSNorm · digest is integrity, not authorship",
      heatmap: r.y,
    };
  }
  if (play === "formula") {
    const rows = runFormulas(seed);
    const worst = rows.reduce((a, b) => (b.residual > a.residual ? b : a));
    const puriq = structuralPuriq(seed);
    const puriqOk = Object.values(puriq).every((p) => p.ok);
    return {
      metrics: {
        worstResidual: worst.residual,
        passed: rows.filter((r) => r.ok).length,
        puriq: puriqOk ? 8 : 0,
      },
      boundMetric: "worstResidual",
      boundEps: 1e-4,
      direction: "lte",
      subjectId: "f.ledger",
      version: 1,
      kind: "formula",
      note: "Lab numerics CHECKED ≠ Lean locked-8 PROVEN",
      extra: { rows, puriq },
    };
  }
  if (play === "frontier") {
    const cut = params.cut ?? NAN_CUT.looptax;
    if (cut === NAN_CUT.chaski) {
      const y = runChaski(seed, {
        reorder: params.reorder ?? 0,
        drop: params.drop ?? 0,
        n: params.n ?? 8,
      });
      return {
        metrics: {
          broken: y.broken,
          reorder: y.reorder,
          chainBreaks: y.chainBreaks,
          fifoHold: y.fifoHold,
        },
        boundMetric: "broken",
        boundEps: 0,
        direction: "lte",
        subjectId: "k.chaski",
        version: 1,
        kind: "kernel",
        note:
          y.fifoHold === 1
            ? "Chaski FIFO holds · F7 silhouette · not a Kafka rehost"
            : "Chaski FIFO BROKEN · reorder or drop fail-closed",
        extra: { queue: y.queue, bodies: y.bodies },
      };
    }
    if (cut === NAN_CUT.ayni) {
      const y = runAyni(seed, params.leak ?? 0);
      return {
        metrics: { leak: y.leak, mass: y.mass, dim: y.dim },
        boundMetric: "leak",
        boundEps: 1e-9,
        direction: "lte",
        subjectId: "k.ayni",
        version: 1,
        kind: "kernel",
        note:
          y.leak < 1e-9
            ? "Ayni conservation holds · F11 silhouette · not a ResNet rehost"
            : "Ayni leak · skip scaled off identity · bound missed",
        extra: { xin: y.xin, force: y.force, xout: y.xout, residual: y.residual },
      };
    }
    if (cut === NAN_CUT.shard) {
      const mask = Number.isFinite(params.mask) ? params.mask : (1 << SHARD_N) - 1;
      const y = runShard(seed, mask);
      return {
        metrics: {
          recovered: y.recovered,
          live: y.live,
          singleton: y.singleton,
        },
        boundMetric: "recovered",
        boundEps: 1,
        direction: "gte",
        subjectId: "k.shard",
        version: 1,
        kind: "kernel",
        note:
          y.recovered === 1
            ? `ShardWitness recovered ${y.live}/10 · RS(10,6) GF(257) · CHECKED ≠ F18 PROVEN`
            : `ShardWitness unrecoverable · live ${y.live}/10 · need ≥ 6`,
        extra: { data: y.data, code: y.code, present: y.present, decoded: y.decoded },
      };
    }
    if (cut === NAN_CUT.bay) {
      const y = runBay({
        proofIntoProduct: params.proofIntoProduct ?? 0,
        hubAsProof: params.hubAsProof ?? 0,
        spaceAsReceipt: params.spaceAsReceipt ?? 0,
      });
      return {
        metrics: {
          collapsed: y.collapsed,
          blocked: y.blocked,
          empty: y.empty,
          neverA11oyCom: y.neverA11oyCom,
        },
        boundMetric: "collapsed",
        boundEps: 0,
        direction: "lte",
        subjectId: "k.bay",
        version: 1,
        kind: "kernel",
        note: y.reason,
        extra: { occupancy: y.occupancy, collapses: y.collapses },
      };
    }
    const tax = loopTax(
      [
        { ok: false, ms: 220 },
        { ok: true, ms: 900 },
      ],
      1300,
      4,
    );
    const gate = denyByDefault(params.allow === 1, params.hardDeny === 1, params.lambdaPass !== 0);
    return {
      metrics: {
        serializationTaxMs: tax.serializationTaxMs,
        blocked: gate.blocked ? 1 : 0,
        modelMs: tax.modelMs,
      },
      boundMetric: "blocked",
      boundEps: params.expectBlock === 1 ? 1 : 0,
      direction: params.expectBlock === 1 ? "gte" : "lte",
      subjectId: "k.frontier",
      version: 1,
      kind: "frontier",
      note: `${tax.exit} · ${gate.reason} · energy UNAVAILABLE`,
      extra: { tax, gate },
    };
  }
  if (play === "anatomy") {
    const ev = evaluateAnatomy(
      {
        zeroHeart: params.zeroHeart,
        leakCanal: params.leakCanal,
        tamperChain: params.tamperChain,
        fabricateJoule: params.fabricateJoule,
        breakSkeleton: params.breakSkeleton,
        willayFire: params.willayFire,
      },
      seed,
    );
    const organs = Object.fromEntries(ev.organs.map((o) => [o.id, o]));
    return {
      metrics: {
        liveCount: ev.liveCount,
        blocked: ev.blocked ? 1 : 0,
        lambda: Number(organs.heart?.metric ?? 0),
        leaked: Number(organs.brain?.metric ?? 0),
        chainBreaks: Number(organs.circulatory?.metric ?? 0),
        energyFabricated: Number(organs.nervous?.metric ?? 0),
        skeletonOk: Number(organs.skeleton?.metric ?? 0),
        willayRefuse: ev.willay.refused ? 1 : 0,
      },
      boundMetric: "blocked",
      boundEps: 0,
      direction: "lte",
      subjectId: "k.anatomy",
      version: 1,
      kind: "kernel",
      note: ev.reason,
      extra: { organs: ev.organs, willay: ev.willay, energy: ev.energy, chainHead: ev.chainHead },
    };
  }
  return {
    metrics: { pending: 1 },
    boundMetric: "pending",
    boundEps: 1,
    direction: "lte",
    subjectId: "pending",
    version: 1,
    kind: "model",
    note: "train in the lab stage",
  };
}
