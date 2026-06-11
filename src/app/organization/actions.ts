"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ACTIVE_ORGANIZATION_COOKIE,
} from "@/lib/organization/context";
import { getUserOrganizations } from "@/lib/organization/queries";

export async function switchOrganization(organizationId: string) {
  const organizations = await getUserOrganizations();
  const allowed = organizations.some((org) => org.id === organizationId);

  if (!allowed) {
    return { error: "You do not have access to this workspace." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");

  return { success: true };
}
