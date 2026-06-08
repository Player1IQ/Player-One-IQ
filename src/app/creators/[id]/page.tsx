import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorProfile } from "@/components/creators/CreatorProfile";
import { getCreatorById } from "@/lib/creators/queries";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const creator = await getCreatorById(id);

  if (!creator) {
    notFound();
  }

  const subtitle =
    creator.socialHandles[0]?.handle ?? creator.email ?? undefined;

  return (
    <DashboardLayout title={creator.name} description={subtitle}>
      <CreatorProfile creator={creator} />
    </DashboardLayout>
  );
}
