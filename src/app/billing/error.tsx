"use client";

import { useEffect } from "react";
import Link from "next/link";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-white">Billing failed to load</h1>
        <p className="mt-2 text-sm text-gray-400">
          The billing page hit an error. Try again, or go back to the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href={STAFF_DASHBOARD_PATH}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-surface-overlay"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
