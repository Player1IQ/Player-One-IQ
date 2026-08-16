import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteSignUpSubtitle } from "@/components/auth/InviteAuthContext";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default async function SignUpPage() {
  const t = await getTranslations("auth.signup");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={
        <Suspense fallback={t("subtitle")}>
          <InviteSignUpSubtitle fallback={t("subtitle")} />
        </Suspense>
      }
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }
      >
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  );
}
