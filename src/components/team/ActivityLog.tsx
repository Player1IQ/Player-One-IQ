import {
  Plus,
  Pencil,
  Trash2,
  LogIn,
  Mail,
  Shield,
} from "lucide-react";
import type { ActivityLogEntry } from "@/lib/team";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  compact?: boolean;
}

const typeConfig: Record<
  ActivityLogEntry["type"],
  { icon: typeof Plus; color: string }
> = {
  create: { icon: Plus, color: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  update: { icon: Pencil, color: "bg-blue-500/10 text-blue-400 ring-blue-500/20" },
  delete: { icon: Trash2, color: "bg-red-500/10 text-red-400 ring-red-500/20" },
  login: { icon: LogIn, color: "bg-gray-500/10 text-gray-400 ring-gray-500/20" },
  invite: { icon: Mail, color: "bg-amber-500/10 text-amber-400 ring-amber-500/20" },
  permission: { icon: Shield, color: "bg-purple-500/10 text-purple-400 ring-purple-500/20" },
};

export function ActivityLog({ entries, compact = false }: ActivityLogProps) {
  const displayEntries = compact ? entries.slice(0, 5) : entries;

  return (
    <div className="rounded-xl border border-border bg-surface-raised shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-white">Activity Log</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Recent actions across your organization
        </p>
      </div>
      <ul className="divide-y divide-border-subtle">
        {displayEntries.map((entry) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;

          return (
            <li
              key={entry.id}
              className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-surface-overlay/30"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${config.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-gray-100">
                    {entry.userName}
                  </span>{" "}
                  {entry.action.toLowerCase()}{" "}
                  <span className="text-accent-light">{entry.target}</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.timestamp}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
