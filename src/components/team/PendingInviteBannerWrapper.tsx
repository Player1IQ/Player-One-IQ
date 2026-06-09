import { getPendingInvitationDetails } from "@/lib/team/queries";
import { PendingInviteBanner } from "./PendingInviteBanner";

export async function PendingInviteBannerWrapper() {
  const invite = await getPendingInvitationDetails();
  if (!invite) return null;

  return (
    <PendingInviteBanner
      token={invite.token}
      organizationName={invite.organizationName}
      role={invite.role}
    />
  );
}
