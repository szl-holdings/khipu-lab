"""SZL holographic Space — stdlib HTTP. No npm. No Gradio. Port 7860.

Λ uniqueness is Conjecture 1 — OPEN. Energy UNAVAILABLE. proven_trust is always false.
"""
from __future__ import annotations

import json
import math
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HTML = Path(__file__).with_name("index.html")
EPS = 1e-9
YUYAY_FLOORS: tuple[float, ...] = (0.95, 0.95) + (0.90,) * 11
JSON_PATHS = (
    "/health",
    "/healthz",
    "/version",
    "/api/version",
    "/api/lambda",
    "/api/greenlight",
    "/api/anatomy",
    "/api/invariants",
    "/api/govsign",
    "/api/prefix",
    "/api/route",
)
HTML_PATHS = ("/", "/index.html")
STEMS = ("NAV", "NAV ABSTAIN", "YUYAY", "YUYAY WILLAY ARI")


def lambda_aggregate(axes: list[float]) -> float:
    if not axes:
        raise ValueError("axes empty")
    if any(x < 0 for x in axes):
        raise ValueError("axes must be >= 0")
    k = len(axes)
    w = 1.0 / k
    if any(x == 0 for x in axes):
        return 0.0
    return math.exp(sum(w * math.log(x) for x in axes))


def _flag(data: dict, *keys: str) -> int:
    for k in keys:
        if k not in data:
            continue
        v = data[k]
        if isinstance(v, bool):
            return 1 if v else 0
        if isinstance(v, (int, float)):
            return 1 if v == 1 else 0
        if str(v).lower() in ("1", "true", "yes"):
            return 1
        return 0
    return 0


def _djb2(s: str) -> str:
    h = 5381
    for ch in s:
        h = ((h << 5) + h + ord(ch)) & 0xFFFFFFFF
    return f"{h:08x}"


def evaluate_greenlight(data: dict) -> dict:
    paint_sorry = _flag(data, "paint_sorry", "paintSorry")
    claim_proven = _flag(data, "claim_proven", "claimProven")
    stamp_joule = _flag(data, "stamp_joule", "stampJoule")
    checks = [
        {
            "id": "sorry",
            "ok": paint_sorry != 1,
            "detail": (
                "BLOCKED · a sorry cannot be painted green"
                if paint_sorry == 1
                else "sorry stays sorry · locked-8 is 8, not 21"
            ),
        },
        {
            "id": "conjecture1",
            "ok": claim_proven != 1,
            "detail": (
                "BLOCKED · proven_trust cannot be true while Λ is Conjecture 1"
                if claim_proven == 1
                else "proven_trust locked false · uniqueness OPEN"
            ),
        },
        {
            "id": "energy",
            "ok": stamp_joule != 1,
            "detail": (
                "BLOCKED · fabricated joule · energy UNAVAILABLE"
                if stamp_joule == 1
                else "energy UNAVAILABLE · never a fabricated joule"
            ),
        },
    ]
    painted = sum(1 for c in checks if not c["ok"])
    blocked = painted > 0
    return {
        "painted": painted,
        "blocked": blocked,
        "greenlit": 0 if blocked else 1,
        "proven_trust": False,
        "energy": "UNAVAILABLE",
        "lockedProven": 8,
        "conjecture1": "OPEN",
        "checks": checks,
        "kernel": "LIVE",
        "reason": (
            next((c["detail"] for c in checks if not c["ok"]), "promotion blocked")
            if blocked
            else "GREEN-LIGHT · LIVE bound · proven_trust false · energy UNAVAILABLE"
        ),
    }


def evaluate_anatomy(data: dict) -> dict:
    down = {
        "brain": bool(_flag(data, "leak_canal", "leakCanal")),
        "heart": bool(_flag(data, "zero_heart", "zeroHeart")),
        "circulatory": bool(_flag(data, "tamper_chain", "tamperChain")),
        "nervous": bool(_flag(data, "fabricate_joule", "fabricateJoule")),
        "skeleton": bool(_flag(data, "break_skeleton", "breakSkeleton")),
    }
    willay = bool(_flag(data, "willay_fire", "willayFire"))
    live = sum(1 for v in down.values() if not v)
    blocked = live < 5 or willay
    organs = [
        {"id": k, "status": "DOWN" if down[k] else "LIVE"}
        for k in ("brain", "heart", "circulatory", "nervous", "skeleton")
    ]
    if willay:
        reason = "WILLAY veto · body BLOCKED · proven_trust false · energy UNAVAILABLE"
    elif blocked:
        reason = f"organ integrity {live}/5 BLOCKED · Λ advisory · energy UNAVAILABLE · Conjecture 1 OPEN"
    else:
        reason = "organ integrity 5/5 LIVE · Λ advisory · energy UNAVAILABLE · Conjecture 1 OPEN"
    return {
        "live_count": live,
        "blocked": blocked,
        "reason": reason,
        "organs": organs,
        "kernel": "LIVE",
        "energy": "UNAVAILABLE",
        "proven_trust": False,
        "uniqueness": "Conjecture 1",
    }


def evaluate_invariants(data: dict) -> dict:
    paint_sorry = _flag(data, "paint_sorry", "paintSorry")
    claim_proven = _flag(data, "claim_proven", "claimProven")
    stamp_joule = _flag(data, "stamp_joule", "stampJoule")
    break_chain = _flag(data, "break_chain", "breakChain")
    fold_lean = _flag(data, "fold_lean", "foldLean")
    checks = [
        {
            "id": "locked8",
            "ok": paint_sorry != 1 and fold_lean != 1,
            "detail": (
                "BLOCKED · locked-proven is 8, not 21"
                if paint_sorry == 1 or fold_lean == 1
                else "locked-8 holds · F1 F4 F7 F11 F12 F18 F19 F22"
            ),
        },
        {
            "id": "conjecture1",
            "ok": claim_proven != 1,
            "detail": (
                "BLOCKED · uniqueness remains Conjecture 1 OPEN"
                if claim_proven == 1
                else "Conjecture 1 OPEN · proven_trust locked false"
            ),
        },
        {
            "id": "energy",
            "ok": stamp_joule != 1,
            "detail": (
                "BLOCKED · fabricated joule · energy UNAVAILABLE"
                if stamp_joule == 1
                else "energy UNAVAILABLE · never a fabricated joule"
            ),
        },
        {
            "id": "chain",
            "ok": break_chain != 1,
            "detail": (
                "BLOCKED · receipt chain prev mismatch"
                if break_chain == 1
                else "chain head holds · SHA-256 silhouette"
            ),
        },
    ]
    broken = sum(1 for c in checks if not c["ok"])
    blocked = broken > 0
    return {
        "broken": broken,
        "blocked": blocked,
        "hold": 0 if blocked else 1,
        "proven_trust": False,
        "energy": "UNAVAILABLE",
        "checks": checks,
        "kernel": "LIVE",
        "reason": (
            next((c["detail"] for c in checks if not c["ok"]), "invariants broken")
            if blocked
            else "INVARIANTS HOLD · LIVE · proven_trust false · energy UNAVAILABLE"
        ),
    }


def evaluate_govsign(data: dict) -> dict:
    seed = int(data.get("seed") or 11)
    tamper = _flag(data, "tamper")
    payload_type = "application/vnd.szl.khipu+json"
    honest = json.dumps(
        {
            "seed": seed,
            "proven_trust": False,
            "energy": "UNAVAILABLE",
            "conjecture_1": "OPEN",
            "locked_proven": 8,
        },
        separators=(",", ":"),
    )
    digest = _djb2(f"{payload_type}:{honest}")
    payload = honest.replace("OPEN", "PROVEN") if tamper == 1 else honest
    now = _djb2(f"{payload_type}:{payload}")
    hold = now == digest and tamper != 1
    return {
        "payloadType": payload_type,
        "payload": payload,
        "digest": digest,
        "signing": "STRUCTURAL-ONLY",
        "hold": 1 if hold else 0,
        "broken": 0 if hold else 1,
        "kernel": "LIVE",
        "proven_trust": False,
        "reason": (
            "GovEnvelope HOLDS · STRUCTURAL-ONLY · UNSIGNED is honest · not Sigstore"
            if hold
            else "GovEnvelope BROKEN · payload mutated after digest · fail closed · never a fake signature"
        ),
    }


def evaluate_prefix(data: dict) -> dict:
    seed = int(data.get("seed") or 11)
    hijack = _flag(data, "hijack")
    query = str(data.get("query") or "NAV")
    nodes = []
    for prefix in STEMS:
        kv = f"kv:{seed}:{prefix}"
        nodes.append({"prefix": prefix, "kv": kv, "digest": _djb2(kv)})
    claimed = "|".join(n["digest"] for n in nodes)
    if hijack == 1:
        nodes[0] = {**nodes[0], "kv": nodes[0]["kv"] + "#POISON"}
    now = "|".join(_djb2(n["kv"]) for n in nodes)
    hit = None
    for n in nodes:
        if query == n["prefix"] or query.startswith(n["prefix"] + " "):
            if hit is None or len(n["prefix"]) > len(hit["prefix"]):
                hit = n
    hit_ok = hit is not None and _djb2(hit["kv"]) == hit["digest"]
    hold = now == claimed and hit_ok and hijack != 1
    return {
        "hold": 1 if hold else 0,
        "broken": 0 if hold else 1,
        "hit": None if hit is None else hit["prefix"],
        "query": query,
        "nodes": nodes,
        "kernel": "LIVE",
        "reason": (
            "PrefixWitness HOLDS · radix digest matches · not SGLang · no tokens/s claim"
            if hold
            else "PrefixWitness BROKEN · cached KV mutated after digest · fail closed · not a silent reuse"
        ),
    }


def evaluate_route(data: dict) -> dict:
    seed = int(data.get("seed") or 11)
    tamper = _flag(data, "tamper")
    n, e = 8, 4
    # mulberry32 silhouette
    state = seed & 0xFFFFFFFF
    scores = []
    for _ in range(n):
        row = []
        for _e in range(e):
            state = (state * 0x6D2B79F5 + 1) & 0xFFFFFFFF
            t = (state ^ (state >> 15)) & 0xFFFFFFFF
            row.append((t >> 9) / 8388608.0)
        scores.append(row)
    assignment = [row.index(max(row)) for row in scores]
    digest = _djb2(",".join(str(x) for x in assignment))
    routed = list(assignment)
    if tamper == 1:
        routed[0] = (routed[0] + 1) % e
    now = _djb2(",".join(str(x) for x in routed))
    hold = now == digest and tamper != 1
    load = [0] * e
    for x in routed:
        load[x] += 1
    return {
        "hold": 1 if hold else 0,
        "broken": 0 if hold else 1,
        "assignment": routed,
        "load": load,
        "digest": digest,
        "kernel": "LIVE",
        "reason": (
            "RouteWitness HOLDS · assignment digest matches · not Mixtral · no tokens/s claim"
            if hold
            else "RouteWitness BROKEN · expert swapped after routing · fail closed · not a silent MoE rehost"
        ),
    }


def _query_body(path: str) -> dict:
    qs = parse_qs(urlparse(path).query)
    body: dict = {}
    for k, v in qs.items():
        body[k] = v[0] if len(v) == 1 else v
    if "axes" in body and isinstance(body["axes"], str):
        body["axes"] = [float(x) for x in body["axes"].split(",") if x]
    return body


ROUTES = {
    "/api/greenlight": evaluate_greenlight,
    "/api/anatomy": evaluate_anatomy,
    "/api/invariants": evaluate_invariants,
    "/api/govsign": evaluate_govsign,
    "/api/prefix": evaluate_prefix,
    "/api/route": evaluate_route,
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        return

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, payload: dict) -> None:
        self._send(code, json.dumps(payload).encode(), "application/json")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()

    def do_HEAD(self) -> None:  # noqa: N802
        """HF probes HEAD. BaseHTTP 501s otherwise."""
        path = urlparse(self.path).path
        if path in HTML_PATHS or path in JSON_PATHS:
            ctype = "text/html; charset=utf-8" if path in HTML_PATHS else "application/json"
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        if path in HTML_PATHS:
            self._send(200, HTML.read_bytes() if HTML.exists() else b"<h1>SZL</h1>", "text/html; charset=utf-8")
            return
        if path in ("/health", "/healthz"):
            self._json(
                200,
                {
                    "ok": True,
                    "space": "khipu-lab",
                    "kernel": "LIVE",
                    "uniqueness": "Conjecture 1",
                    "energy": "UNAVAILABLE",
                    "proven_trust": False,
                    "cuda": "UNAVAILABLE",
                },
            )
            return
        if path in ("/version", "/api/version"):
            self._json(
                200,
                {
                    "name": "khipu-lab",
                    "kind": "hologram",
                    "source": "szl-holdings/khipu-lab",
                    "proven_trust": False,
                    "energy": "UNAVAILABLE",
                },
            )
            return
        body = _query_body(self.path)
        if path == "/api/lambda":
            self._lambda(body)
            return
        if path in ROUTES:
            self._json(200, ROUTES[path](body))
            return
        self._send(404, b"not found", "text/plain")

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            data = json.loads(raw.decode())
            if not isinstance(data, dict):
                data = {}
        except Exception:
            data = {}
        if path == "/api/lambda":
            self._lambda(data)
            return
        if path in ROUTES:
            self._json(200, ROUTES[path](data))
            return
        self._send(404, b"not found", "text/plain")

    def _lambda(self, data: dict) -> None:
        axes = [float(x) for x in (data.get("axes") or list(YUYAY_FLOORS))]
        try:
            value = lambda_aggregate(axes)
            sacred = value == 0.0 or (len(axes) >= 2 and (axes[0] < 0.95 or axes[1] < 0.95))
            self._json(
                200,
                {
                    "lambda": value,
                    "blocked": sacred,
                    "decision": "BLOCKED" if sacred else "ADMITTED",
                    "uniqueness": "Conjecture 1",
                    "honesty": "MEASURED",
                    "proven_trust": False,
                    "energy": "UNAVAILABLE",
                    "kernel": "LIVE",
                    "reason": (
                        "zero-routed or sacred-axis floor"
                        if sacred
                        else "advisory pass — uniqueness remains Conjecture 1 OPEN"
                    ),
                },
            )
        except Exception as exc:
            self._json(400, {"error": str(exc), "honesty": "MEASURED", "proven_trust": False})


def main() -> None:
    port = int(os.environ.get("PORT", "7860"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"szl-space listening 0.0.0.0:{port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
