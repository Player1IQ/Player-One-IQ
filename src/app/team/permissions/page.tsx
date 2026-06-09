import { DashboardLayout } from "@/components/DashboardLayout";
import { PermissionsPageClient } from "@/components/team/PermissionsPageClient";

export default function PermissionsPage() {
  return (
    <DashboardLayout
      title="Permissions"
      description="Role-based access control for your organization"
    >
      <PermissionsPageClient />
    </DashboardLayout>
  );
}
