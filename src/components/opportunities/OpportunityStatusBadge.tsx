import {
  type OpportunityStatus,
  opportunityStatusLabels,
} from "@/lib/opportunities";

const styles: Record<OpportunityStatus, string> = {
  draft: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  open: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  closed: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  filled: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
};

export function OpportunityStatusBadge({
  status,
}: {
  status: OpportunityStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {opportunityStatusLabels[status]}
    </span>
  );
}
