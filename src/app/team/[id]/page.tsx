import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamMemberProfile } from "@/components/team/TeamMemberProfile";
import { getTeamMemberById } from "@/lib/team/queries";
import { getCreators } from "@/lib/creators/queries";
import { getCurrentUserRole } from "@/lib/permissions";
import { canManageTeam, roleLabels } from "@/lib/team";

interface TeamMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { id } = await params;
  const [member, currentUserRole, creators] = await Promise.all([
    getTeamMemberById(id),
    getCurrentUserRole(),
    getCreators(),
  ]);

  if (!member || member.isInvitation) {
    notFound();
  }

  return (
    <DashboardLayout
      title={member.name}
      description={roleLabels[member.role]}
    >
      <TeamMemberProfile
        member={member}
        creators={creators}
        canManageTeam={canManageTeam(currentUserRole)}
        currentUserRole={currentUserRole}
      />
    </DashboardLayout>
  );
}
