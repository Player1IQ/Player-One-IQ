"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createDeliverable,
  deleteDeliverable,
  toggleDeliverableComplete,
  updateDeliverable,
} from "@/app/contracts/deliverable-actions";
import {
  deliverableStatusBadgeVariant,
  deliverableStatusLabels,
  deliverableStatuses,
  getDeliverableStats,
  type ContractDeliverable,
  type DeliverableStatus,
} from "@/lib/contract-deliverables";
import type { RelatedCampaignSummary } from "@/lib/campaigns/contract-links";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ContractDeliverablesPanelProps {
  contractId: string;
  deliverables: ContractDeliverable[];
  relatedCampaigns?: RelatedCampaignSummary[];
  canWrite?: boolean;
  canUpdateStatus?: boolean;
}

type DeliverableFilter = "all" | "open" | "overdue" | "in_progress" | "completed";

const quickFilters: Array<{ value: DeliverableFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function ContractDeliverablesPanel({
  contractId,
  deliverables: initialDeliverables,
  relatedCampaigns = [],
  canWrite = true,
  canUpdateStatus = false,
}: ContractDeliverablesPanelProps) {
  const router = useRouter();
  const canChangeStatus = canWrite || canUpdateStatus;
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<DeliverableStatus>("pending");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeliverableFilter>("all");

  useEffect(() => {
    setDeliverables(initialDeliverables);
  }, [initialDeliverables]);

  const stats = getDeliverableStats(deliverables);
  const { completed, total, progressPercent } = stats;

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((item) => {
      switch (statusFilter) {
        case "open":
          return item.status !== "completed";
        case "overdue":
          return item.isOverdue;
        case "in_progress":
          return item.status === "in_progress";
        case "completed":
          return item.status === "completed";
        default:
          return true;
      }
    });
  }, [deliverables, statusFilter]);

  async function refreshAfterAction() {
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setError("");
    setAdding(true);
    const result = await createDeliverable(contractId, {
      title: newTitle,
      dueDate: newDueDate || null,
    });
    setAdding(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setNewTitle("");
    setNewDueDate("");
    await refreshAfterAction();
  }

  async function handleToggle(id: string) {
    if (!canChangeStatus) return;
    setLoadingId(id);
    setError("");
    const result = await toggleDeliverableComplete(id);
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    await refreshAfterAction();
  }

  async function handleStatusChange(id: string, status: DeliverableStatus) {
    if (!canChangeStatus) return;
    setLoadingId(id);
    setError("");
    const result = await updateDeliverable(id, { status });
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    await refreshAfterAction();
  }

  function startEdit(item: ContractDeliverable) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate ?? "");
    setEditStatus(item.status);
    setEditCampaignId(item.campaignId ?? "");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDueDate("");
    setEditStatus("pending");
    setEditCampaignId("");
  }

  async function handleSaveEdit(id: string) {
    if (!canWrite) return;
    setLoadingId(id);
    setError("");
    const result = await updateDeliverable(id, {
      title: editTitle,
      dueDate: editDueDate || null,
      status: editStatus,
      campaignId: editCampaignId || null,
    });
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    cancelEdit();
    await refreshAfterAction();
  }

  async function handleDelete(id: string, title: string) {
    if (!canWrite) return;
    if (!confirm(`Remove deliverable "${title}"?`)) return;
    setLoadingId(id);
    setError("");
    const result = await deleteDeliverable(id);
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    await refreshAfterAction();
  }

  async function handleCampaignChange(id: string, campaignId: string) {
    if (!canWrite) return;
    setLoadingId(id);
    setError("");
    const result = await updateDeliverable(id, {
      campaignId: campaignId || null,
    });
    setLoadingId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    await refreshAfterAction();
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div>
        <h2 className="text-base font-semibold text-white">
          Deliverables Checklist
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Track each deliverable from signed to completed
        </p>
      </div>

      {total > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              <span className="font-medium text-white">{completed}</span> of{" "}
              <span className="font-medium text-white">{total}</span> complete
            </span>
            <span className="font-medium text-accent-light">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {stats.overdueCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-red-100">
              {stats.overdueCount} deliverable
              {stats.overdueCount === 1 ? "" : "s"} past due
            </p>
            <p className="mt-0.5 text-xs text-red-200/80">
              Complete or reschedule items to keep this contract on track.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("overdue")}
            className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/20"
          >
            View overdue
          </button>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter.value
                  ? "border-accent/40 bg-accent/15 text-accent-light"
                  : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
              )}
            >
              {filter.label}
              {filter.value === "overdue" && stats.overdueCount > 0 ? (
                <span className="ml-1.5 text-red-400">({stats.overdueCount})</span>
              ) : null}
              {filter.value === "open" && stats.openCount > 0 ? (
                <span className="ml-1.5 text-amber-400">({stats.openCount})</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {deliverables.length === 0 ? (
        <p className="text-sm text-gray-500">
          No deliverables yet. Add items below to track progress.
        </p>
      ) : filteredDeliverables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center">
          <p className="text-sm text-gray-400">No deliverables match this filter.</p>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="mt-2 text-sm text-accent-light hover:text-white"
          >
            Show all
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredDeliverables.map((item) => {
            const isEditing = editingId === item.id;
            const isLoading = loadingId === item.id;

            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-xl border px-4 py-3 transition-colors",
                  item.isOverdue
                    ? "border-red-500/25 bg-red-500/5"
                    : item.status === "completed"
                      ? "border-emerald-500/15 bg-emerald-500/5"
                      : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={isLoading}
                      placeholder="Deliverable title"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">
                          Due date
                        </label>
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">
                          Status
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) =>
                            setEditStatus(e.target.value as DeliverableStatus)
                          }
                          disabled={isLoading}
                          className="w-full rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
                        >
                          {deliverableStatuses.map((s) => (
                            <option key={s} value={s}>
                              {deliverableStatusLabels[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {relatedCampaigns.length > 0 ? (
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">
                          Linked campaign
                        </label>
                        <select
                          value={editCampaignId}
                          onChange={(e) => setEditCampaignId(e.target.value)}
                          disabled={isLoading}
                          className="w-full rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
                        >
                          <option value="">No campaign</option>
                          {relatedCampaigns.map((campaign) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        disabled={isLoading}
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      disabled={!canChangeStatus || isLoading}
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        item.status === "completed"
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                          : "border-white/20 bg-transparent hover:border-accent/50"
                      )}
                      aria-label={
                        item.status === "completed"
                          ? "Mark incomplete"
                          : "Mark complete"
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : item.status === "completed" ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            item.status === "completed"
                              ? "text-gray-500 line-through"
                              : "text-white"
                          )}
                        >
                          {item.title}
                        </p>
                        <Badge
                          variant={deliverableStatusBadgeVariant(
                            item.displayStatus
                          )}
                        >
                          {deliverableStatusLabels[item.displayStatus]}
                        </Badge>
                      </div>
                      {item.dueDate ? (
                        <p
                          className={cn(
                            "mt-1 flex items-center gap-1.5 text-xs",
                            item.isOverdue
                              ? "text-red-400"
                              : "text-gray-500"
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          Due {item.dueDateDisplay}
                        </p>
                      ) : null}
                      {item.campaignId ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <Megaphone className="h-3 w-3 shrink-0" />
                          <Link
                            href={`/campaigns/${item.campaignId}`}
                            className="text-accent-light transition-colors hover:text-white"
                          >
                            {item.campaignName ?? "View campaign"}
                          </Link>
                        </p>
                      ) : canWrite && relatedCampaigns.length > 0 ? (
                        <div className="mt-2 max-w-xs">
                          <label className="sr-only" htmlFor={`campaign-${item.id}`}>
                            Link to campaign
                          </label>
                          <select
                            id={`campaign-${item.id}`}
                            value=""
                            onChange={(e) =>
                              handleCampaignChange(item.id, e.target.value)
                            }
                            disabled={isLoading}
                            className="w-full rounded-lg border border-white/[0.08] bg-surface-raised/80 px-2.5 py-1.5 text-xs text-gray-400 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
                          >
                            <option value="">Link to campaign…</option>
                            {relatedCampaigns.map((campaign) => (
                              <option key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      {canUpdateStatus && !canWrite ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {deliverableStatuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(item.id, status)}
                              disabled={isLoading || item.status === status}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-60",
                                item.status === status
                                  ? "border-accent/40 bg-accent/15 text-accent-light"
                                  : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
                              )}
                            >
                              {deliverableStatusLabels[status]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {canWrite ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={isLoading}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                          aria-label="Edit deliverable"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          disabled={isLoading}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          aria-label="Delete deliverable"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canWrite ? (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Add deliverable
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 2x Instagram posts"
              disabled={adding}
            />
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              disabled={adding}
              className="sm:w-40"
              aria-label="Due date"
            />
            <Button type="submit" disabled={adding || !newTitle.trim()}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </form>
      ) : !canChangeStatus ? (
        <p className="text-sm text-gray-500">
          View-only access — you cannot update deliverables on this contract.
        </p>
      ) : null}
    </div>
  );
}

export function ContractDeliverablesSummary({
  completed,
  total,
  progressPercent,
  nextDueTitle,
  nextDueDateDisplay,
  nextDueOverdue,
}: {
  completed: number;
  total: number;
  progressPercent: number;
  nextDueTitle?: string | null;
  nextDueDateDisplay?: string | null;
  nextDueOverdue?: boolean;
}) {
  if (total === 0) {
    return (
      <p className="text-sm text-gray-500">No deliverables defined yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          <span className="font-medium text-gray-200">{completed}</span> of{" "}
          <span className="font-medium text-gray-200">{total}</span> complete
        </span>
        <span className="text-xs font-medium text-accent-light">
          {progressPercent}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-accent/80 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {nextDueTitle ? (
        <p className="text-xs text-gray-500">
          Next:{" "}
          <span
            className={cn(
              "font-medium",
              nextDueOverdue ? "text-red-400" : "text-gray-300"
            )}
          >
            {nextDueTitle}
          </span>
          {nextDueDateDisplay && nextDueDateDisplay !== "—" ? (
            <span className={nextDueOverdue ? " text-red-400/80" : ""}>
              {" "}
              · due {nextDueDateDisplay}
            </span>
          ) : null}
        </p>
      ) : completed === total ? (
        <p className="text-xs font-medium text-emerald-400">
          All deliverables complete
        </p>
      ) : null}
    </div>
  );
}
