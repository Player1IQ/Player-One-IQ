import type { SponsorStatus } from "@/lib/sponsors";

const statusStyles: Record<SponsorStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  prospect: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  negotiating: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  inactive: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
};

const statusLabels: Record<SponsorStatus, string> = {
  active: "Active",
  prospect: "Prospect",
  negotiating: "Negotiating",
  inactive: "Inactive",
};

interface SponsorStatusBadgeProps {
  status: SponsorStatus;
}

export function SponsorStatusBadge({ status }: SponsorStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
