import type { MemberStatus } from "@/lib/team";

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  inactive: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
};

const statusLabels: Record<MemberStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
};

interface MemberStatusBadgeProps {
  status: MemberStatus;
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
