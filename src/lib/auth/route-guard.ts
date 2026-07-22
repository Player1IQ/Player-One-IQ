import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPublicAppPath } from "@/lib/auth/public-routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/organization/context";
import {
  getPortalRedirectPath,
  isPathAllowedForPortalUser,
  PORTAL_HOME,
} from "@/lib/portal/paths";
import { isPathAllowedForStaffUser } from "@/lib/staff/paths";
import { canAccessStaffDashboard, type TeamRole } from "@/lib/team";
import {
  ONBOARDING_STARTED_COOKIE,
  resolveOnboardingRequired,
} from "@/lib/onboarding/queries";
import { MARKETING_HOME_PATH, STAFF_DASHBOARD_PATH } from "@/lib/routes";

const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

/**
 * Server-side route guards for authenticated users. Runs in the root layout
 * (not middleware) so Supabase queries are not subject to Vercel's ~25s
 * middleware invocation timeout.
 */
export async function enforceAuthenticatedRouteAccess(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  if (!pathname) return;

  const isPublicRoute = isPublicAppPath(pathname);
  const isOrgSetup = pathname.startsWith("/organization-setup");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isInviteRoute = pathname.startsWith("/invite/");
  const isPlatformOAuthRoute = pathname.startsWith("/api/platform-oauth");

  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const [{ data: organization }, { data: memberships }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const memberOrgIds = new Set(
    (memberships ?? []).map((row) => row.organization_id)
  );
  const hasOrganization = !!organization || memberOrgIds.size > 0;

  const { data: pendingInvite } = await supabase
    .from("team_invitations")
    .select("token, organization_id")
    .eq("status", "pending")
    .ilike("email", user.email ?? "")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const needsToAcceptInvite =
    pendingInvite?.token &&
    !memberOrgIds.has(pendingInvite.organization_id);

  if (needsToAcceptInvite && !isInviteRoute) {
    redirect(`/invite/${pendingInvite.token}`);
  }

  if (!hasOrganization && !isOrgSetup && !isInviteRoute && !isOnboarding) {
    redirect("/organization-setup");
  }

  const cookieStore = await cookies();
  const startedOnboardingCookie =
    cookieStore.get(ONBOARDING_STARTED_COOKIE)?.value === "1";

  const onboardingRequired = await resolveOnboardingRequired(supabase, user, {
    startedCookie: startedOnboardingCookie,
  });

  if (
    hasOrganization &&
    onboardingRequired &&
    !isOnboarding &&
    !isOrgSetup &&
    !isInviteRoute &&
    !isPublicRoute &&
    !isPlatformOAuthRoute
  ) {
    redirect("/onboarding");
  }

  if (
    hasOrganization &&
    (isOrgSetup || AUTH_ONLY_ROUTES.includes(pathname))
  ) {
    if (onboardingRequired) {
      redirect("/onboarding");
    }

    const activeOrgId =
      cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
      organization?.id ??
      memberships?.[0]?.organization_id ??
      null;

    let redirectPath = STAFF_DASHBOARD_PATH;

    if (activeOrgId) {
      const isOwner = Boolean(organization && organization.id === activeOrgId);
      const { data: member } = await supabase
        .from("team_members")
        .select("role, linked_creator_id, linked_sponsor_id")
        .eq("user_id", user.id)
        .eq("organization_id", activeOrgId)
        .eq("status", "active")
        .maybeSingle();

      const memberRole = (member?.role as TeamRole | undefined) ?? null;
      const portalRole =
        memberRole === "player" ||
        memberRole === "content_creator" ||
        memberRole === "sponsor"
          ? memberRole
          : null;
      const role: TeamRole | null =
        portalRole ?? (isOwner ? "owner" : memberRole);

      if (
        role === "player" ||
        role === "content_creator" ||
        role === "sponsor"
      ) {
        redirectPath = PORTAL_HOME;
      }
    }

    redirect(redirectPath);
  }

  const activeOrgId =
    cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
    organization?.id ??
    memberships?.[0]?.organization_id ??
    null;

  if (
    activeOrgId &&
    !isPublicRoute &&
    !isOrgSetup &&
    !isOnboarding &&
    !isInviteRoute &&
    !isPlatformOAuthRoute
  ) {
    const isOwner = Boolean(organization && organization.id === activeOrgId);
    const { data: member } = await supabase
      .from("team_members")
      .select("role, linked_creator_id, linked_sponsor_id")
      .eq("user_id", user.id)
      .eq("organization_id", activeOrgId)
      .eq("status", "active")
      .maybeSingle();

    const memberRole = (member?.role as TeamRole | undefined) ?? null;
    const portalRole =
      memberRole === "player" ||
      memberRole === "content_creator" ||
      memberRole === "sponsor"
        ? memberRole
        : null;
    const role: TeamRole | null =
      portalRole ?? (isOwner ? "owner" : memberRole);
    const linkedCreatorId = member?.linked_creator_id ?? null;
    const linkedSponsorId = member?.linked_sponsor_id ?? null;

    if (
      role === "player" ||
      role === "content_creator" ||
      role === "sponsor"
    ) {
      const portalContext = { linkedCreatorId, linkedSponsorId };
      if (!isPathAllowedForPortalUser(pathname, role, portalContext)) {
        redirect(getPortalRedirectPath(pathname, portalContext));
      }

      if (pathname === STAFF_DASHBOARD_PATH) {
        redirect(PORTAL_HOME);
      }
    } else if (role && canAccessStaffDashboard(role)) {
      if (!isPathAllowedForStaffUser(pathname, role)) {
        redirect(STAFF_DASHBOARD_PATH);
      }
    }
  }

  if (
    pathname === MARKETING_HOME_PATH &&
    hasOrganization &&
    !onboardingRequired &&
    !isInviteRoute &&
    !isOrgSetup &&
    !isOnboarding
  ) {
    const activeOrgId =
      cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
      organization?.id ??
      memberships?.[0]?.organization_id ??
      null;

    if (activeOrgId) {
      const isOwner = Boolean(organization && organization.id === activeOrgId);
      const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", activeOrgId)
        .eq("status", "active")
        .maybeSingle();

      const memberRole = (member?.role as TeamRole | undefined) ?? null;
      const portalRole =
        memberRole === "player" ||
        memberRole === "content_creator" ||
        memberRole === "sponsor"
          ? memberRole
          : null;
      const role: TeamRole | null =
        portalRole ?? (isOwner ? "owner" : memberRole);

      if (
        role === "player" ||
        role === "content_creator" ||
        role === "sponsor"
      ) {
        redirect(PORTAL_HOME);
      }

      if (role && canAccessStaffDashboard(role)) {
        redirect(STAFF_DASHBOARD_PATH);
      }
    }
  }
}
