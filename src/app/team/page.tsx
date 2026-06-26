import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { PlanBillingSection } from "@/components/subscription/PlanBillingSection";
import { TeamPageClient } from "@/components/team/TeamPageClient";
import { getTeamMembers } from "@/lib/team/queries";
import { getCreators } from "@/lib/creators/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canManageTeam } from "@/lib/team";

import { getSponsors } from "@/lib/sponsors/queries";

export default async function TeamPage() {
  const [members, currentUserRole, creators, sponsors] = await Promise.all([
    getTeamMembers(),
    getCurrentUserRole(),
    getCreators(),
    getSponsors(),
  ]);

  return (
    <DashboardLayout
      title="Team"
      description="Manage team members, roles, and permissions"
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
          />
        </div>
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
