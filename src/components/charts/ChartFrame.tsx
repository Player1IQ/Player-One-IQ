"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartFrameProps {
  children: ReactNode;
  className?: string;
  /** Explicit pixel height — Recharts needs a resolved container height. */
  height?: number;
}

export function ChartFrame({
  children,
  className,
  height = 280,
}: ChartFrameProps) {
  return (
    <div
      className={cn("chart-frame w-full min-w-0", className)}
      style={{ height }}
    >
      {children}
    </div>
  );
}

export const CHART_FRAME_DEFAULT_HEIGHT = 280;
export const CONTENT_TREND_CHART_HEIGHT = 300;
