import type { ContractStatus } from "@/lib/contracts";

const statusStyles: Record<ContractStatus, string> = {
  draft: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  negotiating: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  completed: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  expired: "bg-red-500/10 text-red-400 ring-red-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

const statusLabels: Record<ContractStatus, string> = {
  draft: "Draft",
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
