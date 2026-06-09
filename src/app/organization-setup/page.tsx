import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OrganizationSetupForm } from "@/components/auth/OrganizationSetupForm";
import { getPendingInvitationForUser } from "@/lib/team/queries";

export default async function OrganizationSetupPage() {
  const pendingToken = await getPendingInvitationForUser();
  if (pendingToken) {
    redirect(`/invite/${pendingToken}`);
  }

  return (
    <AuthLayout
      title="Set up your organization"
      subtitle="Just a few details to personalize your workspace"
    >
      <OrganizationSetupForm />
    </AuthLayout>
  );
}
