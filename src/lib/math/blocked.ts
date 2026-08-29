export type PolicyResult = {
  allow: boolean;
  reason: string;
  code: "ALLOW" | "DENY_DEFAULT" | "HARD_DENY" | "LAMBDA_VETO";
};

export type GateDecision = {
  blocked: boolean;
  allowed: boolean;
  output: unknown;
  reason: string;
  dominant: "HARD_SECURITY" | "ADVISORY_LAMBDA" | "NONE";
};

export function denyByDefault(explicitAllow: boolean, hardDeny: boolean, lambdaPassed: boolean): GateDecision {
  if (hardDeny) {
    return {
      blocked: true,
      allowed: false,
      output: null,
      reason: "HARD_DENY dominates",
      dominant: "HARD_SECURITY",
    };
  }
  if (!explicitAllow) {
    return {
      blocked: true,
      allowed: false,
      output: null,
      reason: "DENY_DEFAULT — no explicit ALLOW",
      dominant: "HARD_SECURITY",
    };
  }
  if (!lambdaPassed) {
    return {
      blocked: true,
      allowed: false,
      output: null,
      reason: "advisory Λ veto (still BLOCKED, still advisory)",
      dominant: "ADVISORY_LAMBDA",
    };
  }
  return {
    blocked: false,
    allowed: true,
    output: { ok: true },
    reason: "ALLOW",
    dominant: "NONE",
  };
}
