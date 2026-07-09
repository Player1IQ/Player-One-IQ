"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import type { ContractPayment } from "@/lib/payments/types";
import { contractPaymentStatusLabels } from "@/lib/payments/types";
import { recordExternalPayment } from "@/app/payments/actions";

interface ContractPaymentPanelProps {
  contractId: string;
  payment: ContractPayment | null;
  canRecordPayment: boolean;
}

function PaymentStatusBadge({ status }: { status: ContractPayment["status"] }) {
  const styles: Record<ContractPayment["status"], string> = {
    pending: "border-gray-500/30 bg-gray-500/10 text-gray-300",
    ready: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    paid_external: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    paid_platform: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    cancelled: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {contractPaymentStatusLabels[status]}
    </span>
  );
}

export function ContractPaymentPanel({
  contractId,
  payment,
  canRecordPayment,
}: ContractPaymentPanelProps) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!payment) {
    return null;
  }

  const showRecordForm =
    payment.status === "ready" && canRecordPayment;

  function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await recordExternalPayment({
        contractId,
        externalReference: reference,
        notes,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setMessage("Payment recorded.");
      setReference("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Contract payout</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track off-platform payouts — funds are not held in Player One IQ.
          </p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Amount
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {payment.amountDisplay}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Payee
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {payment.payeeName}
          </p>
        </div>
      </div>

      {payment.payoutInstructions ? (
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Payout instructions
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
            {payment.payoutInstructions}
          </p>
        </div>
      ) : payment.status === "ready" ? (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm font-medium text-amber-200/90">
            No payout instructions on file
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Add wire or ACH details in{" "}
            <Link
              href="/settings"
              className="text-accent-light underline hover:text-white"
            >
              Settings → Payout settings
            </Link>{" "}
            before sending payment.
          </p>
        </div>
      ) : null}

      {payment.status === "paid_external" || payment.status === "paid_platform" ? (
        <div className="mt-4 space-y-2 text-sm text-gray-400">
          {payment.paidAt ? (
            <p>
              Paid{" "}
              {new Date(payment.paidAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          {payment.externalReference ? (
            <p>Reference: {payment.externalReference}</p>
          ) : null}
          {payment.notes ? <p className="text-gray-500">{payment.notes}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          title="Stripe Connect coming soon"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-gray-500 opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          Pay in app (coming soon)
        </button>
      </div>

      {showRecordForm ? (
        <form
          onSubmit={handleRecord}
          className="mt-6 space-y-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-4"
        >
          <h3 className="text-sm font-semibold text-white">
            Record external payment
          </h3>
          <p className="text-xs text-gray-500">
            Mark this contract as paid after sending funds off-platform (wire,
            ACH, etc.). No transaction fees apply in V1.
          </p>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment reference (optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={isPending}
              placeholder="Wire confirmation, check number, transaction ID…"
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-white disabled:opacity-50"
            />
          </div>
          {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Record payment
          </button>
        </form>
      ) : null}
    </section>
  );
}
