import { getTranslations } from "next-intl/server";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalDeliverablesClient } from "@/components/portal/PortalDeliverablesClient";
import { getPortalDeliverablesForCreator } from "@/lib/contract-deliverables/queries";
import { requireCreatorPortalUser } from "@/lib/portal/guard";

export default async function PortalDeliverablesPage() {
  const t = await getTranslations("pages.portalDeliverables");
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const deliverables = await getPortalDeliverablesForCreator(linkedCreatorId);

  return (
    <DashboardLayout title={t("title")} description={t("description")}>
      <PortalDeliverablesClient deliverables={deliverables} />
    </DashboardLayout>
  );
}
