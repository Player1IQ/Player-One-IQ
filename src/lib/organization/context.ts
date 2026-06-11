import { cookies } from "next/headers";

export const ACTIVE_ORGANIZATION_COOKIE = "poiq_active_org";

export async function getActiveOrganizationIdCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}
