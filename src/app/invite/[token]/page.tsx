import { AuthLayout } from "@/components/auth/AuthLayout";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AcceptInviteClient } from "@/components/team/AcceptInviteClient";
import { getInvitationByToken } from "@/lib/team/queries";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const t = await getTranslations("onboarding.invite");
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
        title={t("pageTitle")}
        subtitle={t("pageSubtitle", { organizationName: invitation.organizationName })}
      >
        {inviteContent}
      </AuthLayout>
    );
  }

  return (
    <DashboardLayout
      title={t("dashboardTitle")}
      description={t("dashboardDescription")}
    >
      {inviteContent}
    </DashboardLayout>
  );
}
