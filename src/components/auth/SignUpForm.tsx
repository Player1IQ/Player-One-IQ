"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth/errors";
import { getErrorMessage } from "@/lib/safe-action";
import { AuthInput } from "./AuthInput";
import { InviteAuthBanner } from "./InviteAuthContext";
import { SignupAccountTypePicker } from "./SignupAccountTypePicker";
import type { SignupAccountType } from "@/lib/organization";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const inviteEmail = searchParams.get("email");
  const inviteOrg = searchParams.get("org");
  const loginHref = `/login${buildAuthQuery({
    redirect,
    email: inviteEmail,
    org: inviteOrg,
  })}`;
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<SignupAccountType>("creator");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. Add your credentials to .env.local and restart the server."
      );
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
        setNotice(
          "Account created. Check your email for a confirmation link, then return here to sign in and accept your invitation."
        );
        setLoading(false);
        return;
      }

      router.push(nextPath);
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

      {notice && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {inviteEmail && (
        <p className="text-center text-sm text-gray-400">
          Use the invited email:{" "}
          <span className="text-gray-200">{inviteEmail}</span>
        </p>
      )}

      {inviteEmail ? null : (
        <SignupAccountTypePicker
          value={accountType}
          onChange={setAccountType}
        />
      )}

      <AuthInput
        label={accountType === "creator" ? "Email" : "Work email"}
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <AuthInput
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />

      <AuthInput
        label="Confirm password"
        type="password"
        placeholder="••••••••"
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        By signing up, you agree to our{" "}
        <Link
          href="/terms"
          className="text-gray-500 underline hover:text-gray-300"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-gray-500 underline hover:text-gray-300"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-accent-light transition-colors hover:text-white"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
