import { DashboardLayout } from "@/components/DashboardLayout";
import { getTranslations } from "next-intl/server";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { ContractsPageClient } from "@/components/contracts/ContractsPageClient";
import { getContracts } from "@/lib/contracts/queries";
import { getDeliverablesSummariesForContracts } from "@/lib/contract-deliverables/queries";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  hasFullAccess,
  getCurrentUserMembership,
  getCurrentUserRole,
} from "@/lib/permissions";
import { isPortalRole } from "@/lib/team";

interface ContractsPageProps {
  searchParams: Promise<{ filter?: string; create?: string }>;
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const { filter, create } = await searchParams;
  const initialSummaryFilter =
    filter === "expiring" || filter === "overdue" || filter === "active" || filter === "pipeline"
      ? filter
      : null;

  const membership = await getCurrentUserMembership();
  const isPortalUser = Boolean(membership && isPortalRole(membership.role));

  const [contracts, creators, sponsors, role] = await Promise.all([
    getContracts(),
    isPortalUser ? Promise.resolve([]) : getCreators(),
    isPortalUser ? Promise.resolve([]) : getSponsors(),
    getCurrentUserRole(),
  ]);

  const deliverableSummaries = await getDeliverablesSummariesForContracts(
    contracts.map((c) => c.id)
  );

  const t = await getTranslations("pages.contracts");

  return (
    <DashboardLayout
      title={t("title")}
      description={t("description")}
    >
      <SubscriptionPageGate required="contracts" featureLabel="Deals">
        <ContractsPageClient
          contracts={contracts}
          creators={creators}
          sponsors={sponsors}
          deliverableSummaries={deliverableSummaries}
          canWrite={hasFullAccess(role, "contracts")}
          initialSummaryFilter={initialSummaryFilter}
          isPortalUser={isPortalUser}
          initialCreateOpen={create === "true"}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
