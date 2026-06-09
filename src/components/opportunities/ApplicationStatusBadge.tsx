import {
  type ApplicationStatus,
  applicationStatusLabels,
} from "@/lib/opportunities";

const styles: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  under_review: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 ring-red-500/20",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {applicationStatusLabels[status]}
    </span>
  );
}
