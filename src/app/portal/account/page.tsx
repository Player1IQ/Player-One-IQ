import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalAccountClient } from "@/components/portal/PortalAccountClient";
import { getCreatorById } from "@/lib/creators/queries";
import { getSponsorById } from "@/lib/sponsors/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import {
  requireCreatorPortalUser,
  requireSponsorPortalUser,
} from "@/lib/portal/guard";
import { roleLabels, isPortalRole, isSponsorPortalRole } from "@/lib/team";

export default async function PortalAccountPage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect("/");
  }

  const [organization, email] = await Promise.all([
    getOrganizationForUser(),
    getUserEmail(),
  ]);

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
        />
      </DashboardLayout>
    );
  }

  const { linkedCreatorId } = await requireCreatorPortalUser();
  const creator = await getCreatorById(linkedCreatorId);

  if (!creator) {
    redirect("/portal");
  }

  return (
    <DashboardLayout title="Account" description="Your portal access">
      <PortalAccountClient
        organizationName={organization?.name ?? "Your organization"}
        roleLabel={roleLabels[membership.role]}
        email={email}
        profileLabel={creator.name}
        profileHref={`/creators/${creator.id}`}
      />
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
