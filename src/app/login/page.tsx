import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteAuthSubtitle } from "@/components/auth/InviteAuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <Suspense fallback="Sign in to your Player One IQ workspace">
          <InviteAuthSubtitle fallback="Sign in to your Player One IQ workspace" />
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
