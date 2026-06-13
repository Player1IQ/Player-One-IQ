import {
  FileText,
  Clock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export type ContractSummaryFilter =
  | "active"
  | "pipeline"
  | "expiring"
  | "overdue"
  | null;

interface ContractSummaryCardsProps {
  activeCount: number;
  negotiatingCount: number;
  expiringSoonCount: number;
  overdueCount?: number;
  totalValueDisplay: string;
  activeFilter?: ContractSummaryFilter;
  onFilterChange?: (filter: ContractSummaryFilter) => void;
}

export function ContractSummaryCards({
  activeCount,
  negotiatingCount,
  expiringSoonCount,
  overdueCount = 0,
  totalValueDisplay,
  activeFilter = null,
  onFilterChange,
}: ContractSummaryCardsProps) {
  const cards: {
    key: ContractSummaryFilter;
    label: string;
    value: string | number;
    sub: string;
    icon: typeof FileText;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      key: "active",
      label: "Active Contracts",
      value: activeCount,
      sub: "Currently in progress",
      icon: FileText,
      iconBg: "bg-emerald-500/10 ring-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      key: "pipeline",
      label: "In Pipeline",
      value: negotiatingCount,
      sub: "Draft & negotiating",
      icon: Clock,
      iconBg: "bg-amber-500/10 ring-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      key: "expiring",
      label: "Expiring Soon",
      value: expiringSoonCount,
      sub: "Within 45 days",
      icon: AlertTriangle,
      iconBg: "bg-orange-500/10 ring-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      key: null,
      label: "Total Contract Value",
      value: totalValueDisplay,
      sub: "Active + pipeline",
      icon: DollarSign,
      iconBg: "bg-accent/10 ring-accent/20",
      iconColor: "text-accent-light",
    },
  ];

  if (overdueCount > 0) {
    cards.splice(3, 0, {
      key: "overdue",
      label: "Overdue",
      value: overdueCount,
      sub: "Past end date, still active",
      icon: AlertTriangle,
      iconBg: "bg-red-500/10 ring-red-500/20",
      iconColor: "text-red-400",
    });
  }

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = card.key !== null && activeFilter === card.key;
        const isClickable = Boolean(onFilterChange && card.key);

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => {
              if (!onFilterChange || !card.key) return;
              onFilterChange(isActive ? null : card.key);
            }}
            disabled={!isClickable}
            className={`group relative w-full overflow-hidden rounded-2xl border bg-surface-raised/80 p-5 text-left backdrop-blur-sm transition-all duration-300 ${
              isActive
                ? "border-accent/50 shadow-glow-active ring-1 ring-accent/30"
                : "border-white/[0.06] hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover"
            } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 transition-transform group-hover:scale-110" />
            <div className="relative flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{card.label}</p>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${card.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="relative mt-3 text-3xl font-bold tracking-tight text-white">
              {card.value}
            </p>
            <p className="relative mt-1 text-xs text-gray-500">{card.sub}</p>
          </button>
        );
      })}
    </div>
  );
}
