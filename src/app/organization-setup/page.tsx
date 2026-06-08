import { AuthLayout } from "@/components/auth/AuthLayout";
import { OrganizationSetupForm } from "@/components/auth/OrganizationSetupForm";

export default function OrganizationSetupPage() {
  return (
    <AuthLayout
      title="Set up your organization"
      subtitle="Just a few details to personalize your workspace"
    >
      <OrganizationSetupForm />
    </AuthLayout>
  );
}
