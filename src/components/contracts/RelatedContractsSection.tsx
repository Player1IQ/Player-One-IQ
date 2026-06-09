import Link from "next/link";
import type { Contract } from "@/lib/contracts";
import { isContractOverdue, isExpiringSoon } from "@/lib/contracts";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface RelatedContractsSectionProps {
  contracts: Contract[];
  emptyMessage: string;
}

export function RelatedContractsSection({
  contracts,
  emptyMessage,
}: RelatedContractsSectionProps) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-subtle py-10 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {contracts.map((contract) => {
        const expiring = isExpiringSoon(contract);
        const overdue = isContractOverdue(contract);

        return (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className="rounded-lg border border-border-subtle bg-surface p-4 transition-colors hover:border-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-100">
                  {contract.contractName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {contract.creatorName} × {contract.sponsorName}
                </p>
              </div>
              <ContractStatusBadge status={contract.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-white">
                {contract.valueDisplay}
              </span>
              <span
                className={`text-xs ${
                  overdue
                    ? "text-red-400"
                    : expiring
                      ? "text-orange-400"
                      : "text-gray-500"
                }`}
              >
                {overdue
                  ? `Overdue · ${contract.endDateDisplay}`
                  : contract.endDateDisplay}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
