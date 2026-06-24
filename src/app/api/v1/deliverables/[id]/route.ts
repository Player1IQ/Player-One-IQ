import { handleAuthenticatedApiPatch } from "@/lib/api/route-handler";
import { patchDeliverableForOrganization } from "@/lib/api/writes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAuthenticatedApiPatch(
    request,
    (organizationId, body) =>
      patchDeliverableForOrganization(organizationId, id, body),
    "Deliverable not found."
  );
}
