"use client";

import { useTranslations } from "next-intl";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function SignedInSignupNotice({
  email,
  requestedAccount,
}: {
  email: string | null;
  requestedAccount: string | null;
}) {
  const t = useTranslations("auth.signup");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4">
        <h2 className="text-base font-semibold text-white">
          {t("alreadySignedInTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {email
            ? t("alreadySignedInBody", { email })
            : t("alreadySignedInBodyNoEmail")}
        </p>
        {requestedAccount ? (
          <p className="mt-2 text-sm text-gray-500">
            {t("alreadySignedInAccountHint", { account: requestedAccount })}
          </p>
        ) : null}
      </div>
      <SignOutButton
        label={t("signOutToCreateAnother")}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
      />
    </div>
  );
}
