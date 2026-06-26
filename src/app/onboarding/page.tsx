import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import {
  getOnboardingContext,
  ONBOARDING_STARTED_COOKIE,
} from "@/lib/onboarding/queries";
import type { OnboardingStepId } from "@/lib/onboarding/types";
import { getOAuthPlatformUi } from "@/lib/platform-oauth/config";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; oauth_success?: string; oauth_error?: string }>;
}) {
  const cookieStore = await cookies();
  const startedCookie =
    cookieStore.get(ONBOARDING_STARTED_COOKIE)?.value === "1";

  const context = await getOnboardingContext({ startedCookie });

  if (!context) {
    redirect("/login?redirect=/onboarding");
  }

  if (!context.required) {
    redirect(context.flow.finishHref);
  }

  const params = await searchParams;
  const initialStep =
    params.step ??
    (params.oauth_success || params.oauth_error ? "connect" : null);

  return (
    <div className="min-h-screen bg-surface">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }
      >
        <OnboardingWizard
          flow={context.flow}
          userName={context.userName}
          linkedCreatorId={context.linkedCreatorId}
          oauthPlatformUi={getOAuthPlatformUi()}
          initialStep={(initialStep as OnboardingStepId | null) ?? null}
          oauthSuccess={params.oauth_success ?? null}
          oauthError={params.oauth_error ?? null}
        />
      </Suspense>
    </div>
  );
}
