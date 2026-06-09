"use client";

import { useState } from "react";
import { X, Copy, Check, Loader2, Mail } from "lucide-react";
import { resendInvitation } from "@/app/team/actions";
import { copyTextToClipboard, getErrorMessage } from "@/lib/safe-action";

interface ResendInviteModalProps {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  email: string;
}

export function ResendInviteModal({
  open,
  onClose,
  invitationId,
  email,
}: ResendInviteModalProps) {
  const [inviteLink, setInviteLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleResend() {
    setError("");
    setLoading(true);

    try {
      const result = await resendInvitation(invitationId);

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
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }

    setLoading(false);
  }

  async function copyLink() {
    try {
      await copyTextToClipboard(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function handleClose() {
    setInviteLink("");
    setEmailSent(false);
    setEmailError("");
    setError("");
    setCopied(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Resend Invite Link</h2>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!inviteLink ? (
            <>
              <p className="text-sm text-gray-400">
                Generate a fresh invite link and email it to {email}. The link will
                be valid for 7 more days. You can still copy the link manually if
                needed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Resend invitation
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {emailSent
                  ? `New invitation email sent to ${email}.`
                  : `New invite link ready. Copy and send it to ${email}.`}
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
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
