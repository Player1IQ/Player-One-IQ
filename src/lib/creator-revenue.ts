import { type Platform, platforms } from "@/lib/creators";
import { formatCurrency } from "@/lib/contracts";

export type ConnectionMethod = "manual" | "oauth";

export type ConnectionStatus =
  | "connected_manual"
  | "connected_oauth"
  | "pending_oauth"
  | "disconnected"
  | "sync_error";

export type RevenueType =
  | "advertisement"
  | "subscription"
  | "donations"
  | "other";

export type RevenueSource = "manual" | "api_sync";

export const revenueTypes: RevenueType[] = [
  "advertisement",
  "subscription",
  "donations",
  "other",
];

export const revenueTypeLabels: Record<RevenueType, string> = {
  advertisement: "Advertisement",
  subscription: "Subscriptions",
  donations: "Donations & tips",
  other: "Other",
};

export interface CreatorPlatformAccountRow {
  id: string;
  organization_id: string;
  creator_id: string;
  platform: string;
  account_handle: string;
  display_name: string | null;
  connection_method: ConnectionMethod;
  connection_status: ConnectionStatus;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorPlatformAccount {
  id: string;
  organizationId: string;
  creatorId: string;
  platform: Platform;
  accountHandle: string;
  displayName: string | null;
  connectionMethod: ConnectionMethod;
  connectionStatus: ConnectionStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  createdAt: string;
}

export interface CreatorRevenueEntryRow {
  id: string;
  organization_id: string;
  creator_id: string;
  platform_account_id: string | null;
  platform: string;
  revenue_type: RevenueType;
  amount: number;
  currency: string;
  period_month: string;
  source: RevenueSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorRevenueEntry {
  id: string;
  organizationId: string;
  creatorId: string;
  platformAccountId: string | null;
  platform: Platform;
  revenueType: RevenueType;
  amount: number;
  amountDisplay: string;
  currency: string;
  periodMonth: string;
  source: RevenueSource;
  notes: string | null;
}

export interface CreatorIncomeSummary {
  total: number;
  totalDisplay: string;
  advertisement: number;
  subscription: number;
  donations: number;
  other: number;
  byPlatform: { platform: Platform; total: number; totalDisplay: string }[];
}

export interface OrganizationRevenueSummary {
  platformRevenue: number;
  platformRevenueDisplay: string;
  advertisementRevenue: number;
  connectedAccountCount: number;
}

export function getCurrentPeriodMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function getPreviousPeriodMonth(date = new Date()): string {
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getCurrentPeriodMonth(previous);
}

export function formatPeriodMonth(periodMonth: string): string {
  const date = new Date(periodMonth + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function normalizePlatform(value: string): Platform {
  return platforms.includes(value as Platform) ? (value as Platform) : "YouTube";
}

export function mapPlatformAccountRow(
  row: CreatorPlatformAccountRow
): CreatorPlatformAccount {
  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    platform: normalizePlatform(row.platform),
    accountHandle: row.account_handle,
    displayName: row.display_name,
    connectionMethod: row.connection_method,
    connectionStatus: row.connection_status,
    lastSyncedAt: row.last_synced_at,
    syncError: row.sync_error,
    createdAt: row.created_at,
  };
}

export function mapRevenueEntryRow(row: CreatorRevenueEntryRow): CreatorRevenueEntry {
  const amount = Number(row.amount) || 0;
  return {
    id: row.id,
    organizationId: row.organization_id,
    creatorId: row.creator_id,
    platformAccountId: row.platform_account_id,
    platform: normalizePlatform(row.platform),
    revenueType: row.revenue_type,
    amount,
    amountDisplay: formatCurrency(amount),
    currency: row.currency,
    periodMonth: row.period_month,
    source: row.source,
    notes: row.notes,
  };
}

export function summarizeCreatorIncome(
  entries: CreatorRevenueEntry[]
): CreatorIncomeSummary {
  const byType = {
    advertisement: 0,
    subscription: 0,
    donations: 0,
    other: 0,
  };

  const platformTotals = new Map<Platform, number>();

  for (const entry of entries) {
    byType[entry.revenueType] += entry.amount;
    platformTotals.set(
      entry.platform,
      (platformTotals.get(entry.platform) ?? 0) + entry.amount
    );
  }

  const total =
    byType.advertisement +
    byType.subscription +
    byType.donations +
    byType.other;

  return {
    total,
    totalDisplay: formatCurrency(total),
    advertisement: byType.advertisement,
    subscription: byType.subscription,
    donations: byType.donations,
    other: byType.other,
    byPlatform: Array.from(platformTotals.entries())
      .map(([platform, platformTotal]) => ({
        platform,
        total: platformTotal,
        totalDisplay: formatCurrency(platformTotal),
      }))
      .sort((a, b) => b.total - a.total),
  };
}

export function summarizeOrganizationPlatformRevenue(
  entries: CreatorRevenueEntry[],
  connectedAccountCount: number
): OrganizationRevenueSummary {
  const platformRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const advertisementRevenue = entries
    .filter((entry) => entry.revenueType === "advertisement")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    platformRevenue,
    platformRevenueDisplay: formatCurrency(platformRevenue),
    advertisementRevenue,
    connectedAccountCount,
  };
}

export function connectionStatusLabel(status: ConnectionStatus): string {
  const labels: Record<ConnectionStatus, string> = {
    connected_manual: "Connected (manual)",
    connected_oauth: "Connected (API)",
    pending_oauth: "Pending authorization",
    disconnected: "Disconnected",
    sync_error: "Sync error",
  };
  return labels[status];
}
