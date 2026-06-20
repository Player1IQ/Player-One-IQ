import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalAccountClient } from "@/components/portal/PortalAccountClient";
import { getCreatorById } from "@/lib/creators/queries";
import { getOrganizationForUser } from "@/lib/organization/queries";
import { getCurrentUserMembership } from "@/lib/permissions";
import { requirePortalUser } from "@/lib/portal/guard";
import { roleLabels } from "@/lib/team";
import { isPortalRole } from "@/lib/team";

export default async function PortalAccountPage() {
  const membership = await getCurrentUserMembership();
  if (!membership || !isPortalRole(membership.role)) {
    redirect("/");
  }

  const { linkedCreatorId } = await requirePortalUser();

  const [creator, organization, email] = await Promise.all([
    getCreatorById(linkedCreatorId),
    getOrganizationForUser(),
    getUserEmail(),
  ]);

  if (!creator) {
    redirect("/portal");
  }

  return (
    <DashboardLayout title="Account" description="Your portal access">
      <PortalAccountClient
        organizationName={organization?.name ?? "Your organization"}
        roleLabel={roleLabels[membership.role]}
        email={email}
        creatorName={creator.name}
        creatorId={creator.id}
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
