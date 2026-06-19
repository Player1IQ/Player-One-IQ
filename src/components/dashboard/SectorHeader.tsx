import { cn } from "@/lib/utils";

interface SectorHeaderProps {
  sector: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectorHeader({
  sector,
  title,
  description,
  action,
  className,
}: SectorHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent-light/80">
          {sector}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
