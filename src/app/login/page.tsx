import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteAuthSubtitle } from "@/components/auth/InviteAuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <AuthLayout
      title={t("title")}
      subtitle={
        <Suspense fallback={t("subtitle")}>
          <InviteAuthSubtitle fallback={t("subtitle")} />
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
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
