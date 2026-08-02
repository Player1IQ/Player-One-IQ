import type { Contract } from "./types";

/** Statuses that count toward "Active deals" for creators and portal dashboards. */
export const ACTIVE_DEAL_STATUSES = ["active", "negotiating"] as const;

export type ActiveDealStatus = (typeof ACTIVE_DEAL_STATUSES)[number];

export function isActiveDealStatus(status: string): status is ActiveDealStatus {
  return (ACTIVE_DEAL_STATUSES as readonly string[]).includes(status);
}

export function countActiveDeals(contracts: Contract[]): number {
  return contracts.filter((contract) => isActiveDealStatus(contract.status))
    .length;
}
