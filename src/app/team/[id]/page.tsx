import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamMemberProfile } from "@/components/team/TeamMemberProfile";
import { getTeamMemberById } from "@/lib/team";

interface TeamMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { id } = await params;
  const member = getTeamMemberById(id);

  if (!member) {
    notFound();
  }

  return (
    <DashboardLayout title={member.name} description={member.role}>
      <TeamMemberProfile member={member} />
    </DashboardLayout>
  );
}
