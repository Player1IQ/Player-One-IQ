import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteSignUpSubtitle } from "@/components/auth/InviteAuthContext";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <Suspense fallback="Start managing creators and sponsors in minutes">
          <InviteSignUpSubtitle fallback="Start managing creators and sponsors in minutes" />
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
