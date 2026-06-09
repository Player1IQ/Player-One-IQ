"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { Sponsor } from "@/lib/sponsors";
import {
  type Contract,
  type ContractInput,
  type ContractStatus,
  contractStatuses,
} from "@/lib/contracts";
import { createContract, updateContract } from "@/app/contracts/actions";

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  contract?: Contract | null;
  creators: Creator[];
  sponsors: Sponsor[];
}

function contractToInput(contract: Contract): ContractInput {
  return {
    creatorId: contract.creatorId,
    sponsorId: contract.sponsorId,
    contractName: contract.contractName,
    contractValue: contract.contractValue,
    status: contract.status,
    startDate: contract.startDate ?? "",
    endDate: contract.endDate ?? "",
    deliverables: contract.deliverables,
    notes: contract.notes,
  };
}

const defaultInput = (): ContractInput => ({
  creatorId: "",
  sponsorId: "",
  contractName: "",
  contractValue: 0,
  status: "draft",
  startDate: "",
  endDate: "",
  deliverables: "",
  notes: "",
});

export function ContractFormModal({
  open,
  onClose,
  contract,
  creators,
  sponsors,
}: ContractFormModalProps) {
  const router = useRouter();
  const isEdit = !!contract;
  const [form, setForm] = useState<ContractInput>(defaultInput());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(contract ? contractToInput(contract) : defaultInput());
      setError("");
    }
  }, [open, contract]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isEdit
      ? await updateContract(contract!.id, form)
      : await createContract(form);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    if (!isEdit && "id" in result && result.id) {
      router.push(`/contracts/${result.id}`);
    }
    setLoading(false);
  }

  const noCreators = creators.length === 0;
  const noSponsors = sponsors.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-raised px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Contract" : "New Contract"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {(noCreators || noSponsors) && !isEdit && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              {noCreators && noSponsors
                ? "Add creators and sponsors before creating a contract."
                : noCreators
                  ? "Add at least one creator before creating a contract."
                  : "Add at least one sponsor before creating a contract."}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Contract Name
            </label>
            <input
              type="text"
              value={form.contractName}
              onChange={(e) =>
                setForm({ ...form, contractName: e.target.value })
              }
              placeholder="Q2 Stream Partnership"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Creator
              </label>
              <select
                value={form.creatorId}
                onChange={(e) =>
                  setForm({ ...form, creatorId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <option value="">Select creator</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Sponsor
              </label>
              <select
                value={form.sponsorId}
                onChange={(e) =>
                  setForm({ ...form, sponsorId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <option value="">Select sponsor</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Contract Value ($)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.contractValue || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contractValue: parseFloat(e.target.value) || 0,
                  })
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ContractStatus,
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {contractStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Deliverables
            </label>
            <textarea
              value={form.deliverables}
              onChange={(e) =>
                setForm({ ...form, deliverables: e.target.value })
              }
              rows={3}
              placeholder="List key deliverables, one per line..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes about this contract..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!isEdit && (noCreators || noSponsors))}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
