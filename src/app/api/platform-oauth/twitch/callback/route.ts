import { handlePlatformOAuthCallback } from "@/lib/platform-oauth/routes";

export async function GET(request: Request) {
  return handlePlatformOAuthCallback("Twitch", request);
}
