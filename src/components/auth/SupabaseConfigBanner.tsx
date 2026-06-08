import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SupabaseConfigBanner() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="text-sm">
        <p className="font-medium text-amber-200">Supabase not configured</p>
        <p className="mt-1 text-amber-200/70">
          Copy{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
            .env.local.example
          </code>{" "}
          to{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
            .env.local
          </code>{" "}
          and add your project URL and anon key from the{" "}
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-100"
          >
            Supabase API settings
          </a>
          . Then restart the dev server.
        </p>
      </div>
    </div>
  );
}
