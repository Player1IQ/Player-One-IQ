import type { TeamRole } from "@/lib/team";
import {
  isCreatorPortalRole,
  isSponsorPortalRole,
  teamRoles,
} from "@/lib/team";

export const ROLE_PREVIEW_COOKIE = "p1iq_role_preview";

export interface RolePreviewState {
  role: TeamRole;
  linkedCreatorId: string | null;
  linkedSponsorId: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getRolePreviewAllowlist(): string[] {
  const fromEnv = process.env.ROLE_PREVIEW_EMAILS;
  const defaults = ["admin@playeroneiq.com"];
  const emails = (fromEnv ?? defaults.join(","))
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);
  return [...new Set(emails)];
}

export function isRolePreviewAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return getRolePreviewAllowlist().includes(normalizeEmail(email));
}

export function parseRolePreviewCookie(
  value: string | undefined
): RolePreviewState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as RolePreviewState;
    if (!parsed?.role || !teamRoles.includes(parsed.role)) return null;
    return {
      role: parsed.role,
      linkedCreatorId: parsed.linkedCreatorId ?? null,
      linkedSponsorId: parsed.linkedSponsorId ?? null,
    };
  } catch {
    return null;
  }
}

export function getRolePreviewRedirectPath(role: TeamRole): string {
  if (isCreatorPortalRole(role) || isSponsorPortalRole(role)) {
    return "/portal";
  }
  return "/dashboard";
}

export const ROLE_PREVIEW_OPTIONS: TeamRole[] = [...teamRoles];
