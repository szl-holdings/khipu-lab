import { mulberry32 } from "@/lib/math/tensor";

export type Point = { x: number; y: number; yLabel: number };

export function twoMoons(n = 200, seed = 7, noise = 0.08): Point[] {
  const rng = mulberry32(seed);
  const out: Point[] = [];
  const half = n >> 1;
  for (let i = 0; i < half; i++) {
    const t = Math.PI * rng();
    out.push({
      x: Math.cos(t) + rng() * noise,
      y: Math.sin(t) + rng() * noise,
      yLabel: 0,
    });
  }
  for (let i = 0; i < n - half; i++) {
    const t = Math.PI * rng();
    out.push({
      x: 1 - Math.cos(t) + rng() * noise,
      y: 0.5 - Math.sin(t) + rng() * noise,
      yLabel: 1,
    });
  }
  return out;
}

export const FORMULA_TOKS = [
  "F1",
  "F4",
  "F7",
  "F11",
  "F12",
  "F18",
  "F19",
  "F22",
  "LAMBDA",
  "YUYAY",
  "NAVIGATE",
  "ABSTAIN",
  "MEASURED",
  "REPORTED",
  "UNKNOWN",
  "BLOCKED",
] as const;

export type KhipuExample = {
  query: string;
  handles: Array<{ id: string; note: string }>;
  decision: 0 | 1;
  cite: number[];
};

export function synthKhipu(n = 80, seed = 20260721): KhipuExample[] {
  const rng = mulberry32(seed);
  const out: KhipuExample[] = [];
  for (let i = 0; i < n; i++) {
    const navigate = i % 5 !== 0;
    const tok = FORMULA_TOKS[Math.floor(rng() * 8)];
    const distractor = FORMULA_TOKS[8 + Math.floor(rng() * 8)];
    const handles = [
      { id: `h.${i}.a`, note: navigate ? `${tok} node` : `${distractor} other` },
      { id: `h.${i}.b`, note: `${FORMULA_TOKS[Math.floor(rng() * 16)]} spare` },
      { id: `h.${i}.c`, note: "unrelated theorem" },
    ];
    const query = navigate ? `resolve ${tok} handle` : `ask about ${tok} with no handle`;
    out.push({
      query,
      handles,
      decision: navigate ? 1 : 0,
      cite: navigate ? [0] : [],
    });
  }
  return out;
}

export const QUECHUA_TINY =
  "khipu yarqa yuyay willay chaski hatun tinkuy nan puriq ayni chakana huklla yawar kamachiq tupu rumi quni pacha rimay nawi allin llankay yachay";
