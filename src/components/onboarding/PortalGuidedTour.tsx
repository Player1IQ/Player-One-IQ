"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { completePortalTour } from "@/app/onboarding/actions";
import type { PortalTourStep } from "@/lib/onboarding/types";

interface PortalGuidedTourProps {
  steps: PortalTourStep[];
  enabled: boolean;
  onRequestOpenNav?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 220;

function findNavTarget(navHref: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour-nav="${navHref}"]`);
}

function findTourTarget(step: PortalTourStep): HTMLElement | null {
  const preferNav = step.highlight !== "content";

  if (preferNav && step.navHref) {
    const nav = findNavTarget(step.navHref);
    if (nav) return nav;
  }

  if (step.contentSpot) {
    const content = document.querySelector<HTMLElement>(
      `[data-tour-spot="${step.contentSpot}"]`
    );
    if (content) return content;
  }

  if (step.navHref) {
    const nav = findNavTarget(step.navHref);
    if (nav) return nav;
  }

  return document.querySelector<HTMLElement>("[data-tour-sidebar]");
}

function scrollTargetIntoView(target: HTMLElement) {
  if (target.hasAttribute("data-tour-sidebar")) return;

  const nav = target.closest("[data-tour-sidebar]");
  if (nav instanceof HTMLElement) {
    const navRect = nav.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const isVisible =
      targetRect.top >= navRect.top && targetRect.bottom <= navRect.bottom;

    if (!isVisible) {
      target.scrollIntoView({ block: "center", inline: "nearest" });
      return;
    }
  }

  target.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function measureTarget(
  element: HTMLElement | null,
  placement: PortalTourStep["placement"]
): Rect {
  if (!element) {
    const sidebar = document.querySelector<HTMLElement>("[data-tour-sidebar]");
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      return {
        top: rect.top + 24,
        left: rect.left,
        width: rect.width,
        height: 44,
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      top: vh * 0.3,
      left: vw * 0.5 - POPOVER_WIDTH / 2,
      width: POPOVER_WIDTH,
      height: 80,
    };
  }

  if (placement === "center") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      top: vh * 0.3,
      left: vw * 0.5 - POPOVER_WIDTH / 2,
      width: POPOVER_WIDTH,
      height: 80,
    };
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function popoverPosition(
  rect: Rect,
  placement: PortalTourStep["placement"]
): { top: number; left: number } {
  const margin = 12;

  if (placement === "center") {
    return clampPopover({
      top: rect.top + rect.height + margin,
      left: rect.left,
    });
  }

  if (placement === "bottom") {
    return clampPopover({
      top: rect.top + rect.height + margin,
      left: rect.left,
    });
  }

  const rightSide = {
    top: rect.top,
    left: rect.left + rect.width + margin,
  };

  if (rightSide.left + POPOVER_WIDTH > window.innerWidth - margin) {
    return clampPopover({
      top: rect.top,
      left: rect.left - POPOVER_WIDTH - margin,
    });
  }

  return clampPopover(rightSide);
}

function clampPopover(pos: { top: number; left: number }) {
  return {
    top: Math.max(
      16,
      Math.min(pos.top, window.innerHeight - POPOVER_HEIGHT - 16)
    ),
    left: Math.max(
      16,
      Math.min(pos.left, window.innerWidth - POPOVER_WIDTH - 16)
    ),
  };
}

function filterVisibleSteps(steps: PortalTourStep[]): PortalTourStep[] {
  return steps.filter((step) => {
    if (!step.navHref) return true;
    return Boolean(findNavTarget(step.navHref));
  });
}

export function PortalGuidedTour({
  steps,
  enabled,
  onRequestOpenNav,
}: PortalGuidedTourProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourFromUrl = searchParams.get("tour") === "1";
  const shouldRun = enabled;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<PortalTourStep[]>(steps);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [finishing, setFinishing] = useState(false);

  const step = visibleSteps[stepIndex];
  const isLastStep = stepIndex >= visibleSteps.length - 1;

  useEffect(() => {
    setVisibleSteps(steps);
  }, [steps]);

  useEffect(() => {
    if (enabled || !tourFromUrl) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("tour");
    const query = params.toString();
    router.replace(
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
      { scroll: false }
    );
  }, [enabled, router, searchParams, tourFromUrl]);

  const updatePositions = useCallback(() => {
    if (!step) return;
    const target = findTourTarget(step);
    const placement = step.placement ?? "right";
    const rect = measureTarget(target, placement);
    setTargetRect(rect);
    setPopoverPos(popoverPosition(rect, placement));
  }, [step]);

  useEffect(() => {
    if (!shouldRun || steps.length === 0) return;

    const timer = window.setTimeout(() => {
      const filtered = filterVisibleSteps(steps);
      setVisibleSteps(filtered.length > 0 ? filtered : steps);
      setStepIndex(0);
      setActive(true);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [shouldRun, steps]);

  useEffect(() => {
    if (!active || !step?.navHref) return;
    if (window.innerWidth < 1024) {
      onRequestOpenNav?.();
    }
  }, [active, onRequestOpenNav, step?.navHref, stepIndex]);

  useLayoutEffect(() => {
    if (!active || !step) return;

    const frame = window.requestAnimationFrame(() => {
      const target = findTourTarget(step);
      if (target) {
        scrollTargetIntoView(target);
      }
      window.requestAnimationFrame(updatePositions);
    });

    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions, true);
    };
  }, [active, step, stepIndex, updatePositions]);

  async function finishTour() {
    if (finishing) return;
    setFinishing(true);
    setActive(false);

    await completePortalTour();

    if (searchParams.get("tour") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tour");
      const query = params.toString();
      router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname, {
        scroll: false,
      });
    }

    router.refresh();
    setFinishing(false);
  }

  const stepLabel = useMemo(() => {
    if (visibleSteps.length === 0) return "";
    return `Step ${stepIndex + 1} of ${visibleSteps.length}`;
  }, [stepIndex, visibleSteps.length]);

  if (!active || !step || visibleSteps.length === 0) {
    return null;
  }

  const placement = step.placement ?? "right";
  const showSpotlight = placement !== "center" && targetRect;

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Portal tour">
      {showSpotlight && targetRect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent/80 ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
      )}

      <div
        className="absolute z-[201] w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-white/[0.1] bg-surface-raised p-5 shadow-2xl shadow-black/40 transition-all duration-300"
        style={{ top: popoverPos.top, left: popoverPos.left }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-light">
              {stepLabel}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => void finishTour()}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-300"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-gray-400">{step.description}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void finishTour()}
            className="text-xs text-gray-500 transition-colors hover:text-gray-300"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.04]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  void finishTour();
                  return;
                }
                setStepIndex((index) => Math.min(index + 1, visibleSteps.length - 1));
              }}
              disabled={finishing}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {isLastStep ? "Done" : "Next"}
              {!isLastStep ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
