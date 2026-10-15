import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteSignUpSubtitle } from "@/components/auth/InviteAuthContext";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignedInSignupNotice } from "@/components/auth/SignedInSignupNotice";
import { getAuthUser } from "@/lib/auth/cached";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const t = await getTranslations("auth.signup");
  const user = await getAuthUser();
  const { account } = await searchParams;

  return (
    <AuthLayout
      title={user ? t("alreadySignedInTitle") : t("title")}
      subtitle={
        user ? (
          t("alreadySignedInSubtitle")
        ) : (
          <Suspense fallback={t("subtitle")}>
            <InviteSignUpSubtitle fallback={t("subtitle")} />
          </Suspense>
        )
      }
    >
      {user ? (
        <SignedInSignupNotice
          email={user.email ?? null}
          requestedAccount={account ?? null}
        />
      ) : (
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          }
        >
          <SignUpForm />
        </Suspense>
      )}
    </AuthLayout>
  );
}
