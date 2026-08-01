"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/cached";
import { getCreators } from "@/lib/creators/queries";
import { getOrganizationId } from "@/lib/organization/queries";
import { PORTAL_HOME } from "@/lib/portal/paths";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { getSponsors } from "@/lib/sponsors/queries";
import {
  canAccessStaffDashboard,
  isCreatorPortalRole,
  isPortalRole,
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

async function resolveRedirectAfterPreviewClear(): Promise<string> {
  const user = await getAuthUser();
  if (!user) return "/login";

  const organizationId = await getOrganizationId();
  if (!organizationId) return STAFF_DASHBOARD_PATH;

  const supabase = await createClient();
  if (!supabase) return STAFF_DASHBOARD_PATH;

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const role = membership?.role as TeamRole | undefined;
  if (role && isPortalRole(role)) {
    return PORTAL_HOME;
  }

  if (role && canAccessStaffDashboard(role)) {
    return STAFF_DASHBOARD_PATH;
  }

  const { data: ownedOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedOrg) {
    return STAFF_DASHBOARD_PATH;
  }

  return PORTAL_HOME;
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
  redirect(await resolveRedirectAfterPreviewClear());
}
