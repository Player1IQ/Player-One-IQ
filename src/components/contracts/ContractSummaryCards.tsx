import {
  FileText,
  Clock,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

interface ContractSummaryCardsProps {
  activeCount: number;
  pendingCount: number;
  expiringSoonCount: number;
  totalValueDisplay: string;
}

export function ContractSummaryCards({
  activeCount,
  pendingCount,
  expiringSoonCount,
  totalValueDisplay,
}: ContractSummaryCardsProps) {
  const cards = [
    {
      label: "Active Contracts",
      value: activeCount,
      sub: "Currently in progress",
      icon: FileText,
      iconBg: "bg-emerald-500/10 ring-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label: "Pending Contracts",
      value: pendingCount,
      sub: "Awaiting signature",
      icon: Clock,
      iconBg: "bg-amber-500/10 ring-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      label: "Expiring Soon",
      value: expiringSoonCount,
      sub: "Within 45 days",
      icon: AlertTriangle,
      iconBg: "bg-orange-500/10 ring-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      label: "Total Contract Value",
      value: totalValueDisplay,
      sub: "Active + pending pipeline",
      icon: DollarSign,
      iconBg: "bg-accent/10 ring-accent/20",
      iconColor: "text-accent-light",
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface-raised p-5 transition-colors hover:border-accent/30"
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
          </div>
        );
      })}
    </div>
  );
}
