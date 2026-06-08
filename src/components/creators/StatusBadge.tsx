import type { CreatorStatus } from "@/lib/creators";

const statusStyles: Record<CreatorStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  inactive: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  "on-hold": "bg-orange-500/10 text-orange-400 ring-orange-500/20",
};

const statusLabels: Record<CreatorStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  "on-hold": "On Hold",
};

interface StatusBadgeProps {
  status: CreatorStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
