"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Copy, Check } from "lucide-react";
import { type TeamRole } from "@/lib/team";
import type { Creator } from "@/lib/creators";
import { inviteTeamMember } from "@/app/team/actions";
import { RoleSelectFields } from "./RoleSelectFields";

interface InviteTeamMemberModalProps {
  open: boolean;
  onClose: () => void;
  creators: Creator[];
}

export function InviteTeamMemberModal({
  open,
  onClose,
  creators,
}: InviteTeamMemberModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [linkedCreatorId, setLinkedCreatorId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function handleClose() {
    setEmail("");
    setRole("viewer");
    setLinkedCreatorId("");
    setError("");
    setInviteLink("");
    setEmailSent(false);
    setEmailError("");
    setCopied(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await inviteTeamMember(
      email,
      role,
      linkedCreatorId || null
    );

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("token" in result && result.token) {
      const link =
        "inviteUrl" in result && result.inviteUrl
          ? result.inviteUrl
          : `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      setEmailSent(Boolean("emailSent" in result && result.emailSent));
      setEmailError(
        "emailError" in result && result.emailError ? result.emailError : ""
      );
      router.refresh();
    }

    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
            <p className="text-xs text-gray-500">
              Send an invitation to join your organization
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4 p-6">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {emailSent
                ? `Invitation email sent to ${email}.`
                : `Invitation created! Share this link with ${email}:`}
            </div>
            {emailError && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                Could not send email: {emailError}. Copy the link below instead.
              </div>
            )}
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-300"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm text-white hover:bg-accent-dark"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>

            <RoleSelectFields
              role={role}
              onRoleChange={setRole}
              linkedCreatorId={linkedCreatorId}
              onLinkedCreatorChange={setLinkedCreatorId}
              creators={creators}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
