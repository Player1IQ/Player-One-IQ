import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamPageClient } from "@/components/team/TeamPageClient";
import { getTeamMembers } from "@/lib/team/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canManageTeam } from "@/lib/team";

export default async function TeamPage() {
  const [members, currentUserRole] = await Promise.all([
    getTeamMembers(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Team"
      description="Manage team members, roles, and permissions"
    >
      <TeamPageClient
        members={members}
        canManageTeam={canManageTeam(currentUserRole)}
        currentUserRole={currentUserRole}
      />
    </DashboardLayout>
  );
}
