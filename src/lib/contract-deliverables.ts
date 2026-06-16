export type DeliverableStatus = "pending" | "in_progress" | "completed";

export type DeliverableDisplayStatus = DeliverableStatus | "overdue";

export const deliverableStatuses: DeliverableStatus[] = [
  "pending",
  "in_progress",
  "completed",
];

export const deliverableStatusLabels: Record<DeliverableDisplayStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

export interface ContractDeliverableRow {
  id: string;
  organization_id: string;
  contract_id: string;
  title: string;
  status: DeliverableStatus;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContractDeliverable {
  id: string;
  organizationId: string;
  contractId: string;
  title: string;
  status: DeliverableStatus;
  displayStatus: DeliverableDisplayStatus;
  dueDate: string | null;
  dueDateDisplay: string;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface DeliverablesSummary {
  total: number;
  completed: number;
  progressPercent: number;
  nextDue: ContractDeliverable | null;
}

function formatDateDisplay(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDeliverableOverdue(
  status: DeliverableStatus,
  dueDate: string | null
): boolean {
  if (status === "completed" || !dueDate) return false;
  return dueDate < todayDateString();
}

export function resolveDisplayStatus(
  status: DeliverableStatus,
  dueDate: string | null
): DeliverableDisplayStatus {
  if (isDeliverableOverdue(status, dueDate)) return "overdue";
  return status;
}

export function mapDeliverableRow(row: ContractDeliverableRow): ContractDeliverable {
  const isOverdue = isDeliverableOverdue(row.status, row.due_date);
  return {
    id: row.id,
    organizationId: row.organization_id,
    contractId: row.contract_id,
    title: row.title,
    status: row.status,
    displayStatus: resolveDisplayStatus(row.status, row.due_date),
    dueDate: row.due_date,
    dueDateDisplay: formatDateDisplay(row.due_date),
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isOverdue,
  };
}

export function computeDeliverablesProgress(
  deliverables: ContractDeliverable[]
): { completed: number; total: number; progressPercent: number } {
  const total = deliverables.length;
  const completed = deliverables.filter((d) => d.status === "completed").length;
  const progressPercent =
    total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, progressPercent };
}

export function buildDeliverablesSummary(
  deliverables: ContractDeliverable[]
): DeliverablesSummary {
  const { completed, total, progressPercent } =
    computeDeliverablesProgress(deliverables);

  const open = deliverables.filter((d) => d.status !== "completed");
  const nextDue =
    open.length === 0
      ? null
      : [...open].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return a.sortOrder - b.sortOrder;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
          return a.sortOrder - b.sortOrder;
        })[0] ?? null;

  return { total, completed, progressPercent, nextDue };
}

export function getDeliverableStats(deliverables: ContractDeliverable[]) {
  const overdue = deliverables.filter((d) => d.isOverdue);
  const inProgress = deliverables.filter((d) => d.status === "in_progress");
  const pending = deliverables.filter((d) => d.status === "pending");
  const completed = deliverables.filter((d) => d.status === "completed");
  const open = deliverables.filter((d) => d.status !== "completed");

  return {
    overdueCount: overdue.length,
    inProgressCount: inProgress.length,
    pendingCount: pending.length,
    completedCount: completed.length,
    openCount: open.length,
    ...computeDeliverablesProgress(deliverables),
  };
}

export function parseDeliverableTitlesFromText(text: string | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function deliverableStatusBadgeVariant(
  displayStatus: DeliverableDisplayStatus
): "default" | "accent" | "success" | "warning" | "danger" | "muted" {
  switch (displayStatus) {
    case "completed":
      return "success";
    case "in_progress":
      return "accent";
    case "overdue":
      return "danger";
    default:
      return "muted";
  }
}
