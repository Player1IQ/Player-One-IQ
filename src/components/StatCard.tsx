import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
  icon: LucideIcon;
  iconColor: string;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  iconColor,
  highlight = false,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface-raised/80 p-6 backdrop-blur-sm transition-all duration-300",
        highlight
          ? "border-orange-500/30 hover:border-orange-500/50"
          : "border-white/[0.06] hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover",
        href && "cursor-pointer"
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
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
