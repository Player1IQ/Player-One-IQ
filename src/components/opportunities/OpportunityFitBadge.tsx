import {
  getOpportunityFitLevel,
  opportunityFitLabels,
  type OpportunityFitLevel,
} from "@/lib/opportunities/recommendations";
import type { Creator } from "@/lib/creators";
import type { Opportunity } from "@/lib/opportunities";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const fitVariants: Record<
  OpportunityFitLevel,
  "success" | "accent" | "muted"
> = {
  great: "success",
  good: "accent",
  fair: "muted",
};

interface OpportunityFitBadgeProps {
  opportunity: Opportunity;
  creator: Creator;
  className?: string;
}

export function OpportunityFitBadge({
  opportunity,
  creator,
  className,
}: OpportunityFitBadgeProps) {
  const level = getOpportunityFitLevel(opportunity, creator);

  return (
    <Badge variant={fitVariants[level]} className={cn(className)}>
      {opportunityFitLabels[level]}
    </Badge>
  );
}
