"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import {
  getPostBetaChecklistProgress,
  POST_BETA_LAUNCH_CHECKLIST,
  POST_BETA_STORAGE_KEY,
} from "@/lib/launch/post-beta-checklist";

export function PostBetaLaunchChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        POST_BETA_LAUNCH_CHECKLIST.sections.map((section) => [section.id, true])
      )
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POST_BETA_STORAGE_KEY);
      if (raw) {
        setCompleted(JSON.parse(raw) as Record<string, boolean>);
      }
    } catch {
      setCompleted({});
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(POST_BETA_STORAGE_KEY, JSON.stringify(completed));
  }, [completed, hydrated]);

  const completedIds = new Set(
    Object.entries(completed)
      .filter(([, done]) => done)
      .map(([id]) => id)
  );
  const progress = getPostBetaChecklistProgress(completedIds);

  function toggleItem(id: string) {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-6">
      <h2 className="text-base font-semibold text-white">
        {POST_BETA_LAUNCH_CHECKLIST.title}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {POST_BETA_LAUNCH_CHECKLIST.description}
      </p>
      <p className="mt-3 text-xs text-gray-500">
        {progress.completed} of {progress.total} post-beta items complete
        {progress.completed === progress.total && progress.total > 0 ? (
          <span className="ml-2 text-emerald-400">Ready for general availability</span>
        ) : null}
      </p>

      <div className="mt-4 space-y-4">
        {POST_BETA_LAUNCH_CHECKLIST.sections.map((section) => {
          const sectionDone = section.items.filter((item) =>
            completedIds.has(item.id)
          ).length;
          const isOpen = expandedSections[section.id] ?? true;

          return (
            <div
              key={section.id}
              className="rounded-lg border border-white/[0.06] bg-surface/60"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  {section.title}
                </span>
                <span className="text-xs text-gray-500">
                  {sectionDone}/{section.items.length}
                </span>
              </button>

              {isOpen ? (
                <ul className="space-y-1 border-t border-white/[0.06] px-4 py-3">
                  {section.items.map((item) => {
                    const done = Boolean(completed[item.id]);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className="flex w-full items-start gap-2 rounded-md px-1 py-2 text-left hover:bg-white/[0.03]"
                        >
                          {done ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                          )}
                          <span>
                            <span
                              className={`block text-sm ${
                                done ? "text-gray-400 line-through" : "text-gray-300"
                              }`}
                            >
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-600">
                              {item.detail}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
