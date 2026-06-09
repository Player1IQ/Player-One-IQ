import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorsPageClient } from "@/components/creators/CreatorsPageClient";
import { getCreators } from "@/lib/creators/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";
import { isSeedEnabled } from "@/lib/seed/constants";

export default async function CreatorsPage() {
  const [creators, role] = await Promise.all([
    getCreators(),
    getCurrentUserRole(),
  ]);

  return (
    <DashboardLayout
      title="Creators"
      description="Manage your creator roster and partnerships"
    >
      <CreatorsPageClient
        creators={creators}
        canWrite={canWriteData(role)}
        showSeedButton={isSeedEnabled()}
      />
    </DashboardLayout>
  );
}
