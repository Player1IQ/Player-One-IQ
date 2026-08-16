"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthInput } from "./AuthInput";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tErrors = useTranslations("auth.errors");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/login`,
      }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
          <Mail className="h-6 w-6 text-accent-light" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{t("checkEmailTitle")}</h3>
        <p className="mt-2 text-sm text-gray-400">
          {t("checkEmailBody")}{" "}
          <span className="text-gray-200">{email}</span>
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent-light transition-colors hover:text-white"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("sending")}
          </>
        ) : (
          t("sendResetLink")
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        {t("rememberPassword")}{" "}
        <Link
          href="/login"
          className="font-medium text-accent-light transition-colors hover:text-white"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
