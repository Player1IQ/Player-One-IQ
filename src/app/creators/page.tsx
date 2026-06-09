import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorsPageClient } from "@/components/creators/CreatorsPageClient";
import { getCreators } from "@/lib/creators/queries";
import { isSeedEnabled } from "@/lib/seed/constants";

export default async function CreatorsPage() {
  const creators = await getCreators();

  return (
    <DashboardLayout
      title="Creators"
      description="Manage your creator roster and partnerships"
    >
      <CreatorsPageClient
        creators={creators}
        showSeedButton={isSeedEnabled()}
      />
    </DashboardLayout>
  );
}
