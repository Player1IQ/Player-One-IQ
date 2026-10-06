"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-[#0b0d12] px-4 font-sans">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141821] p-8 text-center">
          <h1 className="text-lg font-semibold text-white">
            This page failed to load
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            An unexpected error occurred. Retry this page, or refresh if you had
            an old tab open during a deploy.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
