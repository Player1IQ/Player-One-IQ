/**
 * Allow only same-origin relative paths for post-auth redirects.
 */
export function sanitizeInternalRedirectPath(
  path: string | null | undefined,
  fallback: string
): string {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("://")) return fallback;
  return path;
}
