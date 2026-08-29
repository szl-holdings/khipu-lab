import { Button } from "@/components/ui/primitives";

export function RunBar({
  running,
  onRun,
  label = "Run",
}: {
  running: boolean;
  onRun: () => void;
  label?: string;
}) {
  return (
    <div className="sticky bottom-16 z-10 flex md:bottom-4">
      <Button className="min-h-12 w-full md:w-auto md:px-8" disabled={running} onClick={onRun}>
        {running ? "Running…" : label}
      </Button>
    </div>
  );
}
