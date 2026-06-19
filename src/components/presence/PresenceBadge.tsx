import {
  presenceDotColors,
  presenceLabels,
  presenceTextColors,
  type PresenceStatus,
} from "@/lib/presence/types";

interface PresenceBadgeProps {
  status: PresenceStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  pulse?: boolean;
}

export function PresenceBadge({
  status,
  size = "sm",
  showLabel = true,
  pulse = true,
}: PresenceBadgeProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textSize} ${presenceTextColors[status]}`}
    >
      <span className="relative flex shrink-0">
        <span
          className={`rounded-full ${dotSize} ${presenceDotColors[status]}`}
        />
        {pulse && status === "online" ? (
          <span
            className={`absolute inset-0 animate-ping rounded-full ${presenceDotColors[status]} opacity-40`}
          />
        ) : null}
      </span>
      {showLabel ? <span>{presenceLabels[status]}</span> : null}
    </span>
  );
}
