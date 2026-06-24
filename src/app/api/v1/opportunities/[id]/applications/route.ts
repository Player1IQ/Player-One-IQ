import { handleAuthenticatedApiPost } from "@/lib/api/route-handler";
import { createOpportunityApplicationForOrganization } from "@/lib/api/writes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAuthenticatedApiPost(
    request,
    (organizationId, body) =>
      createOpportunityApplicationForOrganization(organizationId, id, body),
    "Opportunity not found."
  );
}
