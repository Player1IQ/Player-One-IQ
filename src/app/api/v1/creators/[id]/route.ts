import { getCreatorForOrganization } from "@/lib/api/data";
import { handleAuthenticatedApiGetById } from "@/lib/api/route-handler";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAuthenticatedApiGetById(
    request,
    (organizationId) => getCreatorForOrganization(organizationId, id),
    "Creator not found."
  );
}
