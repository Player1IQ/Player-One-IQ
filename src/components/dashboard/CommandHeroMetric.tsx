import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandHeroMetricProps {
  telemetry: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  iconColor?: string;
  highlight?: boolean;
  pulse?: boolean;
}

export function CommandHeroMetric({
  telemetry,
  value,
  subtitle,
  href,
  icon: Icon,
  iconColor = "text-accent-light",
  highlight = false,
  pulse = false,
}: CommandHeroMetricProps) {
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface-raised/90 p-5 backdrop-blur-sm transition-all duration-300",
        highlight
          ? "border-orange-500/30 shadow-[0_0_24px_rgba(249,115,22,0.08)]"
          : "border-white/[0.08] hover:border-accent/25 hover:shadow-glow",
        href && "cursor-pointer",
        pulse && "ring-1 ring-amber-500/20"
      )}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            {telemetry}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 truncate text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25",
            pulse && "before:absolute before:inset-0 before:animate-ping before:rounded-xl before:bg-amber-500/20"
          )}
        >
          <Icon className={cn("relative h-4 w-4", iconColor)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
