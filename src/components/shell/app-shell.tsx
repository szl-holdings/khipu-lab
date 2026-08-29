import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Columns2, FlaskConical, LayoutGrid, Menu, X } from "lucide-react";
import { PLAYS } from "@/lib/types";
import { DOCTRINE } from "@/lib/szl/doctrine";
import { useLab } from "@/store/lab";
import { cn } from "@/lib/utils";
import { Chakana } from "./chakana";
import { KhipuCord, VerdictBadge } from "@/components/receipt/khipu-cord";
import { Button } from "@/components/ui/primitives";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { receipts, hydrate } = useLab();
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const last = receipts[0];

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-[1400px]">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-3 py-5 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 px-2">
            <Chakana className="size-8" />
            <span className="font-display text-lg leading-tight tracking-tight">
              SZL KHIPU
              <span className="block font-sans text-[11px] uppercase tracking-[0.18em] text-muted">
                Ñan
              </span>
            </span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1 text-sm">
            <Link
              to="/"
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-sm px-2 text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg",
                pathname === "/" && "bg-elevated text-fg shadow-panel",
              )}
            >
              <LayoutGrid className="size-4" />
              Tinkuy
            </Link>
            <Link
              to="/rails"
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-sm px-2 text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg",
                pathname === "/rails" && "bg-elevated text-fg shadow-panel",
              )}
            >
              <Columns2 className="size-4" />
              Rails
            </Link>
            {PLAYS.map((p) => (
              <Link
                key={p.slug}
                to="/lab/$play"
                params={{ play: p.slug }}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-sm px-2 text-muted transition-colors duration-150 hover:bg-elevated hover:text-fg",
                  pathname === `/lab/${p.slug}` && "bg-elevated text-fg shadow-panel",
                )}
              >
                <FlaskConical className="size-4" />
                {p.quechua}
              </Link>
            ))}
          </nav>
          <p className="px-2 font-mono text-[10px] leading-relaxed text-subtle">
            Doctrine {DOCTRINE.version}
            <br />
            {DOCTRINE.lockedDeclarations} decls · {DOCTRINE.trackedSorries} sorries
            <br />
            Conjecture 1 OPEN
            <br />
            <a
              className="text-muted hover:text-accent"
              href="https://github.com/szl-holdings/szl-khipu"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            {" · "}
            <a
              className="text-muted hover:text-accent"
              href="https://huggingface.co/spaces/SZLHOLDINGS/szl-khipu"
              target="_blank"
              rel="noreferrer"
            >
              Space
            </a>
            {" · "}
            <a
              className="text-muted hover:text-accent"
              href="https://a11oy.net"
              target="_blank"
              rel="noreferrer"
            >
              Proof
            </a>
            {" · "}
            <a
              className="text-muted hover:text-accent"
              href="https://a-11-oy.com"
              target="_blank"
              rel="noreferrer"
            >
              Product
            </a>
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-sm md:hidden"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Open labs"
            >
              {navOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2 md:hidden">
              <Chakana className="size-7" />
              <span className="font-display text-base">SZL KHIPU</span>
            </Link>
            <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
              {last ? (
                <>
                  <VerdictBadge verdict={last.lambda.verdict} />
                  <span className="truncate font-mono text-xs text-muted">
                    {last.id} · λ {Number.isFinite(last.lambda.lambda) ? last.lambda.lambda.toFixed(3) : "∞"}
                  </span>
                  <div className="max-w-xs flex-1">
                    <KhipuCord hex={last.sha256} verdict={last.lambda.verdict} />
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted">No receipts yet. Run a lab.</span>
              )}
            </div>
            <Button variant="ghost" className="ml-auto" onClick={() => setLedgerOpen(true)}>
              <BookOpen className="size-4" />
              Ledger
            </Button>
          </header>

          {navOpen && (
            <div className="border-b border-border bg-surface px-3 py-2 md:hidden">
              <div className="grid grid-cols-2 gap-1">
                <Link
                  to="/"
                  onClick={() => setNavOpen(false)}
                  className="rounded-sm px-3 py-3 text-sm text-muted hover:bg-elevated hover:text-fg"
                >
                  Tinkuy
                </Link>
                <Link
                  to="/rails"
                  onClick={() => setNavOpen(false)}
                  className="rounded-sm px-3 py-3 text-sm text-muted hover:bg-elevated hover:text-fg"
                >
                  Rails
                </Link>
                {PLAYS.map((p) => (
                  <Link
                    key={p.slug}
                    to="/lab/$play"
                    params={{ play: p.slug }}
                    onClick={() => setNavOpen(false)}
                    className="rounded-sm px-3 py-3 text-sm text-muted hover:bg-elevated hover:text-fg"
                  >
                    {p.quechua}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">{children}</main>

          <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-bg/95 md:hidden">
            <Link to="/" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted">
              <LayoutGrid className="size-4" />
              Tinkuy
            </Link>
            <Link
              to="/lab/$play"
              params={{ play: "attn" }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
            >
              <FlaskConical className="size-4" />
              Lab
            </Link>
            <Link
              to="/rails"
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
            >
              <Columns2 className="size-4" />
              Rails
            </Link>
            <button
              type="button"
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"
              onClick={() => setLedgerOpen(true)}
            >
              <BookOpen className="size-4" />
              Gate
            </button>
          </nav>
        </div>
      </div>

      {ledgerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-bg/60" onClick={() => setLedgerOpen(false)}>
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-xl">Khipu ledger</h2>
              <button type="button" className="grid size-11 place-items-center" onClick={() => setLedgerOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {receipts.length === 0 && (
                <p className="text-sm text-muted">Empty. A run mints a SHA-256 cord.</p>
              )}
              <ul className="space-y-3">
                {receipts.map((r) => (
                  <li key={r.id} className="rounded-lg border border-border bg-elevated p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{r.id}</span>
                      <VerdictBadge verdict={r.lambda.verdict} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {r.subject.kind}/{r.subject.id} · seed {r.seed}
                    </p>
                    <KhipuCord hex={r.sha256} verdict={r.lambda.verdict} className="mt-2" />
                    <p className="mt-1 font-mono text-[10px] text-subtle">{r.lambda.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
