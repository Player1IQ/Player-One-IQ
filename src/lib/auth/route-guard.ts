import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPublicAppPath } from "@/lib/auth/public-routes";
import { getAuthBootstrap } from "@/lib/auth/route-context";
import { getCurrentUserMembership } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getPortalRedirectPath,
  isPathAllowedForPortalUser,
  PORTAL_HOME,
} from "@/lib/portal/paths";
import { isPathAllowedForStaffUser } from "@/lib/staff/paths";
import { canAccessStaffDashboard } from "@/lib/team";
import {
  ONBOARDING_STARTED_COOKIE,
  resolveOnboardingRequired,
} from "@/lib/onboarding/queries";
import { MARKETING_HOME_PATH, STAFF_DASHBOARD_PATH } from "@/lib/routes";

const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

function isPortalRole(
  role: string | null | undefined
): role is "player" | "content_creator" | "sponsor" {
  return (
    role === "player" || role === "content_creator" || role === "sponsor"
  );
}

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

  const bootstrap = await getAuthBootstrap();
  if (!bootstrap) return;

  const { supabase, user, memberOrgIds, hasOrganization } = bootstrap;

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

  if (
    !hasOrganization &&
    !isOrgSetup &&
    !isInviteRoute &&
    !isOnboarding &&
    !isPublicRoute
  ) {
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

  const membership = await getCurrentUserMembership();
  const role = membership?.role ?? null;

  if (
    hasOrganization &&
    (isOrgSetup || AUTH_ONLY_ROUTES.includes(pathname))
  ) {
    if (onboardingRequired) {
      redirect("/onboarding");
    }

    if (isPortalRole(role)) {
      redirect(PORTAL_HOME);
    }

    redirect(STAFF_DASHBOARD_PATH);
  }

  if (
    membership &&
    !isPublicRoute &&
    !isOrgSetup &&
    !isOnboarding &&
    !isInviteRoute &&
    !isPlatformOAuthRoute
  ) {
    if (isPortalRole(role)) {
      const portalContext = {
        linkedCreatorId: membership.linkedCreatorId,
        linkedSponsorId: membership.linkedSponsorId,
        isWorkspaceFounder: membership.isWorkspaceFounder,
      };
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
    !isOnboarding &&
    membership
  ) {
    if (isPortalRole(role)) {
      redirect(PORTAL_HOME);
    }

    if (role && canAccessStaffDashboard(role)) {
      redirect(STAFF_DASHBOARD_PATH);
    }
  }
}
