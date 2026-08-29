import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { LabStage } from "@/components/lab/lab-stage";
import { isPlaySlug } from "@/lib/types";

export const Route = createFileRoute("/lab/$play")({
  validateSearch: (raw: Record<string, unknown>): { cut?: string } => ({
    cut: typeof raw.cut === "string" ? raw.cut : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!isPlaySlug(params.play)) throw redirect({ to: "/" });
  },
  component: LabPage,
});

function LabPage() {
  const { play } = Route.useParams();
  const { cut } = Route.useSearch();
  if (!isPlaySlug(play)) return null;
  return (
    <AppShell>
      <LabStage play={play} cut={cut} />
    </AppShell>
  );
}
