import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  /** Icon color class only, e.g. `text-accent-light` */
  iconColor?: string;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  iconColor = "text-accent-light",
  highlight = false,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group rounded-2xl border bg-surface-raised/80 p-5 backdrop-blur-sm transition-colors duration-200",
        highlight
          ? "border-orange-500/25 hover:border-orange-500/40"
          : "border-white/[0.06] hover:border-white/[0.1]",
        href && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
