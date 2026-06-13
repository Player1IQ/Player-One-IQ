"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DollarSign, Loader2, MessageSquare } from "lucide-react";
import { updateContractDealTerms } from "@/app/contracts/actions";
import type { Contract, ContractNegotiationContext } from "@/lib/contracts";
import { formatCurrency } from "@/lib/contracts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ContractNegotiationPanelProps {
  contract: Contract;
  negotiationContext: ContractNegotiationContext | null;
  canWrite?: boolean;
}

export function ContractNegotiationPanel({
  contract,
  negotiationContext,
  canWrite = true,
}: ContractNegotiationPanelProps) {
  const router = useRouter();
  const [valueInput, setValueInput] = useState(String(contract.contractValue || ""));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dealRoomId, setDealRoomId] = useState<string | null>(null);

  useEffect(() => {
    setValueInput(String(contract.contractValue || ""));
  }, [contract.contractValue, contract.updatedAt]);

  if (contract.status !== "draft" && contract.status !== "negotiating") {
    return null;
  }

  if (!canWrite) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
        View-only access — an owner or admin can update deal terms during
        negotiation.
      </div>
    );
  }

  function applyValue(amount: number) {
    setValueInput(String(amount));
  }

  async function handleSave() {
    setError("");
    const parsed = Number(valueInput.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid contract value.");
      return;
    }

    setLoading(true);
    setDealRoomId(null);
    const result = await updateContractDealTerms(
      contract.id,
      parsed,
      note.trim() || undefined
    );
    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setNote("");
    if ("dealRoomId" in result && result.dealRoomId) {
      setDealRoomId(result.dealRoomId);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
          <DollarSign className="h-4 w-4" />
          Negotiate deal value
        </h3>
        <p className="mt-1 text-sm text-amber-200/70">
          Update the contract price before activating. Your team is notified in
          the contract deal room so they can review or counter-offer.
        </p>
      </div>

      {negotiationContext ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
            <p className="text-xs text-gray-500">Creator proposed</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {negotiationContext.proposedRateDisplay}
            </p>
            {negotiationContext.proposedRate !== null ? (
              <button
                type="button"
                onClick={() => applyValue(negotiationContext.proposedRate!)}
                className="mt-2 text-xs font-medium text-accent-light hover:text-white"
              >
                Use this rate
              </button>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
            <p className="text-xs text-gray-500">Opportunity budget</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {negotiationContext.opportunityBudgetDisplay}
            </p>
            {negotiationContext.opportunityBudget !== null ? (
              <button
                type="button"
                onClick={() => applyValue(negotiationContext.opportunityBudget!)}
                className="mt-2 text-xs font-medium text-accent-light hover:text-white"
              >
                Use budget
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Contract value (USD)
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Current: {contract.valueDisplay}
            {Number(valueInput) !== contract.contractValue &&
            Number.isFinite(Number(valueInput))
              ? ` → ${formatCurrency(Number(valueInput))}`
              : null}
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Negotiation note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="e.g. Counter-offer after sponsor call — includes 2 extra streams"
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {dealRoomId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-200">
            Team notified in the contract deal room to review these terms.
          </p>
          <Link
            href={`/messages/${dealRoomId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
            Open deal room
          </Link>
        </div>
      ) : null}

      <Button type="button" onClick={handleSave} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Saving…" : "Update deal value"}
      </Button>
    </div>
  );
}
