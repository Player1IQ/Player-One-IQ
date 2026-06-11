import { handlePlatformOAuthStart } from "@/lib/platform-oauth/routes";

export async function GET(request: Request) {
  return handlePlatformOAuthStart("Instagram", request);
}
