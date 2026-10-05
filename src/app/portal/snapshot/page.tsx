import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreatorSnapshotClient } from "@/components/portal/CreatorSnapshotClient";
import { getCreatorById } from "@/lib/creators/queries";
import { requireCreatorPortalUser } from "@/lib/portal/guard";
import { loadCreatorSnapshot } from "@/lib/portal/snapshot";

export default async function PortalSnapshotPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth_success?: string; oauth_error?: string }>;
}) {
  const t = await getTranslations("pages.portalSnapshot");
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const params = await searchParams;
  const creator = await getCreatorById(linkedCreatorId);

  if (!creator) {
    redirect("/portal");
  }

  const snapshot = await loadCreatorSnapshot(
    linkedCreatorId,
    creator.primaryPlatform ?? null
  );

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <CreatorSnapshotClient
        snapshot={snapshot}
        creatorId={linkedCreatorId}
        oauthSuccess={params.oauth_success ?? null}
        oauthError={params.oauth_error ?? null}
      />
    </DashboardLayout>
  );
}
