import { handleAuthenticatedApiPatch } from "@/lib/api/route-handler";
import { patchContractForOrganization } from "@/lib/api/writes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAuthenticatedApiPatch(
    request,
    (organizationId, body) =>
      patchContractForOrganization(organizationId, id, body),
    "Contract not found."
  );
}
