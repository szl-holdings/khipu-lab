import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { Panel, HonestyChip, Button } from "@/components/ui/primitives";
import { ATLAS } from "@/lib/atlas/catalog";
import { ESTATE_MODELS } from "@/lib/catalog/models";
import { useLab } from "@/store/lab";
import { KhipuCord, VerdictBadge } from "@/components/receipt/khipu-cord";
import { labNav } from "@/lib/catalog/plays";
import { shortHex } from "@/lib/crypto/receipt";
import { downloadJson, ledgerBundle } from "@/lib/export/bundle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspect/$kind/$id")({
  component: InspectPage,
});

const TABS = ["spec", "receipts", "gate"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  spec: "Spec",
  receipts: "Receipts",
  gate: "Gate",
};

function copySha(hex: string) {
  void navigator.clipboard.writeText(hex);
}

function InspectPage() {
  const { kind, id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("spec");
  const ledger = useLab((s) => s.receipts);
  const frontiers = useLab((s) => s.frontiers);
  const receipts = ledger.filter((r) => r.subject.id === id || r.subject.kind === kind);
  const last = receipts[0];
  const row = ATLAS.find((r) => r.id === id || r.szl === id || `k.${r.frontierId}` === id);
  const model = ESTATE_MODELS.find((m) => m.id === id || m.hub.endsWith(id));

  function exportLedger() {
    const bundle = ledgerBundle(ledger, frontiers);
    downloadJson("szl.khipu.bundle.v1.json", bundle);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          inspect · {kind} · {id}
        </p>
        <h1 className="font-display text-4xl">{row?.szl ?? model?.name ?? id}</h1>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Inspect">
          {TABS.map((t) => (
            <Button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              variant={tab === t ? "primary" : "ghost"}
              onClick={() => setTab(t)}
            >
              {TAB_LABEL[t]}
            </Button>
          ))}
        </div>

        {tab === "spec" && (
          <>
            {row && (
              <Panel>
                <div className="flex flex-wrap items-center gap-2">
                  <HonestyChip value={row.honesty} />
                  <span className="text-sm text-muted">vs {row.leader}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{row.delta}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                  {row.leaderSummary.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={row.paperUrl} className="inline-flex min-h-11 items-center text-sm text-accent underline-offset-2 hover:underline">
                    Leader paper
                  </a>
                  <Link
                    to="/lab/$play"
                    params={{ play: labNav(row.frontierId).play }}
                    search={labNav(row.frontierId).search}
                  >
                    <Button variant="ghost">Open lab</Button>
                  </Link>
                </div>
              </Panel>
            )}

            {model && (
              <Panel>
                <div className="flex flex-wrap items-center gap-2">
                  <HonestyChip value={model.honesty as "LIVE" | "ADVISORY" | "RESEARCH" | "ROADMAP" | "UNAVAILABLE"} />
                  <span className="font-mono text-xs text-muted">{model.hub}</span>
                </div>
                <p className="mt-2 text-sm">{model.eval}</p>
                <p className="mt-1 text-xs text-subtle">{model.whatNot}</p>
              </Panel>
            )}
          </>
        )}

        {tab === "receipts" && (
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Receipts</h2>
              <Button type="button" variant="ghost" onClick={exportLedger}>
                Export ledger
              </Button>
            </div>
            {receipts.length === 0 && <p className="mt-2 text-sm text-muted">None for this subject yet.</p>}
            <ul className="mt-3 space-y-3">
              {receipts.map((r) => (
                <li key={r.id} className="rounded-md border border-border bg-elevated p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{r.id}</span>
                    <VerdictBadge verdict={r.lambda.verdict} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted">{shortHex(r.sha256)}</span>
                    <Button
                      type="button"
                      variant="quiet"
                      className="min-h-11"
                      onClick={() => copySha(r.sha256)}
                    >
                      Copy
                    </Button>
                  </div>
                  <KhipuCord hex={r.sha256} verdict={r.lambda.verdict} className="mt-2" />
                  <pre className="mt-2 overflow-auto font-mono text-[10px] text-subtle">
                    {JSON.stringify(r.metrics, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "gate" && (
          <Panel>
            <h2 className="font-display text-2xl">Gate</h2>
            {!last ? (
              <p className="mt-2 text-sm text-muted">No receipt. Run a lab.</p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <VerdictBadge
                    verdict={last.lambda.checks.some((c) => !c.ok) ? "blocked" : last.lambda.verdict}
                  />
                  <span className="font-mono text-xs text-muted">{shortHex(last.sha256)}</span>
                  <Button
                    type="button"
                    variant="quiet"
                    className="min-h-11"
                    onClick={() => copySha(last.sha256)}
                  >
                    Copy
                  </Button>
                </div>
                <KhipuCord hex={last.sha256} verdict={last.lambda.verdict} className="mt-2" />
                <ul className="mt-3 space-y-2">
                  {last.lambda.checks.map((c) => (
                    <li
                      key={c.id}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-md border px-3 py-2",
                        c.ok
                          ? "border-border bg-elevated"
                          : "border-blocked/40 bg-blocked/15 text-blocked",
                      )}
                    >
                      <span className="w-24 shrink-0 font-mono text-xs">{c.id}</span>
                      <span className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide">
                        {c.ok ? "ok" : "BLOCKED"}
                      </span>
                      <span className={cn("min-w-0 flex-1 text-sm", c.ok ? "text-muted" : "text-blocked")}>
                        {c.detail}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-muted">{last.lambda.reason}</p>
              </>
            )}
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
