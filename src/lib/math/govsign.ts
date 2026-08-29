/** GovSign — structural DSSE silhouette. UNSIGNED is first-class. Never a fake key. */

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export type GovEnvelope = {
  payloadType: string;
  payload: string;
  digest: string;
  signing: "STRUCTURAL-ONLY";
  hold: number;
  broken: number;
  reason: string;
};

export function runGovSign(seed: number, tamper = 0): GovEnvelope {
  const payloadType = "application/vnd.szl.khipu+json";
  const honest = JSON.stringify({
    seed,
    proven_trust: false,
    energy: "UNAVAILABLE",
    conjecture_1: "OPEN",
    locked_proven: 8,
  });
  const digest = fnv(`${payloadType}:${honest}`);
  const payload = tamper === 1 ? honest.replace("OPEN", "PROVEN") : honest;
  const now = fnv(`${payloadType}:${payload}`);
  const hold = now === digest && tamper !== 1 ? 1 : 0;
  return {
    payloadType,
    payload,
    digest,
    signing: "STRUCTURAL-ONLY",
    hold,
    broken: hold ? 0 : 1,
    reason: hold
      ? "GovEnvelope HOLDS · STRUCTURAL-ONLY · UNSIGNED is honest · not Sigstore"
      : "GovEnvelope BROKEN · payload mutated after digest · fail closed · never a fake signature",
  };
}
