import { cn } from "@/lib/utils";
import type { Mat } from "@/lib/atlas/kernels";

function cellColor(v: number, max: number) {
  const t = max <= 0 ? 0 : Math.min(1, Math.max(0, v / max));
  const a = 0.08 + t * 0.92;
  return `color-mix(in oklab, var(--color-accent) ${Math.round(a * 100)}%, var(--color-elevated))`;
}

export function Heatmap({
  matrix,
  tile = 0,
  canals,
  className,
  caption,
}: {
  matrix: Mat;
  tile?: number;
  canals?: number[];
  className?: string;
  caption?: string;
}) {
  const n = matrix.length;
  const max = Math.max(...matrix.flat(), 1e-9);
  return (
    <figure className={cn("space-y-2", className)}>
      <div
        className="grid w-full gap-px rounded-md bg-border p-px"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {matrix.map((row, i) =>
          row.map((v, j) => {
            const tileEdge =
              tile > 0 && (i % tile === 0 || j % tile === 0);
            const canalBreak =
              canals?.some((c) => c === i || c === j) && (i === j || true);
            return (
              <div
                key={`${i}-${j}`}
                title={`${i},${j} ${v.toFixed(3)}`}
                className={cn(
                  "aspect-square",
                  tileEdge && "outline outline-1 outline-fg/20",
                  canalBreak && canals?.includes(i) && j === 0 && "ring-1 ring-accent/40",
                )}
                style={{ background: cellColor(v, max) }}
              />
            );
          }),
        )}
      </div>
      {caption ? (
        <figcaption className="font-mono text-[11px] text-subtle">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
