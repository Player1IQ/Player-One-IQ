const VERIFIED_DOMAIN_CACHE_MS = 60_000;

export interface ParsedFromAddress {
  name: string | null;
  email: string;
  domain: string;
}

export function parseFromAddress(
  raw: string | undefined | null
): ParsedFromAddress | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const angle = trimmed.match(/^(.*?)\s*<([^<>]+)>\s*$/);
  if (angle) {
    return fromEmail(angle[2], angle[1].replace(/^["']|["']$/g, "").trim());
  }

  const emailOnly = trimmed.match(/^([^\s<>]+@[^\s<>]+)$/);
  if (emailOnly) return fromEmail(emailOnly[1], null);

  const loose = trimmed.match(/^(.*?)\s+(\S+@\S+)$/);
  if (loose) return fromEmail(loose[2], loose[1].trim());

  return null;
}

function fromEmail(
  emailRaw: string,
  name: string | null
): ParsedFromAddress | null {
  const email = emailRaw.trim().replace(/^mailto:/i, "");
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).replace(/[>]+$/, "").toLowerCase();
  if (!domain.includes(".")) return null;
  return {
    name: name || null,
    email,
    domain,
  };
}

export function formatFromAddress(parsed: ParsedFromAddress): string {
  if (parsed.name) return `${parsed.name} <${parsed.email}>`;
  return parsed.email;
}

export function isResendTestDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return normalized === "resend.dev" || normalized.endsWith(".resend.dev");
}

export function isProductionDeployment(
  vercelEnv = process.env.VERCEL_ENV
): boolean {
  return vercelEnv === "production";
}

export function domainIsVerified(
  fromDomain: string,
  verifiedDomains: string[]
): boolean {
  const domain = fromDomain.toLowerCase();
  if (isResendTestDomain(domain)) return false;
  return verifiedDomains.some((entry) => {
    const verified = entry.trim().toLowerCase();
    if (!verified) return false;
    return domain === verified || domain.endsWith(`.${verified}`);
  });
}

export type EmailFromStatus =
  | "verified"
  | "resend_test_domain"
  | "unverified_domain"
  | "lookup_failed"
  | "invalid_from";

export type EmailFromEvaluation =
  | { ok: true; from: string; domain: string; verified: true; status: "verified" }
  | {
      ok: false;
      error: string;
      verified: false;
      domain: string | null;
      status: Exclude<EmailFromStatus, "verified">;
    };

export function evaluateEmailFrom(input: {
  fromRaw: string | undefined;
  vercelEnv?: string;
  verifiedDomains: string[] | null;
}): EmailFromEvaluation {
  const parsed = parseFromAddress(input.fromRaw);
  if (!parsed) {
    return {
      ok: false,
      verified: false,
      domain: null,
      status: "invalid_from",
      error:
        "INVITE_EMAIL_FROM is missing or is not a valid From address. Use Name <you@your-verified-domain>.",
    };
  }

  if (isResendTestDomain(parsed.domain)) {
    const production = isProductionDeployment(input.vercelEnv);
    return {
      ok: false,
      verified: false,
      domain: parsed.domain,
      status: "resend_test_domain",
      error: production
        ? "Production refuses Resend's test sender (resend.dev). Set INVITE_EMAIL_FROM to an address on a verified domain."
        : "INVITE_EMAIL_FROM uses Resend's test domain resend.dev, which only delivers to the Resend account owner.",
    };
  }

  if (input.verifiedDomains == null) {
    return {
      ok: false,
      verified: false,
      domain: parsed.domain,
      status: "lookup_failed",
      error: "Could not confirm INVITE_EMAIL_FROM against Resend verified domains.",
    };
  }

  if (!domainIsVerified(parsed.domain, input.verifiedDomains)) {
    return {
      ok: false,
      verified: false,
      domain: parsed.domain,
      status: "unverified_domain",
      error: `INVITE_EMAIL_FROM domain ${parsed.domain} is not verified in Resend. Mail was not sent.`,
    };
  }

  return {
    ok: true,
    verified: true,
    domain: parsed.domain,
    status: "verified",
    from: formatFromAddress(parsed),
  };
}

export function getAdminReplyTo(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const notify = env.FOUNDING_APPLICATION_NOTIFY_EMAIL?.split(",")
    .map((value) => value.trim())
    .find((value) => value.includes("@"));
  if (notify) return notify;
  return parseFromAddress(env.INVITE_EMAIL_FROM)?.email ?? null;
}

let verifiedDomainCache: { at: number; domains: string[] | null } = {
  at: 0,
  domains: null,
};

export function clearVerifiedDomainCache(): void {
  verifiedDomainCache = { at: 0, domains: null };
}

export async function listVerifiedResendDomains(
  apiKey = process.env.RESEND_API_KEY?.trim()
): Promise<string[] | null> {
  if (!apiKey) return null;
  const now = Date.now();
  if (
    now - verifiedDomainCache.at < VERIFIED_DOMAIN_CACHE_MS &&
    verifiedDomainCache.at > 0
  ) {
    return verifiedDomainCache.domains;
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(
        "[email] Resend domains lookup failed:",
        response.status
      );
      verifiedDomainCache = { at: now, domains: null };
      return null;
    }
    const body = (await response.json()) as {
      data?: Array<{ name?: string; status?: string }>;
    };
    const domains = (body.data ?? [])
      .filter((entry) => entry.status === "verified" && entry.name)
      .map((entry) => entry.name as string);
    verifiedDomainCache = { at: now, domains };
    return domains;
  } catch (error) {
    console.error(
      "[email] Resend domains lookup failed:",
      error instanceof Error ? error.message : error
    );
    verifiedDomainCache = { at: now, domains: null };
    return null;
  }
}

export async function resolveTransactionalFrom(): Promise<EmailFromEvaluation> {
  const verifiedDomains = await listVerifiedResendDomains();
  return evaluateEmailFrom({
    fromRaw: process.env.INVITE_EMAIL_FROM,
    vercelEnv: process.env.VERCEL_ENV,
    verifiedDomains,
  });
}

export async function isEmailFromVerified(): Promise<boolean> {
  const resolved = await resolveTransactionalFrom();
  return resolved.ok;
}
