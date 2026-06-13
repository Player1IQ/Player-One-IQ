"use client";

import Link from "next/link";
import { X, Calendar, DollarSign, FileText, User, Building2 } from "lucide-react";
import type { Contract } from "@/lib/contracts";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  isContractOverdue,
  isExpiringSoon,
} from "@/lib/contracts";

interface ContractDetailPanelProps {
  contract: Contract | null;
  onClose: () => void;
}

export function ContractDetailPanel({
  contract,
  onClose,
}: ContractDetailPanelProps) {
  if (!contract) return null;

  const overdue = isContractOverdue(contract);
  const expiring = isExpiringSoon(contract);
  const deliverableLines = contract.deliverables
    ? contract.deliverables.split("\n").filter(Boolean)
    : [];

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-white/[0.06] bg-surface-raised/95 shadow-2xl backdrop-blur-xl animate-slide-up lg:static lg:max-w-sm lg:animate-none">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Contract Details</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ContractStatusBadge status={contract.status} />
            {overdue && <Badge variant="danger">Overdue</Badge>}
            {expiring && !overdue && <Badge variant="warning">Expiring soon</Badge>}
          </div>
          <h3 className="mt-3 text-lg font-bold text-white">
            {contract.contractName}
          </h3>
          <p className="mt-1 text-2xl font-bold text-accent-light">
            {contract.valueDisplay}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="!rounded-xl">
            <CardContent className="!p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Start</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white">
                {contract.startDateDisplay}
              </p>
            </CardContent>
          </Card>
          <Card className="!rounded-xl">
            <CardContent className="!p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">End</span>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  overdue ? "text-red-400" : expiring ? "text-orange-400" : "text-white"
                )}
              >
                {contract.endDateDisplay}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Link
            href={`/creators/${contract.creatorId}`}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-accent/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <User className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Creator</p>
              <p className="text-sm font-medium text-gray-200">
                {contract.creatorName}
              </p>
            </div>
          </Link>
          <Link
            href={`/sponsors/${contract.sponsorId}`}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-accent/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Building2 className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sponsor</p>
              <p className="text-sm font-medium text-gray-200">
                {contract.sponsorName}
              </p>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader className="!py-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-500" />
              Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent className="!pt-0">
            {deliverableLines.length === 0 ? (
              <p className="text-sm text-gray-500">No deliverables defined yet.</p>
            ) : (
              <ul className="space-y-2">
                {deliverableLines.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {contract.notes && (
          <Card>
            <CardHeader className="!py-4">
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="!pt-0">
              <p className="text-sm leading-relaxed text-gray-400">
                {contract.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-5">
        <Link href={`/contracts/${contract.id}`}>
          <Button variant="primary" className="w-full">
            <DollarSign className="h-4 w-4" />
            View Full Contract
          </Button>
        </Link>
      </div>
    </div>
  );
}
