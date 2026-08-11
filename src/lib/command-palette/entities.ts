import { getCampaigns } from "@/lib/campaigns/queries";
import { campaignStatusLabels } from "@/lib/campaigns";
import { getContracts } from "@/lib/contracts/queries";
import { contractStatusLabels } from "@/lib/contracts";
import { getCreators } from "@/lib/creators/queries";
import { getConversations } from "@/lib/messages/queries";
import { conversationTypeLabels } from "@/lib/messages";
import {
  getAgencyOpenOpportunitiesForPortal,
  getMarketplaceOpportunities,
  getOpportunities,
} from "@/lib/opportunities/queries";
import { opportunityStatusLabels } from "@/lib/opportunities";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  canAccessStaffDashboard,
  isCreatorPortalRole,
  isPortalRole,
  type TeamRole,
} from "@/lib/team";
import type { CommandPaletteItem } from "./types";

export async function getCommandPaletteEntities(
  role: TeamRole | null
): Promise<CommandPaletteItem[]> {
  const isStaff = Boolean(role && canAccessStaffDashboard(role));
  const isPortal = Boolean(role && isPortalRole(role));

  const [contracts, campaigns, conversations] = await Promise.all([
    getContracts(),
    getCampaigns(),
    getConversations(),
  ]);

  const entities: CommandPaletteItem[] = [];

  for (const contract of contracts) {
    entities.push({
      id: `contract-${contract.id}`,
      section: "entity",
      label: contract.contractName,
      subtitle: `${contract.creatorName} × ${contract.sponsorName} · ${contractStatusLabels[contract.status]}`,
      href: `/contracts/${contract.id}`,
      keywords: ["deal", "contract", "agreement"],
      entityType: "contract",
    });
  }

  for (const campaign of campaigns) {
    entities.push({
      id: `campaign-${campaign.id}`,
      section: "entity",
      label: campaign.name,
      subtitle: `${campaign.sponsorName} · ${campaignStatusLabels[campaign.status]}`,
      href: `/campaigns/${campaign.id}`,
      keywords: ["campaign"],
      entityType: "campaign",
    });
  }

  if (isStaff) {
    const [creators, sponsors, opportunities] = await Promise.all([
      getCreators(),
      getSponsors(),
      getOpportunities(),
    ]);

    for (const creator of creators) {
      entities.push({
        id: `creator-${creator.id}`,
        section: "entity",
        label: creator.name,
        subtitle: creator.email || creator.primaryPlatform,
        href: `/creators/${creator.id}`,
        keywords: ["creator", "talent"],
        entityType: "creator",
      });
    }

    for (const sponsor of sponsors) {
      entities.push({
        id: `sponsor-${sponsor.id}`,
        section: "entity",
        label: sponsor.companyName,
        subtitle: sponsor.industry,
        href: `/sponsors/${sponsor.id}`,
        keywords: ["sponsor", "brand"],
        entityType: "sponsor",
      });
    }

    for (const opportunity of opportunities) {
      entities.push({
        id: `opportunity-${opportunity.id}`,
        section: "entity",
        label: opportunity.title,
        subtitle: `${opportunity.sponsorName} · ${opportunityStatusLabels[opportunity.status]}`,
        href: `/opportunities/${opportunity.id}`,
        keywords: ["opportunity", "brief"],
        entityType: "opportunity",
      });
    }
  } else if (isPortal && role && isCreatorPortalRole(role)) {
    const [agencyOpportunities, marketplaceOpportunities] = await Promise.all([
      getAgencyOpenOpportunitiesForPortal(),
      getMarketplaceOpportunities(),
    ]);
    const seen = new Set<string>();
    for (const opportunity of [
      ...agencyOpportunities,
      ...marketplaceOpportunities,
    ]) {
      if (seen.has(opportunity.id)) continue;
      seen.add(opportunity.id);
      entities.push({
        id: `opportunity-${opportunity.id}`,
        section: "entity",
        label: opportunity.title,
        subtitle: `${opportunity.sponsorName} · ${opportunityStatusLabels[opportunity.status]}`,
        href: `/opportunities/${opportunity.id}`,
        keywords: ["opportunity", "brief"],
        entityType: "opportunity",
      });
    }
  }

  for (const conversation of conversations) {
    entities.push({
      id: `message-${conversation.id}`,
      section: "entity",
      label: conversation.title,
      subtitle: `${conversationTypeLabels[conversation.type]}${conversation.lastMessage ? ` · ${conversation.lastMessage}` : ""}`,
      href: `/messages/${conversation.id}`,
      keywords: ["message", "chat", "inbox", "conversation"],
      entityType: "message",
    });
  }

  return entities;
}
