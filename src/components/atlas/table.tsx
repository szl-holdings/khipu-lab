import { useMemo, useState } from "react";
import { ATLAS, type AtlasRow } from "@/lib/atlas/catalog";
import { Badge, HonestyChip, Panel } from "@/components/ui/primitives";
import { ArrowUpRight, ChevronDown } from "lucide-react";

export function AtlasTable({
  onOpenLab,
}: {
  onOpenLab: (frontierId: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ATLAS;
    return ATLAS.filter((r) =>
      [r.szl, r.leader, r.frontier, r.silhouette, r.delta].join(" ").toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {ATLAS.length} silhouettes. Leader paper on the left. Honest SZL delta. Named original frontier — not a rehost.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter kernels, leaders, frontiers"
          className="min-h-11 w-full rounded-sm border border-border bg-elevated px-3 text-sm sm:max-w-xs"
        />
      </div>
      <div className="atlas-table overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-elevated text-[11px] uppercase tracking-widest text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Leader</th>
              <th className="px-4 py-3 font-medium">SZL artifact</th>
              <th className="px-4 py-3 font-medium">Frontier</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row key={r.id} row={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} onOpenLab={onOpenLab} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="atlas-cards space-y-2">
        {rows.map((r) => (
          <MobileCard key={r.id} row={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} onOpenLab={onOpenLab} />
        ))}
      </div>
    </div>
  );
}

function Row({
  row,
  open,
  onToggle,
  onOpenLab,
}: {
  row: AtlasRow;
  open: boolean;
  onToggle: () => void;
  onOpenLab: (id: string) => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-border hover:bg-elevated/60"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-mono text-subtle tabular-nums">{String(row.n).padStart(2, "0")}</td>
        <td className="px-4 py-3">
          <div className="font-medium">{row.leader}</div>
          <div className="text-xs text-subtle">{row.silhouette}</div>
        </td>
        <td className="px-4 py-3 font-mono text-xs">{row.szl}</td>
        <td className="px-4 py-3">
          <span className="text-accent">{row.frontier}</span>
          {row.live ? <Badge className="ml-2" tone="accent">demo</Badge> : null}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <HonestyChip value={row.honesty} />
            <ChevronDown className={`size-4 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </td>
      </tr>
      {open ? (
        <tr className="border-t border-border bg-elevated/40">
          <td colSpan={5} className="px-4 py-4">
            <Detail row={row} onOpenLab={onOpenLab} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileCard({
  row,
  open,
  onToggle,
  onOpenLab,
}: {
  row: AtlasRow;
  open: boolean;
  onToggle: () => void;
  onOpenLab: (id: string) => void;
}) {
  return (
    <Panel className="p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          <div className="font-mono text-[11px] text-subtle">{String(row.n).padStart(2, "0")} · {row.szl}</div>
          <div className="mt-1 font-medium">{row.leader}</div>
          <div className="text-sm text-accent">{row.frontier}</div>
        </div>
        <HonestyChip value={row.honesty} />
      </button>
      {open ? <div className="mt-3 border-t border-border pt-3"><Detail row={row} onOpenLab={onOpenLab} /></div> : null}
    </Panel>
  );
}

function Detail({ row, onOpenLab }: { row: AtlasRow; onOpenLab: (id: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-subtle">Leader</h3>
        <ol className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
          {row.leaderSummary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <a
          href={row.paperUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          {row.paper} <ArrowUpRight className="size-3" />
        </a>
      </section>
      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-subtle">SZL honest delta</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{row.delta}</p>
        <a
          href={`https://github.com/${row.repo}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
        >
          github.com/{row.repo} <ArrowUpRight className="size-3" />
        </a>
      </section>
      <section>
        <h3 className="text-[11px] uppercase tracking-widest text-subtle">Original frontier</h3>
        <p className="mt-2 text-lg tracking-tight text-fg">{row.frontier}</p>
        <p className="mt-1 text-sm text-muted">Not a clone. Not a rehost. Named cut we should ship.</p>
        {row.live ? (
          <button
            type="button"
            onClick={() => onOpenLab(row.frontierId)}
            className="mt-3 inline-flex min-h-11 items-center rounded-sm bg-accent px-3.5 text-sm font-medium text-accent-fg"
          >
            Run live demo
          </button>
        ) : (
          <p className="mt-3 font-mono text-[11px] text-subtle">Named in the atlas · not in this browser lab</p>
        )}
      </section>
    </div>
  );
}
