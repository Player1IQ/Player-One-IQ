export type PayoutRecipientType = "organization" | "creator";

export type ConnectStatus = "not_started" | "pending" | "active";

export type PayeeType = "creator" | "organization";

export type ContractPaymentStatus =
  | "pending"
  | "ready"
  | "paid_external"
  | "paid_platform"
  | "cancelled";

export type PaymentMethod = "external" | "platform";

export const contractPaymentStatusLabels: Record<ContractPaymentStatus, string> =
  {
    pending: "Pending",
    ready: "Ready to pay",
    paid_external: "Paid (external)",
    paid_platform: "Paid (in app)",
    cancelled: "Cancelled",
  };

export const connectStatusLabels: Record<ConnectStatus, string> = {
  not_started: "Not started",
  pending: "Pending",
  active: "Active",
};

export interface PayoutRecipientRow {
  id: string;
  organization_id: string;
  recipient_type: PayoutRecipientType;
  creator_id: string | null;
  label: string;
  payout_instructions: string | null;
  stripe_connect_account_id: string | null;
  connect_status: ConnectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creators?: { name: string } | { name: string }[] | null;
}

export interface PayoutRecipient {
  id: string;
  organizationId: string;
  recipientType: PayoutRecipientType;
  creatorId: string | null;
  creatorName: string | null;
  label: string;
  payoutInstructions: string;
  stripeConnectAccountId: string | null;
  connectStatus: ConnectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContractPaymentRow {
  id: string;
  organization_id: string;
  contract_id: string;
  payee_type: PayeeType;
  payee_creator_id: string | null;
  payee_recipient_id: string | null;
  amount_cents: number;
  currency: string;
  status: ContractPaymentStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  recorded_by: string | null;
  external_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  payout_recipients?: {
    payout_instructions: string | null;
    label: string;
  } | {
    payout_instructions: string | null;
    label: string;
  }[] | null;
  creators?: { name: string } | { name: string }[] | null;
}

export interface ContractPayment {
  id: string;
  organizationId: string;
  contractId: string;
  payeeType: PayeeType;
  payeeCreatorId: string | null;
  payeeRecipientId: string | null;
  amountCents: number;
  currency: string;
  status: ContractPaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  externalReference: string | null;
  notes: string | null;
  payeeName: string;
  amountDisplay: string;
  payoutInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

function relationName(
  relation:
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined
): string | null {
  if (!relation) return null;
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.name ?? null;
}

export function formatAmountCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function mapPayoutRecipientRow(row: PayoutRecipientRow): PayoutRecipient {
  return {
    id: row.id,
    organizationId: row.organization_id,
    recipientType: row.recipient_type,
    creatorId: row.creator_id,
    creatorName: relationName(row.creators),
    label: row.label,
    payoutInstructions: row.payout_instructions ?? "",
    stripeConnectAccountId: row.stripe_connect_account_id,
    connectStatus: row.connect_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContractPaymentRow(row: ContractPaymentRow): ContractPayment {
  const recipient = Array.isArray(row.payout_recipients)
    ? row.payout_recipients[0]
    : row.payout_recipients;
  const creatorName = relationName(row.creators);
  const payeeName =
    row.payee_type === "creator"
      ? creatorName ?? "Creator"
      : "Organization";

  return {
    id: row.id,
    organizationId: row.organization_id,
    contractId: row.contract_id,
    payeeType: row.payee_type,
    payeeCreatorId: row.payee_creator_id,
    payeeRecipientId: row.payee_recipient_id,
    amountCents: Number(row.amount_cents) || 0,
    currency: row.currency,
    status: row.status,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    externalReference: row.external_reference,
    notes: row.notes,
    payeeName,
    amountDisplay: formatAmountCents(Number(row.amount_cents) || 0, row.currency),
    payoutInstructions: recipient?.payout_instructions ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
