"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  type Contract,
  type ContractStatus,
  contractStatusLabels,
  getAllowedStatusTransitions,
  isContractOverdue,
} from "@/lib/contracts";
import { updateContractStatus } from "@/app/contracts/actions";

interface ContractWorkflowActionsProps {
  contract: Contract;
  canWrite?: boolean;
}

const actionLabels: Partial<Record<ContractStatus, string>> = {
  negotiating: "Start negotiating",
  active: "Activate contract",
  completed: "Mark completed",
  expired: "Mark expired",
  cancelled: "Cancel contract",
  draft: "Move to draft",
};

function getPrimaryAction(
  contract: Contract
): { status: ContractStatus; label: string; variant: "primary" | "danger" } | null {
  const { status } = contract;
  const overdue = isContractOverdue(contract);

  if (status === "draft") {
    return { status: "negotiating", label: "Start negotiating", variant: "primary" };
  }
  if (status === "negotiating") {
    return { status: "active", label: "Activate contract", variant: "primary" };
  }
  if (status === "active") {
    if (overdue) {
      return { status: "expired", label: "Mark as expired", variant: "danger" };
    }
    return { status: "completed", label: "Mark completed", variant: "primary" };
  }
  return null;
}

export function ContractWorkflowActions({
  contract,
  canWrite = true,
}: ContractWorkflowActionsProps) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<ContractStatus | null>(
    null
  );
  const [error, setError] = useState("");

  if (!canWrite) return null;

  const primary = getPrimaryAction(contract);
  const secondary = getAllowedStatusTransitions(contract.status).filter(
    (status) => status !== primary?.status && status !== "cancelled"
  );

  async function handleStatusChange(newStatus: ContractStatus) {
    setError("");
    setLoadingStatus(newStatus);

    const result = await updateContractStatus(contract.id, newStatus);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoadingStatus(null);
      return;
    }

    setLoadingStatus(null);
    router.refresh();
  }

  if (!primary && secondary.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        This contract is {contractStatusLabels[contract.status].toLowerCase()}.
        Edit to change details.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {primary && (
          <button
            type="button"
            onClick={() => handleStatusChange(primary.status)}
            disabled={loadingStatus !== null}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              primary.variant === "danger"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-accent hover:bg-accent-dark"
            }`}
          >
            {loadingStatus === primary.status && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {primary.label}
          </button>
        )}
        {secondary.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusChange(status)}
            disabled={loadingStatus !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-surface-overlay hover:text-white disabled:opacity-50"
          >
            {loadingStatus === status && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {actionLabels[status] ?? contractStatusLabels[status]}
          </button>
        ))}
        {getAllowedStatusTransitions(contract.status).includes("cancelled") && (
          <button
            type="button"
            onClick={() => handleStatusChange("cancelled")}
            disabled={loadingStatus !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            {loadingStatus === "cancelled" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Cancel contract
          </button>
        )}
      </div>
    </div>
  );
}
