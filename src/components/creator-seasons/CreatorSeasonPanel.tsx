"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { CreatorSeasonView } from "@/lib/creator-seasons/types";
import { joinCreatorSeasonAction } from "@/lib/creator-seasons/actions";

interface CreatorSeasonCardProps {
  seasonView: CreatorSeasonView;
  creatorId: string;
}

export function CreatorSeasonCard({
  seasonView,
  creatorId,
}: CreatorSeasonCardProps) {
  const [isPending, startTransition] = useTransition();
  const { season, optedIn, currentTier, nextTier, progressToNextPercent, totalXp, daysRemaining } =
    seasonView;

  function handleJoin() {
    startTransition(async () => {
      await joinCreatorSeasonAction(creatorId);
      window.location.reload();
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-surface-raised to-surface">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
            <Trophy className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
              Creator Season
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-white">{season.name}</h3>
            <p className="mt-1 text-sm text-gray-400">
              {optedIn
                ? `Tier ${currentTier.tier} · ${currentTier.title} · ${daysRemaining} days left`
                : "Complete Coach missions to earn XP and unlock tier rewards."}
            </p>
          </div>
        </div>

        {optedIn ? (
          <div className="w-full sm:w-72">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{totalXp.toLocaleString()} XP</span>
              {nextTier ? (
                <span>{seasonView.xpToNextTier} XP to Tier {nextTier.tier}</span>
              ) : (
                <span>Max tier reached</span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${progressToNextPercent}%` }}
              />
            </div>
            <Link
              href="/portal/seasons"
              className="mt-3 inline-flex text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              View tier rewards →
            </Link>
          </div>
        ) : (
          <Button onClick={handleJoin} disabled={isPending} className="shrink-0">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Join Season 1
          </Button>
        )}
      </div>
    </div>
  );
}

interface CreatorSeasonPanelProps {
  seasonView: CreatorSeasonView;
  creatorId: string;
}

export function CreatorSeasonPanel({
  seasonView,
  creatorId,
}: CreatorSeasonPanelProps) {
  const [isPending, startTransition] = useTransition();
  const { season, optedIn, tiers, totalXp, daysRemaining, recentXpTotal } =
    seasonView;

  function handleJoin() {
    startTransition(async () => {
      await joinCreatorSeasonAction(creatorId);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-surface-raised to-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
              Creator Season
            </p>
            <h1 className="mt-1 text-3xl font-bold text-white">{season.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              {season.description}
            </p>
            <p className="mt-3 text-sm text-gray-500">
              {daysRemaining} days remaining · {totalXp.toLocaleString()} XP earned
              {optedIn ? ` · ${recentXpTotal} XP this week` : ""}
            </p>
          </div>
          {!optedIn ? (
            <Button onClick={handleJoin} disabled={isPending} size="lg">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
              Join the season
            </Button>
          ) : null}
        </div>

        {optedIn ? (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white">
                Tier {seasonView.currentTier.tier}: {seasonView.currentTier.title}
              </span>
              {seasonView.nextTier ? (
                <span className="text-gray-500">
                  {seasonView.xpToNextTier} XP to {seasonView.nextTier.title}
                </span>
              ) : (
                <span className="text-amber-300">Season max tier unlocked</span>
              )}
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${seasonView.progressToNextPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 p-6">
        <h2 className="text-lg font-semibold text-white">How to earn XP</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Complete a mission task", xp: 25 },
            { label: "Finish today’s full mission", xp: 50 },
            { label: "Mark a Coach recommendation done", xp: 30 },
            { label: "Personalize your Creator Coach", xp: 100 },
          ].map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm"
            >
              <span className="text-gray-300">{item.label}</span>
              <span className="font-semibold text-amber-300">+{item.xp} XP</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-surface-raised/50 p-6">
        <h2 className="text-lg font-semibold text-white">Tier rewards</h2>
        <p className="mt-1 text-sm text-gray-500">
          Unlock perks as you hit XP milestones this season.
        </p>
        <ul className="mt-6 space-y-3">
          {tiers.map((tier) => (
            <li
              key={tier.tier}
              className={cn(
                "flex flex-col gap-2 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                tier.unlocked
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-white/[0.06] bg-white/[0.02] opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    tier.unlocked
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/5 text-gray-500"
                  )}
                >
                  {tier.tier}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {tier.title}
                    {tier.isCurrent ? (
                      <span className="ml-2 text-xs font-medium text-amber-300">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">{tier.reward}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500 sm:text-right">
                {tier.xpRequired.toLocaleString()} XP
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
