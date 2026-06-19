import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Inbox,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OpsQueueItem = {
  id: string;
  label: string;
  detail?: string;
  href: string;
  severity: "critical" | "warning" | "info" | "comms";
};

const severityStyles = {
  critical: {
    border: "border-red-500/25 bg-red-500/5 hover:border-red-500/40",
    icon: "text-red-400",
    badge: "bg-red-500/15 text-red-200 ring-red-500/25",
    label: "Urgent",
  },
  warning: {
    border: "border-orange-500/25 bg-orange-500/5 hover:border-orange-500/40",
    icon: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-200 ring-orange-500/25",
    label: "Expiring",
  },
  info: {
    border: "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40",
    icon: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
    label: "Review",
  },
  comms: {
    border: "border-accent/25 bg-accent/5 hover:border-accent/40",
    icon: "text-accent-light",
    badge: "bg-accent/15 text-accent-light ring-accent/25",
    label: "Messages",
  },
};

function SeverityIcon({
  severity,
  className,
}: {
  severity: OpsQueueItem["severity"];
  className?: string;
}) {
  const props = { className: cn("h-4 w-4 shrink-0", className) };
  switch (severity) {
    case "critical":
      return <AlertTriangle {...props} />;
    case "warning":
      return <Clock {...props} />;
    case "info":
      return <Inbox {...props} />;
    case "comms":
      return <MessageSquare {...props} />;
  }
}

interface OpsQueueProps {
  items: OpsQueueItem[];
}

export function OpsQueue({ items }: OpsQueueProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface-raised/80 backdrop-blur-sm">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent-light/80">
          Overview
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Needs attention</h2>
          {items.length > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-500/25">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All clear
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/80" />
          <p className="mt-3 text-sm font-medium text-gray-200">
            You&apos;re all caught up
          </p>
          <p className="mt-1 text-xs text-gray-500">
            No overdue contracts, pending reviews, or unread messages.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {items.map((item) => {
            const style = severityStyles[item.severity];
            const leftBorder =
              item.severity === "critical"
                ? "border-l-red-500"
                : item.severity === "warning"
                  ? "border-l-orange-500"
                  : item.severity === "info"
                    ? "border-l-amber-500"
                    : "border-l-accent";
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-start gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-white/[0.03]",
                    leftBorder
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20",
                      style.icon
                    )}
                  >
                    <SeverityIcon severity={item.severity} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-100">
                        {item.label}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
                          style.badge
                        )}
                      >
                        {style.label}
                      </span>
                    </div>
                    {item.detail ? (
                      <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gray-600">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
