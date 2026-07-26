"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitFoundingApplication } from "@/app/founding/actions";
import {
  REVENUE_SOURCE_OPTIONS,
  type FoundingApplicantType,
  type RevenueSource,
} from "@/lib/founding/types";
import { trackMarketingEvent } from "@/lib/marketing/analytics";

interface FoundingApplicationFormProps {
  initialApplicantType?: FoundingApplicantType;
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45";

export function FoundingApplicationForm({
  initialApplicantType = "creator",
  onSuccess,
}: FoundingApplicationFormProps) {
  const [applicantType, setApplicantType] =
    useState<FoundingApplicantType>(initialApplicantType);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);

  useEffect(() => {
    setApplicantType(initialApplicantType);
  }, [initialApplicantType]);

  function markStarted() {
    if (!started) {
      setStarted(true);
      trackMarketingEvent("founding_application_started", {
        applicant_type: applicantType,
      });
    }
  }

  function toggleRevenue(source: RevenueSource) {
    markStarted();
    setRevenueSources((current) =>
      current.includes(source)
        ? current.filter((s) => s !== source)
        : [...current, source]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitFoundingApplication({
        applicantType,
        name: String(form.get("name") ?? ""),
        creatorHandle: String(form.get("creatorHandle") ?? ""),
        email: String(form.get("email") ?? ""),
        primaryPlatform: String(form.get("primaryPlatform") ?? ""),
        otherPlatforms: String(form.get("otherPlatforms") ?? ""),
        channelLinks: String(form.get("channelLinks") ?? ""),
        contentType: String(form.get("contentType") ?? ""),
        revenueSources,
        biggestManagementProblem: String(form.get("biggestManagementProblem") ?? ""),
        whyJoin: String(form.get("whyJoin") ?? ""),
        nominatedBy: String(form.get("nominatedBy") ?? ""),
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      trackMarketingEvent("founding_application_submitted", {
        applicant_type: applicantType,
      });
      trackMarketingEvent(
        applicantType === "creator"
          ? "founding_creator_application"
          : "founding_organization_application"
      );
      onSuccess();
    });
  }

  const isCreator = applicantType === "creator";

  return (
    <form
      id="founding-application"
      onSubmit={handleSubmit}
      className="space-y-8"
      noValidate
    >
      <div>
        <p className={labelClass}>I&apos;m applying as a...</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["creator", "organization"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setApplicantType(type);
                markStarted();
              }}
              className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition-all ${
                applicantType === type
                  ? "border-violet-500/50 bg-violet-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20"
              }`}
            >
              {type === "creator" ? "Creator" : "Organization"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            {isCreator ? "Name" : "Your name"}
          </label>
          <input
            id="name"
            name="name"
            required
            className={inputClass}
            onFocus={markStarted}
          />
        </div>
        <div>
          <label htmlFor="creatorHandle" className={labelClass}>
            {isCreator ? "Creator / channel name" : "Organization name"}
          </label>
          <input
            id="creatorHandle"
            name="creatorHandle"
            className={inputClass}
            onFocus={markStarted}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="primaryPlatform" className={labelClass}>
            Primary platform
          </label>
          <input
            id="primaryPlatform"
            name="primaryPlatform"
            placeholder="YouTube, Twitch, TikTok..."
            className={inputClass}
            onFocus={markStarted}
          />
        </div>
        <div>
          <label htmlFor="otherPlatforms" className={labelClass}>
            Other platforms
          </label>
          <input
            id="otherPlatforms"
            name="otherPlatforms"
            className={inputClass}
            onFocus={markStarted}
          />
        </div>
      </div>

      <div>
        <label htmlFor="channelLinks" className={labelClass}>
          Links to your channels / organization
        </label>
        <textarea
          id="channelLinks"
          name="channelLinks"
          rows={3}
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      <div>
        <label htmlFor="contentType" className={labelClass}>
          {isCreator
            ? "What kind of content do you create?"
            : "Tell us about your organization"}
        </label>
        <textarea
          id="contentType"
          name="contentType"
          rows={3}
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      {isCreator ? (
        <div>
          <p className={labelClass}>Are you currently earning revenue from content?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REVENUE_SOURCE_OPTIONS.map((source) => (
              <label
                key={source}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70"
              >
                <input
                  type="checkbox"
                  checked={revenueSources.includes(source)}
                  onChange={() => toggleRevenue(source)}
                  className="rounded border-white/20 bg-transparent text-violet-500 focus:ring-violet-500/30"
                />
                {source}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="biggestManagementProblem" className={labelClass}>
          {isCreator
            ? "What is the most frustrating part of managing your creator business today?"
            : "What is the most frustrating part of managing your creators or roster today?"}
        </label>
        <textarea
          id="biggestManagementProblem"
          name="biggestManagementProblem"
          required
          rows={4}
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      <div>
        <label htmlFor="whyJoin" className={labelClass}>
          Why do you want to be part of the Player One IQ Founding Roster?
        </label>
        <textarea
          id="whyJoin"
          name="whyJoin"
          required
          rows={4}
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      <div>
        <label htmlFor="nominatedBy" className={labelClass}>
          Who invited or nominated you? (optional)
        </label>
        <input
          id="nominatedBy"
          name="nominatedBy"
          className={inputClass}
          onFocus={markStarted}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        onClick={() => trackMarketingEvent("founding_apply_clicked", { applicant_type: applicantType })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:opacity-95 disabled:opacity-60 sm:w-auto"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
        }}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit application"
        )}
      </button>
    </form>
  );
}
