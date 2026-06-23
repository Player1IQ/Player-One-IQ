import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";
import {
  getPortalRedirectPath,
  isPathAllowedForPortalUser,
  PORTAL_HOME,
} from "@/lib/portal/paths";
import type { TeamRole } from "@/lib/team";

export const ACTIVE_ORGANIZATION_COOKIE = "poiq_active_org";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/welcome",
  "/invite",
  "/api/billing/webhook",
  "/api/health",
];

const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isOrgSetup = pathname.startsWith("/organization-setup");
  const isInviteRoute = pathname.startsWith("/invite/");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
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
      const url = request.nextUrl.clone();
      url.pathname = `/invite/${pendingInvite.token}`;
      return NextResponse.redirect(url);
    }

    if (!hasOrganization && !isOrgSetup && !isInviteRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/organization-setup";
      return NextResponse.redirect(url);
    }

    if (
      hasOrganization &&
      (isOrgSetup || AUTH_ONLY_ROUTES.includes(pathname))
    ) {
      const url = request.nextUrl.clone();
      const activeOrgId =
        request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
        organization?.id ??
        memberships?.[0]?.organization_id ??
        null;

      let redirectPath = "/";

      if (activeOrgId) {
        const isOwner = Boolean(organization && organization.id === activeOrgId);
        let role: TeamRole | null = isOwner ? "owner" : null;

        if (!role) {
          const { data: member } = await supabase
            .from("team_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("organization_id", activeOrgId)
            .eq("status", "active")
            .maybeSingle();

          role = (member?.role as TeamRole | undefined) ?? null;
        }

        if (role === "player" || role === "content_creator" || role === "sponsor") {
          redirectPath = PORTAL_HOME;
        }
      }

      url.pathname = redirectPath;
      return NextResponse.redirect(url);
    }

    const activeOrgId =
      request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value ??
      organization?.id ??
      memberships?.[0]?.organization_id ??
      null;

    if (activeOrgId && !isPublicRoute && !isOrgSetup && !isInviteRoute) {
      const isOwner = Boolean(organization && organization.id === activeOrgId);
      let role: TeamRole | null = isOwner ? "owner" : null;
      let linkedCreatorId: string | null = null;
      let linkedSponsorId: string | null = null;

      if (!role) {
        const { data: member } = await supabase
          .from("team_members")
          .select("role, linked_creator_id, linked_sponsor_id")
          .eq("user_id", user.id)
          .eq("organization_id", activeOrgId)
          .eq("status", "active")
          .maybeSingle();

        role = (member?.role as TeamRole | undefined) ?? null;
        linkedCreatorId = member?.linked_creator_id ?? null;
        linkedSponsorId = member?.linked_sponsor_id ?? null;
      }

      if (role === "player" || role === "content_creator" || role === "sponsor") {
        const portalContext = { linkedCreatorId, linkedSponsorId };
        if (!isPathAllowedForPortalUser(pathname, role, portalContext)) {
          const url = request.nextUrl.clone();
          url.pathname = getPortalRedirectPath(pathname, portalContext);
          return NextResponse.redirect(url);
        }

        if (pathname === "/") {
          const url = request.nextUrl.clone();
          url.pathname = PORTAL_HOME;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  supabaseResponse.headers.set("x-pathname", pathname);
  return supabaseResponse;
}
