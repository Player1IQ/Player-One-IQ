import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-overlay text-gray-300 ring-white/10",
  accent: "bg-accent/15 text-accent-light ring-accent/30",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  muted: "bg-white/5 text-gray-500 ring-white/5",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
