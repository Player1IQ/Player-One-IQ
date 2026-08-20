"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyMission } from "@/lib/creator-coach/types";
import { completeCoachMissionTaskAction } from "@/lib/creator-coach/actions";
import { recordCoachMissionTaskXpAction } from "@/lib/creator-seasons/season-coach-actions";
import {
  completeMissionTask,
  getMissionProgress,
} from "@/lib/creator-coach/missions";
import {
  getLocalMissionState,
  setLocalMissionState,
} from "@/lib/creator-coach/client-state";
import type { CoachContext } from "@/lib/creator-coach/types";
import { useMissionText, useCoachGreeting } from "@/lib/i18n/coach-text";

interface TodaysMissionCardProps {
  displayName: string;
  mission: DailyMission;
  progressPercent: number;
  stateId: string | null;
  coachContext: CoachContext;
  onSnapshotUpdate?: () => void;
}

export function TodaysMissionCard({
  displayName,
  mission,
  progressPercent: serverProgressPercent,
  stateId,
  coachContext,
  onSnapshotUpdate,
}: TodaysMissionCardProps) {
  const t = useTranslations("coach.mission");
  const greeting = useCoachGreeting(displayName);
  const missionText = useMissionText(mission, coachContext);

  function applyMissionText(source: DailyMission): DailyMission {
    const translatedTasksById = new Map(
      missionText.tasks.map((task) => [task.id, task.title])
    );
    return {
      ...source,
      title: missionText.title,
      subtitle: missionText.subtitle,
      tasks: source.tasks.map((task) => ({
        ...task,
        title: translatedTasksById.get(task.id) ?? task.title,
      })),
    };
  }

  const [missionState, setMissionState] = useState(() => applyMissionText(mission));
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (stateId) {
      setMissionState(applyMissionText(mission));
      return;
    }

    const localMission = getLocalMissionState(
      coachContext.scope,
      coachContext.scopeId,
      mission.id
    );
    setMissionState(applyMissionText(localMission ?? mission));
  }, [mission, stateId, coachContext.scope, coachContext.scopeId, missionText.title, missionText.subtitle, missionText.tasks]);

  const progressPercent = stateId
    ? serverProgressPercent
    : getMissionProgress(missionState);

  function handleToggleTask(taskId: string) {
    const task = missionState.tasks.find((entry) => entry.id === taskId);
    if (!task || task.completed || isPending) return;

    if (!stateId) {
      const updated = completeMissionTask(missionState, taskId);
      setLocalMissionState(coachContext.scope, coachContext.scopeId, updated);
      setMissionState(updated);
      void recordCoachMissionTaskXpAction(taskId, coachContext, {
        mission: missionState,
      }).then(() => onSnapshotUpdate?.());
      return;
    }

    setPendingTaskId(taskId);
    startTransition(async () => {
      await completeCoachMissionTaskAction(stateId, taskId, coachContext);
      setPendingTaskId(null);
      onSnapshotUpdate?.();
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface-raised to-surface shadow-glow">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative p-6 sm:p-8">
        <p className="text-sm font-medium text-accent-light">
          👋 {greeting}
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("label")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              {missionState.title}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{missionState.subtitle}</p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              {t("progress")}
            </p>
            <p className="text-2xl font-bold text-white">{progressPercent}%</p>
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ul className="mt-6 space-y-3">
          {missionState.tasks.map((task) => {
            const taskPending = isPending && pendingTaskId === task.id;

            return (
              <li key={task.id}>
                <button
                  type="button"
                  disabled={task.completed || isPending}
                  onClick={() => handleToggleTask(task.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                    task.completed
                      ? "border-emerald-500/20 bg-emerald-500/5 text-gray-400"
                      : "border-white/[0.06] bg-white/[0.02] text-gray-200 hover:border-accent/30 hover:bg-white/[0.04] cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      task.completed
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        : "border-white/10 bg-black/20 text-transparent"
                    )}
                  >
                    {taskPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-light" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      task.completed && "line-through"
                    )}
                  >
                    {task.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {!stateId ? (
          <p className="mt-4 text-xs text-gray-500">
            {t("localSaveNote")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
