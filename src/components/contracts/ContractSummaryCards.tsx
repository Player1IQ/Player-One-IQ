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
    iconColor: string;
  }[] = [
    {
      key: "active",
      label: "Active Contracts",
      value: activeCount,
      sub: "Currently in progress",
      icon: FileText,
      iconColor: "text-emerald-400",
    },
    {
      key: "pipeline",
      label: "In Pipeline",
      value: negotiatingCount,
      sub: "Draft & negotiating",
      icon: Clock,
      iconColor: "text-amber-400",
    },
    {
      key: "expiring",
      label: "Expiring Soon",
      value: expiringSoonCount,
      sub: "Within 45 days",
      icon: AlertTriangle,
      iconColor: "text-orange-400",
    },
    {
      key: null,
      label: "Total Contract Value",
      value: totalValueDisplay,
      sub: "Active + pipeline",
      icon: DollarSign,
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{card.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{card.sub}</p>
          </button>
        );
      })}
    </div>
  );
}
