import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  iconColor: string;
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconColor,
}: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-emerald-400" : "text-red-400";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6 transition-colors hover:border-accent/30 hover:bg-surface-overlay">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/5 transition-transform group-hover:scale-110" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{change}</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
