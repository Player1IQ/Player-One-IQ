import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicMiddlewarePath } from "@/lib/auth/public-routes";
import { isSupabaseConfigured } from "./config";

/**
 * Lightweight middleware: refresh the Supabase session and gate unauthenticated
 * access. Heavy org/onboarding/portal routing runs in the root layout via
 * enforceAuthenticatedRouteAccess() to avoid Vercel middleware timeouts.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!isSupabaseConfigured()) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

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
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
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

  const isPublicRoute = isPublicMiddlewarePath(pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  supabaseResponse.headers.set("x-pathname", pathname);
  return supabaseResponse;
}
