"use client";

import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function useInviteOrgName(): string | null {
  const searchParams = useSearchParams();
  const org = searchParams.get("org")?.trim();
  return org || null;
}

export function InviteAuthBanner() {
  const org = useInviteOrgName();
  if (!org) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-gray-300">
      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
      <p>
        You&apos;re joining{" "}
        <span className="font-medium text-white">{org}</span> on Player One IQ.
        Use the invited email to accept after signing in.
      </p>
    </div>
  );
}

export function InviteAuthSubtitle({ fallback }: { fallback: string }) {
  const org = useInviteOrgName();
  if (org) {
    return <>Sign in to join {org}</>;
  }
  return <>{fallback}</>;
}

export function InviteSignUpSubtitle({ fallback }: { fallback: string }) {
  const org = useInviteOrgName();
  if (org) {
    return <>Create your account to join {org}</>;
  }
  return <>{fallback}</>;
}
