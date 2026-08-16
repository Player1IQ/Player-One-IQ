"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STAFF_DASHBOARD_PATH } from "@/lib/routes";
import { formatAuthError } from "@/lib/auth/errors";
import { getErrorMessage } from "@/lib/safe-action";
import { AuthInput } from "./AuthInput";
import { InviteAuthBanner } from "./InviteAuthContext";

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

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? STAFF_DASHBOARD_PATH;
  const inviteEmail = searchParams.get("email");
  const inviteOrg = searchParams.get("org");
  const signupHref = `/signup${buildAuthQuery({
    redirect: redirect !== STAFF_DASHBOARD_PATH ? redirect : null,
    email: inviteEmail,
    org: inviteOrg,
  })}`;

  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(tErrors("supabaseNotConfigured"));
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(formatAuthError(authError.message));
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(formatAuthError(getErrorMessage(err)));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InviteAuthBanner />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <AuthInput
        label={t("emailLabel")}
        type="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-gray-300">
            {t("passwordLabel")}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-accent-light transition-colors hover:text-white"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("signingIn")}
          </>
        ) : (
          t("signIn")
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        <Link href="/terms" className="underline hover:text-gray-400">
          {t("terms")}
        </Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-gray-400">
          {t("privacy")}
        </Link>
      </p>

      <p className="text-center text-sm text-gray-500">
        {t("noAccount")}{" "}
        <Link
          href={signupHref}
          className="font-medium text-accent-light transition-colors hover:text-white"
        >
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
