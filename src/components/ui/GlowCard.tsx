import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

const intensityStyles = {
  low: "shadow-glow",
  medium: "shadow-glow border-accent/25",
  high: "shadow-glow-lg border-accent/30",
};

export function GlowCard({
  children,
  className,
  intensity = "medium",
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface-raised/90 backdrop-blur-xl",
        intensityStyles[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}
