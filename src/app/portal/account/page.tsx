import { redirect } from "next/navigation";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalAccountClient } from "@/components/portal/PortalAccountClient";
import { CreatorPortalPayoutSection } from "@/components/portal/CreatorPortalPayoutSection";
import { getCreatorPayoutRecipient } from "@/lib/payments/queries";
import { getCreatorById } from "@/lib/creators/queries";
import { getSponsorById } from "@/lib/sponsors/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  requireCreatorPortalUser,
  requireSponsorPortalUser,
} from "@/lib/portal/guard";
import { roleLabels, isPortalRole, isSponsorPortalRole } from "@/lib/team";
import { getMyAvatarUrl } from "@/app/account/actions";

export default async function PortalAccountPage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect(STAFF_DASHBOARD_PATH);
  }

  const [organization, email, avatarUrl, userId] = await Promise.all([
    getOrganizationForUser(),
    getUserEmail(),
    getMyAvatarUrl(),
    getUserId(),
  ]);

  if (!userId) {
    redirect("/login");
  }

  if (isSponsorPortalRole(membership.role)) {
    const { linkedSponsorId } = await requireSponsorPortalUser();
    const sponsor = await getSponsorById(linkedSponsorId);

    if (!sponsor) {
      redirect("/portal");
    }

    return (
      <DashboardLayout title="Account" description="Your portal access">
        <PortalAccountClient
          organizationName={organization?.name ?? "Your organization"}
          roleLabel={roleLabels[membership.role]}
          email={email}
          profileLabel={sponsor.companyName}
          profileHref={`/sponsors/${sponsor.id}`}
          userId={userId}
          avatarUrl={avatarUrl}
        />
      </DashboardLayout>
    );
  }

  const { linkedCreatorId } = await requireCreatorPortalUser();
  const [creator, payoutRecipient] = await Promise.all([
    getCreatorById(linkedCreatorId),
    getCreatorPayoutRecipient(linkedCreatorId),
  ]);

  if (!creator) {
    redirect("/portal");
  }

  return (
    <DashboardLayout title="Account" description="Your portal access">
      <div className="mx-auto max-w-2xl space-y-6">
        <PortalAccountClient
          organizationName={organization?.name ?? "Your organization"}
          roleLabel={roleLabels[membership.role]}
          email={email}
          profileLabel={creator.name}
          profileHref={`/creators/${creator.id}`}
          userId={userId}
          avatarUrl={avatarUrl}
        />
        <CreatorPortalPayoutSection
          creatorId={linkedCreatorId}
          recipient={payoutRecipient}
        />
      </div>
    </DashboardLayout>
  );
}

async function getUserEmail(): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email ?? "";
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
