import { listSponsorsForOrganization } from "@/lib/api/data";
import { handleAuthenticatedApiGet } from "@/lib/api/route-handler";

export async function GET(request: Request) {
  return handleAuthenticatedApiGet(request, listSponsorsForOrganization);
}
