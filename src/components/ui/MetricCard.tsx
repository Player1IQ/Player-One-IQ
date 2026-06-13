import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive?: boolean };
  highlight?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  iconColor = "bg-accent/10 text-accent-light ring-accent/20",
  trend,
  highlight = false,
  className,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface-raised/80 p-6 backdrop-blur-sm transition-all duration-300",
        highlight
          ? "border-orange-500/30 hover:border-orange-500/50 hover:shadow-orange-500/10"
          : "border-white/[0.06] hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-card-hover",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-400" : "text-gray-500"
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
            iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
