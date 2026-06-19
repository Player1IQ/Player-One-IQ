import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function InviteNotFound() {
  return (
    <AuthLayout
      title="Invitation not found"
      subtitle="This invite link may be invalid, expired, or already used"
    >
      <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
        <p className="text-sm text-gray-400">
          Ask your team admin to send a new invitation, or sign in with the
          email address the invite was sent to.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-surface-overlay"
          >
            Create account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
