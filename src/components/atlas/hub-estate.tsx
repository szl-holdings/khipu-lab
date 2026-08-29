import { HonestyChip, Panel } from "@/components/ui/primitives";
import { HUB_ESTATE, HUB_LIVE, HUB_NANO } from "@/lib/catalog/hub-estate";

export function HubEstate() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {HUB_ESTATE.length} Hub cards. {HUB_NANO.length} nano silhouettes train and infer in this tab.
        {" "}
        {HUB_LIVE.length} kernels run here. 1.5B / Qwen adapters stay RESEARCH — not scraped, not rehosted,
        not trained in this tab.
      </p>
      <div className="grid gap-2">
        {HUB_ESTATE.map((c) => (
          <Panel key={c.hub} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <HonestyChip value={c.honesty as "LIVE" | "ADVISORY" | "RESEARCH" | "ROADMAP" | "UNAVAILABLE"} />
                <span className="font-mono text-[11px] uppercase tracking-widest text-subtle">{c.kind}</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-subtle">
                <a className="text-accent underline-offset-2 hover:underline" href={`https://huggingface.co/${c.hub}`} target="_blank" rel="noreferrer">
                  {c.hub}
                </a>
              </p>
              <p className="mt-1 text-sm text-muted">{c.bench}</p>
              <p className="mt-1 text-xs text-subtle">{c.whatNot}</p>
            </div>
            <div className="shrink-0 font-mono text-xs text-muted sm:text-right">
              <div>{c.weights}</div>
              <div className="text-subtle">{c.inferHere ? "infer here" : "not this tab"}</div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
