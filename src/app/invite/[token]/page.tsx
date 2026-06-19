import { AuthLayout } from "@/components/auth/AuthLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AcceptInviteClient } from "@/components/team/AcceptInviteClient";
import { getInvitationByToken } from "@/lib/team/queries";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const inviteContent = (
    <AcceptInviteClient
      token={token}
      email={invitation.email}
      role={invitation.role}
      organizationName={invitation.organizationName}
      status={invitation.status}
      expiresAt={invitation.expiresAt}
      userEmail={user?.email ?? null}
    />
  );

  if (!user) {
    return (
      <AuthLayout
        title="Team invitation"
        subtitle={`Join ${invitation.organizationName} on Player One IQ`}
      >
        {inviteContent}
      </AuthLayout>
    );
  }

  return (
    <DashboardLayout
      title="Team Invitation"
      description="Accept your invitation to join the organization"
    >
      {inviteContent}
    </DashboardLayout>
  );
}
