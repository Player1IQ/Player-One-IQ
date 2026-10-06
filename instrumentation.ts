export async function register() {
  // Next.js loads this on boot. Timing for individual requests is logged from
  // the root layout and outbound OAuth fetches.
}

export function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
  context: { routerKind?: string; routePath?: string }
) {
  console.error(
    "[request-error]",
    request.method,
    request.path,
    context.routePath ?? "",
    error.digest ?? error.message
  );
}
