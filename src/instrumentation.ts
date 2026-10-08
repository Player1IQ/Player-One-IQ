export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
  context: { routePath?: string; routeType?: string }
) {
  const digest = error.digest ?? "";
  if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) {
    return;
  }

  const path = context.routePath || request.path || "unknown";
  if (path.startsWith("/_next")) return;

  try {
    const { reportOpsAlert } = await import("@/lib/ops/alerts");
    await reportOpsAlert({
      kind: "server_error",
      title: `Server error: ${request.method} ${path}`,
      detail: [error.message, digest && `digest ${digest}`, context.routeType]
        .filter(Boolean)
        .join("\n"),
    });
  } catch {
    // Monitoring must never break the request.
  }
}
