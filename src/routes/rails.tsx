import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { Badge, Button, Panel } from "@/components/ui/primitives";
import { CUT_PUBLICATION, ORIGINS, statusTone } from "@/lib/catalog/rails";
import { labNav } from "@/lib/catalog/plays";
import { recordDraft } from "@/lib/export/record";
import { downloadJson } from "@/lib/export/bundle";
import { useLab } from "@/store/lab";
import { evaluateBay } from "@/lib/math/bay";

export const Route = createFileRoute("/rails")({ component: RailsPage });

function RailsPage() {
  const receipts = useLab((s) => s.receipts);
  const frontiers = useLab((s) => s.frontiers);
  const bay = evaluateBay({});

  function exportDraft() {
    downloadJson("szl.khipu.record.draft.v1.json", recordDraft(receipts, frontiers));
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Willay · Evidence Bay
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Three origins. Never one.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Hub is transport. a11oy.net is proof. a-11-oy.com is the product. A RUNNING
            Space is not a receipt. A listing is not quality. Never a11oy.com.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="live">this lab LIVE</Badge>
            <Badge tone="open">Hub REPORTED</Badge>
            <Badge tone="open">proof registry a11oy.net</Badge>
            <Badge tone="blocked">never a11oy.com</Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={exportDraft}>
              Export RECORD draft
            </Button>
            <Link to="/lab/$play" params={{ play: "frontier" }} search={{ cut: "bay" }}>
              <Button variant="ghost">Run Evidence Bay</Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-subtle">
            This lab cannot write the Hub or append RECORD. The draft is a pointer, unsigned,
            proven_trust locked false.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <OriginCard
            kicker="Transport"
            title="Hub"
            href={ORIGINS.hub.url}
            body={ORIGINS.hub.role}
          />
          <OriginCard
            kicker="Proof"
            title="a11oy.net"
            href={ORIGINS.proof.url}
            body={ORIGINS.proof.role}
          />
          <OriginCard
            kicker="Product"
            title="a-11-oy.com"
            href={ORIGINS.product.url}
            body={ORIGINS.product.role}
          />
        </section>

        <Panel className="border-blocked/40">
          <p className="font-mono text-[11px] uppercase tracking-widest text-blocked">Forbidden</p>
          <h2 className="mt-1 font-display text-2xl">{ORIGINS.forbidden.name}</h2>
          <p className="mt-2 text-sm text-muted">{ORIGINS.forbidden.role}</p>
        </Panel>

        <section>
          <h2 className="font-display text-2xl">Where each Ñan cut lives</h2>
          <p className="mt-1 text-sm text-muted">
            Every beatable cut in this lab, on the three rails. Hub listings stay transport.
            RECORD stays on a11oy.net. A GitHub green check is not a theorem.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-elevated text-[11px] uppercase tracking-widest text-subtle">
                <tr>
                  <th className="px-4 py-3 font-medium">Cut</th>
                  <th className="px-4 py-3 font-medium">Lab</th>
                  <th className="px-4 py-3 font-medium">Hub</th>
                  <th className="px-4 py-3 font-medium">a11oy.net</th>
                  <th className="px-4 py-3 font-medium">a-11-oy.com</th>
                </tr>
              </thead>
              <tbody>
                {CUT_PUBLICATION.map((c) => {
                  const nav = labNav(c.frontierId);
                  return (
                    <tr key={c.frontierId} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          to="/lab/$play"
                          params={{ play: nav.play }}
                          search={nav.search}
                          className="text-accent hover:underline"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-subtle">{c.whatNot}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(c.lab)}>{c.lab}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(c.hub)}>{c.hub}</Badge>
                        {c.hubUrl ? (
                          <a
                            href={c.hubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block font-mono text-[11px] text-muted hover:text-accent"
                          >
                            card
                          </a>
                        ) : (
                          <div className="mt-1 text-[11px] text-subtle">not weights</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(c.proof)}>{c.proof}</Badge>
                        <div className="mt-1 max-w-[16rem] text-[11px] text-subtle">{c.proofNote}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(c.product)}>{c.product}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">Default occupancy</h2>
          <p className="mt-1 text-sm text-muted">{bay.reason}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(["transport", "evidence", "verification", "authority"] as const).map((rail) => (
              <Panel key={rail}>
                <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{rail}</div>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {bay.occupancy[rail].map((o) => (
                    <li key={o.id}>{o.note}</li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function OriginCard({
  kicker,
  title,
  href,
  body,
}: {
  kicker: string;
  title: string;
  href: string | null;
  body: string;
}) {
  const inner = (
    <>
      <div className="font-mono text-[11px] uppercase tracking-widest text-subtle">{kicker}</div>
      <div className="mt-1 font-display text-2xl">{title}</div>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </>
  );
  if (!href) return <Panel>{inner}</Panel>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      <Panel className="h-full transition-colors duration-150 hover:border-border-strong">{inner}</Panel>
    </a>
  );
}
