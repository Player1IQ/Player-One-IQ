"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { getErrorMessage } from "@/lib/safe-action";
import { AuthInput } from "./AuthInput";
import { InviteAuthBanner } from "./InviteAuthContext";
import { SignupAccountTypePicker } from "./SignupAccountTypePicker";
import {
  isPublicSignupAccountType,
  type SignupAccountType,
} from "@/lib/organization";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import { SPONSOR_PRO_EARLY_ACCESS_HREF } from "@/lib/marketing/config";

function buildAuthQuery(params: {
  redirect?: string | null;
  email?: string | null;
  org?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.redirect) query.set("redirect", params.redirect);
  if (params.email) query.set("email", params.email);
  if (params.org) query.set("org", params.org);
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function SignUpForm() {
  const t = useTranslations("auth.signup");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const inviteEmail = searchParams.get("email");
  const inviteOrg = searchParams.get("org");
  const accountParam = searchParams.get("account");
  const inviteRedirect = Boolean(redirect?.startsWith("/invite/"));
  const showSponsorEarlyAccess =
    accountParam === "sponsor" && !inviteEmail && !inviteRedirect;
  const lockedAccountType: SignupAccountType | null =
    isPublicSignupAccountType(accountParam) ? accountParam : null;
  const [accountType, setAccountType] = useState<SignupAccountType>(
    lockedAccountType ?? "creator"
  );
  const loginHref = `/login${buildAuthQuery({
    redirect,
    email: inviteEmail,
    org: inviteOrg,
  })}`;
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError(tErrors("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(tErrors("passwordTooShort"));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(tErrors("supabaseNotConfigured"));
      setLoading(false);
      return;
    }

    const nextPath =
      redirect ??
      `/organization-setup?account=${inviteEmail ? "agency" : accountType}`;

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (authError) {
        setError(formatAuthError(authError.message));
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        trackMarketingEvent("signup");
        setNotice(tErrors("accountCreatedCheckEmail"));
        setLoading(false);
        return;
      }

      trackMarketingEvent("signup");
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(formatAuthError(getErrorMessage(err)));
      setLoading(false);
    }
  }

  if (showSponsorEarlyAccess) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4">
          <h2 className="text-base font-semibold text-white">
            {t("sponsorEarlyAccessTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            {t("sponsorEarlyAccessBody")}
          </p>
        </div>
        <a
          href={SPONSOR_PRO_EARLY_ACCESS_HREF}
          className="flex w-full items-center justify-center rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          {t("sponsorEarlyAccessCta")}
        </a>
        <p className="text-center text-sm text-gray-500">
          {t("hasAccount")}{" "}
          <Link
            href={loginHref}
            className="font-medium text-accent-light transition-colors hover:text-white"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InviteAuthBanner />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {inviteEmail && (
        <p className="text-center text-sm text-gray-400">
          {t("useInvitedEmail")}{" "}
          <span className="text-gray-200">{inviteEmail}</span>
        </p>
      )}

      {inviteEmail || lockedAccountType ? null : (
        <SignupAccountTypePicker
          value={accountType}
          onChange={setAccountType}
        />
      )}

      <AuthInput
        label={accountType === "creator" ? t("emailLabel") : t("workEmailLabel")}
        type="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <AuthInput
        label={t("passwordLabel")}
        type="password"
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <AuthInput
        label={t("confirmPasswordLabel")}
        type="password"
        placeholder={t("confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("creatingAccount")}
          </>
        ) : (
          t("createAccount")
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        {t("termsPrefix")}{" "}
        <Link
          href="/terms"
          className="text-gray-500 underline hover:text-gray-300"
        >
          {t("termsOfService")}
        </Link>{" "}
        {t("and")}{" "}
        <Link
          href="/privacy"
          className="text-gray-500 underline hover:text-gray-300"
        >
          {t("privacyPolicy")}
        </Link>
        .
      </p>

      <p className="text-center text-sm text-gray-500">
        {t("hasAccount")}{" "}
        <Link
          href={loginHref}
          className="font-medium text-accent-light transition-colors hover:text-white"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
