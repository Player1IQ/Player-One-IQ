import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("onboarding.organizationSetup");

  return (
    <AuthLayout
      title={
        isCreator
          ? t("creatorTitle")
          : accountType === "sponsor"
            ? t("sponsorTitle")
            : t("agencyTitle")
      }
      subtitle={
        isCreator
          ? t("creatorSubtitle")
          : accountType === "sponsor"
            ? t("sponsorSubtitle")
            : t("agencySubtitle")
      }
    >
      <OrganizationSetupForm accountType={accountType} />
    </AuthLayout>
  );
}
