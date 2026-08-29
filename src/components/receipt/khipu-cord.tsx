import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

export function KhipuCord({
  hex,
  verdict,
  className,
}: {
  hex: string;
  verdict: Verdict;
  className?: string;
}) {
  const pairs = (hex.replace(/[^0-9a-f]/gi, "") + "0000000000000000").slice(0, 16);
  const knots = Array.from({ length: 8 }, (_, i) => parseInt(pairs.slice(i * 2, i * 2 + 2), 16) % 4);
  const stroke =
    verdict === "blocked"
      ? "stroke-blocked"
      : verdict === "proved"
        ? "stroke-accent"
        : verdict === "conjecture"
          ? "stroke-open"
          : "stroke-muted";
  const flat = verdict === "blocked";
  return (
    <svg
      viewBox="0 0 200 36"
      className={cn("h-9 w-full", className)}
      aria-hidden
    >
      <line
        x1="8"
        y1="18"
        x2="192"
        y2="18"
        className={cn("fill-none stroke-[1.5]", stroke)}
      />
      {knots.map((lvl, i) => {
        const x = 16 + i * 22;
        const h = flat ? 0 : 4 + lvl * 5;
        return (
          <g key={i}>
            <circle cx={x} cy={18} r="2.2" className={cn("fill-bg", stroke)} />
            {!flat && (
              <path
                d={`M ${x} 18 C ${x + 6} ${18 - h}, ${x + 10} ${18 - h}, ${x + 14} 18`}
                className={cn("fill-none stroke-[1.5]", stroke)}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const tone =
    verdict === "proved"
      ? "bg-live/15 text-live border-live/30"
      : verdict === "conjecture"
        ? "bg-open/15 text-open border-open/30"
        : verdict === "blocked"
          ? "bg-blocked/15 text-blocked border-blocked/30"
          : "bg-elevated text-muted border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        tone,
      )}
    >
      {verdict}
    </span>
  );
}
