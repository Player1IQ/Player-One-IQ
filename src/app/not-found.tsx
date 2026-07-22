import Link from "next/link";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <FileQuestion className="h-6 w-6 text-accent-light" />
        </div>
        <p className="text-sm font-medium text-gray-500">404</p>
        <h1 className="mt-1 text-lg font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          This page doesn&apos;t exist or you may not have access to it.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={STAFF_DASHBOARD_PATH}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-surface-overlay"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
