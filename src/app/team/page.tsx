import { DashboardLayout } from "@/components/DashboardLayout";
import { getTranslations } from "next-intl/server";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSection } from "@/components/subscription/PlanBillingSection";
import { TeamPageClient } from "@/components/team/TeamPageClient";
import { getTeamMembers } from "@/lib/team/queries";
import { getCreators } from "@/lib/creators/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canManageTeam } from "@/lib/team";

import { getSponsors } from "@/lib/sponsors/queries";

interface TeamPageProps {
  searchParams: Promise<{ create?: string }>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const { create } = await searchParams;
  const [members, currentUserRole, creators, sponsors] = await Promise.all([
    getTeamMembers(),
    getCurrentUserRole(),
    getCreators(),
    getSponsors(),
  ]);

  const t = await getTranslations("pages.team");

  return (
    <DashboardLayout
      title={t("title")}
      description={t("description")}
    >
      <SubscriptionPageGate required="team_management" featureLabel="Team management">
        <div className="space-y-6">
          <PlanBillingSection highlightMetrics={["team_members"]} />
          <TeamPageClient
            members={members}
            creators={creators}
            sponsors={sponsors}
            canManageTeam={canManageTeam(currentUserRole)}
            currentUserRole={currentUserRole}
            initialCreateOpen={create === "true"}
          />
        </div>
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
