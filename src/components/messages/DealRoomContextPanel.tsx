import Link from "next/link";
import { Briefcase, ExternalLink, FileText } from "lucide-react";
import type { DealRoomContext } from "@/lib/messages/deal-room-context";

interface DealRoomContextPanelProps {
  context: DealRoomContext;
}

export function DealRoomContextPanel({ context }: DealRoomContextPanelProps) {
  const Icon = context.type === "opportunity" ? Briefcase : FileText;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-surface/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-4 w-4 text-accent-light" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {context.type === "opportunity" ? "Opportunity" : "Contract"}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-white">
            {context.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{context.statusLabel}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-400">
        {context.summary}
      </p>

      <dl className="mt-4 space-y-2">
        {context.details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <dt className="text-gray-500">{detail.label}</dt>
            <dd className="truncate font-medium text-gray-200">{detail.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={context.href}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-light transition-colors hover:text-white"
      >
        View {context.type}
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>

      <p className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-gray-500">
        Creator applications and term updates appear as timeline events here.
        Use chat for internal team coordination.
      </p>
    </div>
  );
}
