import { cn } from "@/lib/utils";

export function Chakana({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={cn("text-accent", className)} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M32 8h16v8h8v8h8v16h-8v8h-8v8H32v-8h-8v-8h-8V24h8v-8h8z"
      />
    </svg>
  );
}
