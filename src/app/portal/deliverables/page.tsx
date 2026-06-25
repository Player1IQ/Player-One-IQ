import { DashboardLayout } from "@/components/DashboardLayout";
import { PortalDeliverablesClient } from "@/components/portal/PortalDeliverablesClient";
import { getPortalDeliverablesForCreator } from "@/lib/contract-deliverables/queries";
import { requireCreatorPortalUser } from "@/lib/portal/guard";

export default async function PortalDeliverablesPage() {
  const { linkedCreatorId } = await requireCreatorPortalUser();
  const deliverables = await getPortalDeliverablesForCreator(linkedCreatorId);

  return (
    <DashboardLayout
      title="Deliverables"
      description="Everything you owe across your sponsorship deals"
    >
      <PortalDeliverablesClient deliverables={deliverables} />
    </DashboardLayout>
  );
}
