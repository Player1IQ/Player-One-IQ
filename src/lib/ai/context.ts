import { getOrganizationForUser } from "@/lib/organization/queries";
import { getCreators } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import { getOpportunities } from "@/lib/opportunities/queries";
import {
  getConnectedPlatformAccountCount,
  getOrganizationRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { getDashboardRevenueSummary } from "@/lib/revenue/summary";

export interface AiWorkspaceContext {
  organizationName: string;
  organizationType: string;
  creatorCount: number;
  creators: Array<{
    name: string;
    platform: string;
    status: string;
    handles: string[];
  }>;
  sponsorCount: number;
  sponsors: Array<{ name: string; industry: string | null }>;
  contractCount: number;
  contracts: Array<{
    name: string;
    creator: string;
    sponsor: string;
    value: number;
    status: string;
  }>;
  opportunityCount: number;
  opportunities: Array<{
    title: string;
    status: string;
    category: string | null;
    budget: string | null;
  }>;
  revenue: {
    totalMonthly: number;
    contractRevenue: number;
    platformRevenue: number;
    connectedAccounts: number;
  };
}

export async function buildAiWorkspaceContext(): Promise<AiWorkspaceContext> {
  const [
    organization,
    creators,
    sponsors,
    contracts,
    opportunities,
    platformEntries,
    connectedAccountCount,
  ] = await Promise.all([
    getOrganizationForUser(),
    getCreators(),
    getSponsors(),
    getContracts(),
    getOpportunities(),
    getOrganizationRevenueEntries(),
    getConnectedPlatformAccountCount(),
  ]);

  const revenue = getDashboardRevenueSummary(
    contracts,
    platformEntries,
    connectedAccountCount
  );

  return {
    organizationName: organization?.name ?? "Workspace",
    organizationType: organization?.type ?? "Unknown",
    creatorCount: creators.length,
    creators: creators.slice(0, 12).map((c) => ({
      name: c.name,
      platform: c.primaryPlatform,
      status: c.status,
      handles: c.socialHandles.map((h) => `${h.platform}: ${h.handle}`),
    })),
    sponsorCount: sponsors.length,
    sponsors: sponsors.slice(0, 12).map((s) => ({
      name: s.companyName,
      industry: s.industry ?? null,
    })),
    contractCount: contracts.length,
    contracts: contracts.slice(0, 12).map((c) => ({
      name: c.contractName,
      creator: c.creatorName,
      sponsor: c.sponsorName,
      value: c.contractValue,
      status: c.status,
    })),
    opportunityCount: opportunities.length,
    opportunities: opportunities.slice(0, 12).map((o) => ({
      title: o.title,
      status: o.status,
      category: o.category ?? null,
      budget: o.budgetDisplay ?? null,
    })),
    revenue: {
      totalMonthly: revenue.total,
      contractRevenue: revenue.contractRevenue,
      platformRevenue: revenue.platformRevenue,
      connectedAccounts: connectedAccountCount,
    },
  };
}

export function summarizeContextForPrompt(context: AiWorkspaceContext): string {
  return JSON.stringify(context, null, 2);
}
