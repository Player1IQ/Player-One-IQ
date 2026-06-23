import { redirect } from "next/navigation";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isSponsorPortalRole } from "@/lib/team";
import { requireCreatorPortalUser, requireSponsorPortalUser } from "@/lib/portal/guard";

export default async function PortalProfilePage() {
  const membership = await getCurrentUserMembership();

  if (isSponsorPortalRole(membership?.role ?? null)) {
    const { linkedSponsorId } = await requireSponsorPortalUser();
    redirect(`/sponsors/${linkedSponsorId}`);
  }

  const { linkedCreatorId } = await requireCreatorPortalUser();
  redirect(`/creators/${linkedCreatorId}`);
}
