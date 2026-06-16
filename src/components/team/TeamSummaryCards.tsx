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
    iconColor: string;
    clickable: boolean;
  }[] = [
    {
      label: "Total Team Members",
      value: total,
      sub: "Members and pending invites",
      filter: "all",
      icon: Users,
      iconColor: "text-accent-light",
      clickable: true,
    },
    {
      label: "Active Users",
      value: activeCount,
      sub: "Accepted and signed in",
      filter: "active",
      icon: UserCheck,
      iconColor: "text-emerald-400",
      clickable: true,
    },
    {
      label: "Pending Invites",
      value: pendingCount,
      sub: "Awaiting acceptance",
      filter: "pending",
      icon: Mail,
      iconColor: "text-amber-400",
      clickable: true,
    },
    {
      label: "Assigned Roles",
      value: assignedRolesCount,
      sub: "Admin, manager, and viewer",
      filter: "all",
      icon: Shield,
      iconColor: "text-purple-400",
      clickable: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = card.clickable && activeFilter === card.filter;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => card.clickable && onFilterChange(card.filter)}
            disabled={!card.clickable}
            className={`group relative w-full overflow-hidden rounded-2xl border bg-surface-raised/80 p-5 text-left backdrop-blur-sm transition-all duration-300 ${
              isActive
                ? "border-accent/50 shadow-glow-active ring-1 ring-accent/30"
                : "border-white/[0.06] hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover"
            } ${card.clickable ? "cursor-pointer" : "cursor-default"}`}
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
