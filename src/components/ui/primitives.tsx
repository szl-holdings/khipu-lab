import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function Badge({
  tone = "muted",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "accent" | "live" | "open" | "blocked" | "unavail";
}) {
  const tones: Record<string, string> = {
    muted: "bg-elevated text-muted border-border",
    accent: "bg-accent text-accent-fg border-transparent",
    live: "bg-live/15 text-live border-live/30",
    open: "bg-open/15 text-open border-open/30",
    blocked: "bg-blocked/15 text-blocked border-blocked/30",
    unavail: "bg-unavail/15 text-unavail border-unavail/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "quiet";
}) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-accent-fg hover:opacity-90",
    ghost: "bg-elevated text-fg border border-border hover:border-border-strong",
    quiet: "bg-transparent text-muted hover:text-fg hover:bg-elevated",
    danger: "bg-blocked/20 text-blocked border border-blocked/40 hover:bg-blocked/30",
  };
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-sm px-3.5 text-sm font-medium transition-opacity duration-150 disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-panel sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function HonestyChip({
  value,
}: {
  value: "LIVE" | "ADVISORY" | "RESEARCH" | "ROADMAP" | "UNAVAILABLE";
}) {
  const tone =
    value === "LIVE"
      ? "live"
      : value === "ADVISORY" || value === "RESEARCH" || value === "ROADMAP"
        ? "open"
        : "unavail";
  return <Badge tone={tone}>{value}</Badge>;
}
