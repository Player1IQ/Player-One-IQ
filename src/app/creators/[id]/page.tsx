import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorProfile } from "@/components/creators/CreatorProfile";
import { getCreatorById } from "@/lib/creators/queries";
import { getContracts } from "@/lib/contracts/queries";
import {
  getCreatorPlatformAccounts,
  getCreatorRevenueEntries,
} from "@/lib/creator-revenue/queries";
import { canWriteData, getCurrentUserRole } from "@/lib/permissions";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const [creator, role, contracts, platformAccounts, revenueEntries] =
    await Promise.all([
      getCreatorById(id),
      getCurrentUserRole(),
      getContracts(),
      getCreatorPlatformAccounts(id),
      getCreatorRevenueEntries(id),
    ]);

  if (!creator) {
    notFound();
  }

  const subtitle =
    creator.socialHandles[0]?.handle ?? creator.email ?? undefined;

  return (
    <DashboardLayout title={creator.name} description={subtitle}>
      <CreatorProfile
        creator={creator}
        contracts={contracts.filter((c) => c.creatorId === id)}
        platformAccounts={platformAccounts}
        revenueEntries={revenueEntries}
        canWrite={canWriteData(role)}
      />
    </DashboardLayout>
  );
}
