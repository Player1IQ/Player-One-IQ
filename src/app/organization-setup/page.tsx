import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OrganizationSetupForm } from "@/components/auth/OrganizationSetupForm";
import { getPendingInvitationForUser } from "@/lib/team/queries";
import type { SignupAccountType } from "@/lib/organization";

function parseAccountType(value: string | undefined): SignupAccountType {
  if (value === "creator" || value === "agency" || value === "sponsor") {
    return value;
  }
  return "agency";
}

export default async function OrganizationSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const pendingToken = await getPendingInvitationForUser();
  if (pendingToken) {
    redirect(`/invite/${pendingToken}`);
  }

  const { account } = await searchParams;
  const accountType = parseAccountType(account);
  const isCreator = accountType === "creator";

  return (
    <AuthLayout
      title={
        isCreator
          ? "Set up your creator profile"
          : accountType === "sponsor"
            ? "Set up your brand workspace"
            : "Set up your workspace"
      }
      subtitle={
        isCreator
          ? "A few details to unlock your creator portal"
          : accountType === "sponsor"
            ? "Tell us about your brand to get started"
            : "Choose creator/player or organization type to get started"
      }
    >
      <OrganizationSetupForm accountType={accountType} />
    </AuthLayout>
  );
}
