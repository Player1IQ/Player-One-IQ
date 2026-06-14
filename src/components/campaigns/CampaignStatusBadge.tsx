import type { CampaignStatus } from "@/lib/campaigns";

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  paused: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
};

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
