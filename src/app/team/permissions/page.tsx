import { DashboardLayout } from "@/components/DashboardLayout";
import { PermissionsPageClient } from "@/components/team/PermissionsPageClient";
import { activityLog } from "@/lib/team";

export default function PermissionsPage() {
  return (
    <DashboardLayout
      title="Permissions"
      description="Role-based access control for your organization"
    >
      <PermissionsPageClient activity={activityLog} />
    </DashboardLayout>
  );
}
