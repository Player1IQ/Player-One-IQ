"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  COACH_CONTENT_FOCUS_OPTIONS,
  COACH_MONETIZATION_OPTIONS,
  COACH_POSTING_DAYS,
  COACH_PRIMARY_GOALS,
  type CoachPrimaryGoal,
  type CoachProfileInput,
} from "@/lib/creator-coach/profile-types";
import { saveCoachProfileAction } from "@/lib/creator-coach/profile-actions";

interface CoachOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  creatorId: string | null;
  onComplete: () => void;
}

const STEP_KEYS = ["goal", "content", "schedule", "monetization", "challenge"] as const;

export function CoachOnboardingModal({
  open,
  onClose,
  creatorId,
  onComplete,
}: CoachOnboardingModalProps) {
  const t = useTranslations("coach.onboardingModal");
  const [step, setStep] = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState<CoachPrimaryGoal | null>(null);
  const [contentFocus, setContentFocus] = useState<string[]>([]);
  const [targetPostingDays, setTargetPostingDays] = useState<string[]>([]);
  const [monetizationInterests, setMonetizationInterests] = useState<string[]>([]);
  const [biggestChallenge, setBiggestChallenge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function resetForm() {
    setStep(0);
    setPrimaryGoal(null);
    setContentFocus([]);
    setTargetPostingDays([]);
    setMonetizationInterests([]);
    setBiggestChallenge("");
    setError("");
    setLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function toggleValue(list: string[], value: string, setter: (next: string[]) => void) {
    setter(
      list.includes(value)
        ? list.filter((entry) => entry !== value)
        : [...list, value]
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return primaryGoal !== null;
    if (step === 1) return contentFocus.length > 0;
    if (step === 2) return targetPostingDays.length >= 2;
    if (step === 3) return monetizationInterests.length > 0;
    return true;
  }

  async function handleSubmit() {
    if (!primaryGoal) {
      setError(t("chooseGoalError"));
      return;
    }

    setError("");
    setLoading(true);

    const input: CoachProfileInput = {
      primaryGoal,
      contentFocus,
      targetPostingDays,
      monetizationInterests,
      biggestChallenge: biggestChallenge.trim() || undefined,
    };

    const result = await saveCoachProfileAction(creatorId, input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    resetForm();
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-label={t("closeAria")}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-accent/20 bg-surface shadow-glow">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-light" />
            <div>
              <p className="text-sm font-semibold text-white">{t("title")}</p>
              <p className="text-xs text-gray-500">
                {t("stepProgress", {
                  current: step + 1,
                  total: STEP_KEYS.length,
                  label: t(`steps.${STEP_KEYS[step]}`),
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {step === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{t("goalPrompt")}</p>
              <div className="grid gap-2">
                {COACH_PRIMARY_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      primaryGoal === goal.id
                        ? "border-accent/40 bg-accent/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-accent/20"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{goal.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{goal.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{t("contentPrompt")}</p>
              <div className="flex flex-wrap gap-2">
                {COACH_CONTENT_FOCUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleValue(contentFocus, option, setContentFocus)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      contentFocus.includes(option)
                        ? "border-accent/40 bg-accent/15 text-accent-light"
                        : "border-white/10 text-gray-400 hover:border-accent/20"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{t("schedulePrompt")}</p>
              <div className="flex flex-wrap gap-2">
                {COACH_POSTING_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleValue(targetPostingDays, day, setTargetPostingDays)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      targetPostingDays.includes(day)
                        ? "border-accent/40 bg-accent/15 text-accent-light"
                        : "border-white/10 text-gray-400 hover:border-accent/20"
                    )}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{t("monetizationPrompt")}</p>
              <div className="flex flex-wrap gap-2">
                {COACH_MONETIZATION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      toggleValue(monetizationInterests, option, setMonetizationInterests)
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      monetizationInterests.includes(option)
                        ? "border-accent/40 bg-accent/15 text-accent-light"
                        : "border-white/10 text-gray-400 hover:border-accent/20"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{t("challengePrompt")}</p>
              <textarea
                value={biggestChallenge}
                onChange={(event) => setBiggestChallenge(event.target.value)}
                placeholder={t("challengePlaceholder")}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-accent/40 focus:outline-none"
              />
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0 || loading}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          {step < STEP_KEYS.length - 1 ? (
            <Button
              size="sm"
              disabled={!canAdvance() || loading}
              onClick={() => setStep((value) => value + 1)}
            >
              {t("continue")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" disabled={!canAdvance() || loading} onClick={handleSubmit}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("activate")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
