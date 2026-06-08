import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamPageClient } from "@/components/team/TeamPageClient";
import { teamMembers, activityLog } from "@/lib/team";

export default function TeamPage() {
  return (
    <DashboardLayout
      title="Team"
      description="Manage team members, roles, and permissions"
    >
      <TeamPageClient members={teamMembers} activity={activityLog} />
    </DashboardLayout>
  );
}
