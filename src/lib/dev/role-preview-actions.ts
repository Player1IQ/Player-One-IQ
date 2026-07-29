"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/cached";
import { getCreators } from "@/lib/creators/queries";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  isCreatorPortalRole,
  isSponsorPortalRole,
  type TeamRole,
} from "@/lib/team";
import {
  getRolePreviewRedirectPath,
  isRolePreviewAllowed,
  ROLE_PREVIEW_COOKIE,
  type RolePreviewState,
} from "./role-preview";

async function requireRolePreviewAccess(): Promise<
  { email: string } | { error: string }
> {
  const user = await getAuthUser();
  if (!user?.email) return { error: "Not authenticated." };
  if (!isRolePreviewAllowed(user.email)) {
    return { error: "Role preview is not enabled for this account." };
  }
  return { email: user.email };
}

async function resolveLinkedIdsForRole(role: TeamRole): Promise<{
  linkedCreatorId: string | null;
  linkedSponsorId: string | null;
}> {
  let linkedCreatorId: string | null = null;
  let linkedSponsorId: string | null = null;

  if (isCreatorPortalRole(role)) {
    const creators = await getCreators();
    const active =
      creators.find((creator) => creator.status === "active") ?? creators[0];
    linkedCreatorId = active?.id ?? null;
  }

  if (isSponsorPortalRole(role)) {
    const sponsors = await getSponsors();
    const active =
      sponsors.find((sponsor) => sponsor.status === "active") ?? sponsors[0];
    linkedSponsorId = active?.id ?? null;
  }

  return { linkedCreatorId, linkedSponsorId };
}

export async function setRolePreviewAction(
  role: TeamRole
): Promise<{ error: string } | never> {
  const access = await requireRolePreviewAccess();
  if ("error" in access) return access;

  const { linkedCreatorId, linkedSponsorId } = await resolveLinkedIdsForRole(role);

  if (isCreatorPortalRole(role) && !linkedCreatorId) {
    return { error: "Add a creator to your roster before previewing creator roles." };
  }

  if (isSponsorPortalRole(role) && !linkedSponsorId) {
    return { error: "Add a sponsor before previewing the sponsor portal." };
  }

  const payload: RolePreviewState = {
    role,
    linkedCreatorId,
    linkedSponsorId,
  };

  const cookieStore = await cookies();
  cookieStore.set(ROLE_PREVIEW_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/", "layout");
  redirect(getRolePreviewRedirectPath(role));
}

export async function clearRolePreviewAction(): Promise<
  { error: string } | never
> {
  const access = await requireRolePreviewAccess();
  if ("error" in access) return access;

  const cookieStore = await cookies();
  cookieStore.delete(ROLE_PREVIEW_COOKIE);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
