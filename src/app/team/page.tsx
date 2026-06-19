import { DashboardLayout } from "@/components/DashboardLayout";
import { SubscriptionPageGate } from "@/components/subscription/SubscriptionPageGate";
import { TeamPageClient } from "@/components/team/TeamPageClient";
import { getTeamMembers } from "@/lib/team/queries";
import { getCreators } from "@/lib/creators/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canManageTeam } from "@/lib/team";

export default async function TeamPage() {
  const [members, currentUserRole, creators] = await Promise.all([
    getTeamMembers(),
    getCurrentUserRole(),
    getCreators(),
  ]);

  return (
    <DashboardLayout
      title="Team"
      description="Manage team members, roles, and permissions"
    >
      <SubscriptionPageGate required="team_management" featureLabel="Team management">
        <TeamPageClient
          members={members}
          creators={creators}
          canManageTeam={canManageTeam(currentUserRole)}
          currentUserRole={currentUserRole}
        />
      </SubscriptionPageGate>
    </DashboardLayout>
  );
}
