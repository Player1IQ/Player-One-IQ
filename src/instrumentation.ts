import { resolveOpsAlertIngestUrl } from "@/lib/ops/alerts-config";

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

  const ingestUrl = resolveOpsAlertIngestUrl();
  const cronSecret = process.env.CRON_SECRET;
  if (!ingestUrl || !cronSecret) return;

  try {
    await fetch(ingestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "server_error",
        title: `Server error: ${request.method} ${path}`,
        detail: [error.message, digest && `digest ${digest}`, context.routeType]
          .filter(Boolean)
          .join("\n"),
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Monitoring must never break the request.
  }
}
