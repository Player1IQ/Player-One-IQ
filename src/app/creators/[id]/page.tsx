import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorProfile } from "@/components/creators/CreatorProfile";
import { getCreatorById } from "@/lib/creators";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const { id } = await params;
  const creator = getCreatorById(id);

  if (!creator) {
    notFound();
  }

  return (
    <DashboardLayout
      title={creator.name}
      description={creator.displayName}
    >
      <CreatorProfile creator={creator} />
    </DashboardLayout>
  );
}
