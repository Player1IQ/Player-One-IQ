import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function TeamMemberNotFound() {
  return (
    <DashboardLayout title="Team Member Not Found">
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-lg font-medium text-gray-300">
          Team member not found
        </p>
        <p className="mt-1 text-sm text-gray-500">
          This member may have been removed or the link is invalid.
        </p>
        <Link
          href="/team"
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Back to Team
        </Link>
      </div>
    </DashboardLayout>
  );
}
