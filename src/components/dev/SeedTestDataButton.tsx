"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";
import { seedTestData } from "@/app/seed/actions";

interface SeedTestDataButtonProps {
  variant?: "button" | "card";
}

export function SeedTestDataButton({
  variant = "button",
}: SeedTestDataButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSeed() {
    if (
      !confirm(
        "Add demo creators, a sponsor, and an open opportunity? Existing demo data will be skipped."
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await seedTestData();

    if ("error" in result) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setMessage(result.message);
    router.refresh();
    setLoading(false);
  }

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">Seed Test Data</h3>
            <p className="mt-1 text-sm text-gray-400">
              Adds 3 demo creators, 1 sponsor, and 1 open opportunity. Safe to
              run multiple times — existing demo records are skipped.
            </p>
            {message && (
              <p
                className={`mt-3 text-sm ${
                  message.includes("error") || message.includes("permission")
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Seed Test Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSeed}
        disabled={loading}
        title="Add demo creators, sponsor, and opportunity"
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        Seed Test Data
      </button>
      {message && (
        <p className="max-w-xs text-right text-xs text-gray-400">{message}</p>
      )}
    </div>
  );
}
