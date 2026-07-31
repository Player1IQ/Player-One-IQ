"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartFrameProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

export function ChartFrame({
  children,
  className,
  minHeight = 256,
}: ChartFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      setReady(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("w-full min-w-0", className)}
      style={{ minHeight }}
    >
      {ready ? children : null}
    </div>
  );
}
