"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { OnboardingConnectStep } from "@/components/onboarding/OnboardingConnectStep";
import {
  clearOnboardingStepClient,
  readOnboardingStepClient,
  storeOnboardingStepClient,
} from "@/lib/onboarding/client";
import {
  resolveOnboardingStepId,
  resolveStepIndex,
} from "@/lib/onboarding/step-resolution";
import type { OAuthPlatformUi } from "@/lib/platform-oauth/types";
import type { OnboardingFlow, OnboardingStepId } from "@/lib/onboarding/types";

interface OnboardingWizardProps {
  flow: OnboardingFlow;
  userName: string | null;
  linkedCreatorId: string | null;
  oauthPlatformUi: OAuthPlatformUi[];
  initialStep?: OnboardingStepId | null;
  oauthSuccess?: string | null;
  oauthError?: string | null;
}

function stepLabel(step: OnboardingStepId): string {
  switch (step) {
    case "welcome":
      return "Welcome";
    case "connect":
      return "Connect platforms";
    case "finish":
      return "Ready to go";
  }
}

export function OnboardingWizard({
  flow,
  userName,
  linkedCreatorId,
  oauthPlatformUi,
  initialStep,
  oauthSuccess,
  oauthError,
}: OnboardingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storedStep, setStoredStep] = useState<OnboardingStepId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepFromUrl = searchParams.get("step");
  const oauthSuccessParam = searchParams.get("oauth_success") ?? oauthSuccess;
  const oauthErrorParam = searchParams.get("oauth_error") ?? oauthError;

  useEffect(() => {
    const stored = readOnboardingStepClient();
    if (stored) {
      setStoredStep(stored);
    }
  }, []);

  const currentStep = useMemo(() => {
    return resolveOnboardingStepId(flow, {
      stepFromUrl,
      oauthSuccess: oauthSuccessParam,
      oauthError: oauthErrorParam,
      storedStep,
      serverInitialStep: initialStep,
    });
  }, [
    flow,
    initialStep,
    oauthErrorParam,
    oauthSuccessParam,
    stepFromUrl,
    storedStep,
  ]);

  const stepIndex = resolveStepIndex(flow, currentStep);

  useEffect(() => {
    storeOnboardingStepClient(currentStep);
  }, [currentStep]);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === flow.steps.length - 1;

  const welcomeCopy = useMemo(() => {
    if (flow.audience === "creator") {
      return {
        title: userName ? `Welcome, ${userName}` : "Welcome to your creator portal",
        body: "Player One IQ helps you grow your brand, connect platforms, discover sponsorship opportunities, and manage deals in one place. This quick setup takes about two minutes.",
      };
    }
    if (flow.audience === "sponsor") {
      return {
        title: userName ? `Welcome, ${userName}` : "Welcome to your sponsor workspace",
        body: "Run campaigns, review creators, manage contracts, and coordinate partnerships from a single portal built for brand teams.",
      };
    }
    return {
      title: userName ? `Welcome, ${userName}` : "Welcome to Player One IQ",
      body: "Manage creators, sponsors, contracts, opportunities, and team workflows from one premium workspace. Let's walk through the essentials.",
    };
  }, [flow.audience, userName]);

  async function handleFinish() {
    setError("");
    setLoading(true);

    const result = await completeOnboarding();
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    clearOnboardingStepClient();

    router.push(result.redirectTo ?? `${flow.finishHref}?tour=1`);
    router.refresh();
  }

  function navigateToStep(index: number) {
    const step = flow.steps[index];
    setStoredStep(step);
    storeOnboardingStepClient(step);

    const params = new URLSearchParams(searchParams.toString());
    params.set("step", step);
    if (index === 0) {
      params.delete("oauth_success");
      params.delete("oauth_error");
    }

    const query = params.toString();
    router.replace(`/onboarding?${query}`, { scroll: false });
  }

  function goNext() {
    if (isLastStep) {
      void handleFinish();
      return;
    }
    navigateToStep(Math.min(stepIndex + 1, flow.steps.length - 1));
  }

  function goBack() {
    navigateToStep(Math.max(stepIndex - 1, 0));
  }

  function startOver() {
    clearOnboardingStepClient();
    setStoredStep("welcome");
    storeOnboardingStepClient("welcome");
    router.replace("/onboarding?step=welcome", { scroll: false });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-muted">
          <span className="text-sm font-black text-white">P1</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Player One IQ setup</p>
          <p className="text-xs text-gray-500">
            Step {stepIndex + 1} of {flow.steps.length} · {stepLabel(currentStep)}
          </p>
        </div>
      </div>

      <div className="mb-8 flex gap-2">
        {flow.steps.map((step, index) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              index <= stepIndex ? "bg-accent" : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>

      {error ? (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {oauthSuccessParam ? (
        <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {oauthSuccessParam} connected successfully.
        </div>
      ) : null}

      {oauthErrorParam ? (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {oauthErrorParam}
        </div>
      ) : null}

      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-surface-raised/60 p-6 sm:p-8">
        {currentStep === "welcome" ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {welcomeCopy.title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
              {welcomeCopy.body}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              {flow.audience === "creator" ? (
                <>
                  <li>• Connect your social platforms for growth analytics</li>
                  <li>• Browse and apply to sponsorship opportunities</li>
                  <li>• Track deliverables, contracts, and earnings</li>
                </>
              ) : flow.audience === "sponsor" ? (
                <>
                  <li>• Launch and manage sponsorship campaigns</li>
                  <li>• Review contracts and creator deliverables</li>
                  <li>• Message partners without leaving the portal</li>
                </>
              ) : (
                <>
                  <li>• Organize creators and sponsors in one roster</li>
                  <li>• Post opportunities and manage deal flow</li>
                  <li>• Invite your team with role-based access</li>
                </>
              )}
            </ul>
          </div>
        ) : null}

        {currentStep === "connect" ? (
          linkedCreatorId ? (
            <OnboardingConnectStep
              creatorId={linkedCreatorId}
              oauthPlatformUi={oauthPlatformUi}
            />
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Connect your platforms</h2>
              <p className="text-sm text-gray-400">
                Your creator profile is still linking. You can connect platforms
                from your portal profile right after setup.
              </p>
            </div>
          )
        ) : null}

        {currentStep === "finish" ? (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold text-white">You&apos;re all set</h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-400">
              Your workspace is ready. When you enter your{" "}
              {flow.audience === "creator"
                ? "creator portal"
                : flow.audience === "sponsor"
                  ? "sponsor portal"
                  : "dashboard"}
              , we&apos;ll walk you through each area with a quick guided tour —
              highlighting where to find opportunities, messages, contracts, and more.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          {!isFirstStep ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.04]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}
          {currentStep === "connect" ? (
            <button
              type="button"
              onClick={goNext}
              className="text-sm text-gray-500 transition-colors hover:text-gray-300"
            >
              Skip for now
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finishing...
            </>
          ) : isLastStep ? (
            flow.finishLabel
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-600">
        Need help later? Visit{" "}
        <Link href="/portal/account" className="text-gray-500 underline hover:text-gray-300">
          Account
        </Link>{" "}
        from your sidebar, or{" "}
        <button
          type="button"
          onClick={startOver}
          className="text-gray-500 underline hover:text-gray-300"
        >
          start the guide over
        </button>
        .
      </p>
    </div>
  );
}
