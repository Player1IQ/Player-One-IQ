import type { ContractPaymentStatus, PayeeType } from "./types";

export interface DerivedPayee {
  payeeType: PayeeType;
  payeeCreatorId: string | null;
}

/** Convert contract dollar value to integer cents (USD). */
export function parseContractValueToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

/** V1: contract payouts always go to the linked creator. */
export function derivePayeeFromContract(contract: {
  creatorId: string;
}): DerivedPayee {
  return {
    payeeType: "creator",
    payeeCreatorId: contract.creatorId,
  };
}

export function canRecordExternalPayment(status: ContractPaymentStatus): boolean {
  return status === "ready";
}

export function isTerminalPaymentStatus(status: ContractPaymentStatus): boolean {
  return (
    status === "paid_external" ||
    status === "paid_platform" ||
    status === "cancelled"
  );
}

export function nextStatusAfterExternalPayment(
  current: ContractPaymentStatus
): ContractPaymentStatus | null {
  if (!canRecordExternalPayment(current)) return null;
  return "paid_external";
}

export function deriveInitialPaymentStatus(amountCents: number): ContractPaymentStatus {
  return amountCents > 0 ? "ready" : "pending";
}
