import Link from "next/link";
import { Mail } from "lucide-react";
import { roleLabels, type TeamRole } from "@/lib/team";

interface PendingInviteBannerProps {
  token: string;
  organizationName: string;
  role: string;
}

export function PendingInviteBanner({
  token,
  organizationName,
  role,
}: PendingInviteBannerProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
          <Mail className="h-4 w-4 text-accent-light" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Team invitation pending
          </p>
          <p className="mt-0.5 text-sm text-gray-400">
            You&apos;ve been invited to join{" "}
            <span className="text-gray-200">{organizationName}</span> as{" "}
            {roleLabels[role as TeamRole] ?? role}. Accept to access the team
            workspace and messaging.
          </p>
        </div>
      </div>
      <Link
        href={`/invite/${token}`}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        Review invitation
      </Link>
    </div>
  );
}
