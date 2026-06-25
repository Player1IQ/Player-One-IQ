"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Loader2 } from "lucide-react";
import { toggleDeliverableComplete } from "@/app/contracts/deliverable-actions";
import type { PortalDeliverableListItem } from "@/lib/contract-deliverables/queries";
import { deliverableStatusLabels } from "@/lib/contract-deliverables";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface PortalDeliverablesClientProps {
  deliverables: PortalDeliverableListItem[];
}

type DeliverableFilter = "all" | "open" | "overdue" | "completed";

export function PortalDeliverablesClient({
  deliverables: initialDeliverables,
}: PortalDeliverablesClientProps) {
  const router = useRouter();
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [filter, setFilter] = useState<DeliverableFilter>("open");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return deliverables.filter((item) => {
      if (filter === "all") return true;
      if (filter === "open") {
        return item.status !== "completed";
      }
      if (filter === "overdue") return item.isOverdue;
      return item.status === "completed";
    });
  }, [deliverables, filter]);

  const openCount = deliverables.filter((item) => item.status !== "completed")
    .length;
  const overdueCount = deliverables.filter((item) => item.isOverdue).length;

  function handleToggle(item: PortalDeliverableListItem) {
    setLoadingId(item.id);
    startTransition(async () => {
      const result = await toggleDeliverableComplete(item.id);
      setLoadingId(null);
      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }
      setDeliverables((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                displayStatus:
                  entry.status === "completed" ? "pending" : "completed",
                status: entry.status === "completed" ? "pending" : "completed",
                isOverdue: false,
              }
            : entry
        )
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Open
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Overdue
            </p>
            <p className="mt-1 text-2xl font-bold text-red-300">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {deliverables.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "open", label: "Open" },
            { value: "overdue", label: "Overdue" },
            { value: "completed", label: "Completed" },
            { value: "all", label: "All" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === option.value
                ? "border-accent/40 bg-accent/15 text-accent-light"
                : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            deliverables.length === 0
              ? "No deliverables yet"
              : "No matching deliverables"
          }
          description={
            deliverables.length === 0
              ? "When you land sponsorship deals, deliverables from those contracts will show up here."
              : "Try a different filter to see other items."
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your deliverables</CardTitle>
            <CardDescription>
              Track and update status across all your sponsorship deals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  item.isOverdue
                    ? "border-red-500/25 bg-red-500/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-200">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.contractName} · {item.sponsorName}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      item.isOverdue ? "text-red-300" : "text-gray-500"
                    )}
                  >
                    Due {item.dueDateDisplay}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.isOverdue ? "danger" : "default"}>
                    {deliverableStatusLabels[item.status]}
                  </Badge>
                  <button
                    type="button"
                    disabled={isPending && loadingId === item.id}
                    onClick={() => handleToggle(item)}
                    className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-light hover:bg-accent/20 disabled:opacity-50"
                  >
                    {isPending && loadingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : item.status === "completed" ? (
                      "Mark incomplete"
                    ) : (
                      "Mark complete"
                    )}
                  </button>
                  <Link
                    href={`/contracts/${item.contractId}`}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                  >
                    View deal
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
