import { Users, UserCheck, Mail, Shield } from "lucide-react";

export type TeamStatusFilter = "all" | "active" | "pending";

interface TeamSummaryCardsProps {
  total: number;
  activeCount: number;
  pendingCount: number;
  assignedRolesCount: number;
  activeFilter: TeamStatusFilter;
  onFilterChange: (filter: TeamStatusFilter) => void;
}

export function TeamSummaryCards({
  total,
  activeCount,
  pendingCount,
  assignedRolesCount,
  activeFilter,
  onFilterChange,
}: TeamSummaryCardsProps) {
  const cards: {
    label: string;
    value: number;
    sub: string;
    filter: TeamStatusFilter;
    icon: typeof Users;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      label: "Total Team Members",
      value: total,
      sub: "Click to show all",
      filter: "all",
      icon: Users,
      iconBg: "bg-accent/10 ring-accent/20",
      iconColor: "text-accent-light",
    },
    {
      label: "Active Users",
      value: activeCount,
      sub: "Click to filter active",
      filter: "active",
      icon: UserCheck,
      iconBg: "bg-emerald-500/10 ring-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label: "Pending Invites",
      value: pendingCount,
      sub: "Click to filter pending",
      filter: "pending",
      icon: Mail,
      iconBg: "bg-amber-500/10 ring-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      label: "Assigned Roles",
      value: assignedRolesCount,
      sub: "Unique role types",
      filter: "all",
      icon: Shield,
      iconBg: "bg-purple-500/10 ring-purple-500/20",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.filter;
        const isClickable = card.label !== "Assigned Roles";

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => isClickable && onFilterChange(card.filter)}
            disabled={!isClickable}
            className={`group relative overflow-hidden rounded-xl border bg-surface-raised p-5 text-left transition-colors ${
              isActive
                ? "border-accent/50 ring-1 ring-accent/30"
                : "border-border hover:border-accent/30"
            } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 transition-transform group-hover:scale-110" />
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
