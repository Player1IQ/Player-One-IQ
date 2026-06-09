"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Shield } from "lucide-react";
import { roleLabels } from "@/lib/team";
import { acceptInvitation } from "@/app/team/actions";

interface AcceptInviteClientProps {
  token: string;
  email: string;
  role: string;
  organizationName: string;
  status: string;
  expiresAt: string;
  userEmail: string | null;
}

export function AcceptInviteClient({
  token,
  email,
  role,
  organizationName,
  status,
  expiresAt,
  userEmail,
}: AcceptInviteClientProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const expired = new Date(expiresAt) < new Date();
  const emailMismatch =
    userEmail && userEmail.toLowerCase() !== email.toLowerCase();

  async function handleAccept() {
    setError("");
    setLoading(true);
    const result = await acceptInvitation(token);
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (status !== "pending" || expired) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface-raised p-8 text-center">
        <p className="text-lg font-semibold text-white">
          Invitation unavailable
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {expired
            ? "This invitation has expired. Ask your admin to send a new one."
            : "This invitation is no longer valid."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-surface-raised p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Mail className="h-7 w-7 text-accent-light" />
        </div>
        <h1 className="text-xl font-bold text-white">You&apos;re invited!</h1>
        <p className="mt-2 text-sm text-gray-400">
          Join <span className="text-gray-200">{organizationName}</span> on
          Player One IQ
        </p>
      </div>

      <div className="mb-6 space-y-3 rounded-lg border border-border-subtle bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Email</span>
          <span className="text-gray-200">{email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Role</span>
          <span className="inline-flex items-center gap-1.5 text-gray-200">
            <Shield className="h-3.5 w-3.5" />
            {roleLabels[role as keyof typeof roleLabels] ?? role}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!userEmail ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">
            Sign in with <span className="text-gray-200">{email}</span> to accept
            this invitation.
          </p>
          <a
            href={`/login?redirect=/invite/${token}`}
            className="flex w-full items-center justify-center rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Sign in to accept
          </a>
        </div>
      ) : emailMismatch ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          You&apos;re signed in as {userEmail}, but this invite was sent to{" "}
          {email}. Sign out and sign in with the correct account.
        </div>
      ) : (
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Accept invitation
        </button>
      )}
    </div>
  );
}
