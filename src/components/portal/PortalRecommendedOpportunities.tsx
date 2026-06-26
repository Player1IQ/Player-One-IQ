"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities";
import { PlatformBadge } from "@/components/creators/PlatformBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PortalRecommendedOpportunitiesProps {
  opportunities: Opportunity[];
}

export function PortalRecommendedOpportunities({
  opportunities,
}: PortalRecommendedOpportunitiesProps) {
  if (opportunities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-300" />
          Recommended for you
        </CardTitle>
        <CardDescription>
          Open briefs matched to your platform and profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <ul className="space-y-3">
          {opportunities.map((opportunity) => (
            <li key={opportunity.id}>
              <Link
                href={`/opportunities/${opportunity.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20 hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-200">
                    {opportunity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {opportunity.sponsorName ?? "Brand brief"} ·{" "}
                    {opportunity.budgetDisplay}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={opportunity.platform} />
                    {opportunity.marketplaceListing ? (
                      <Badge variant="accent">Marketplace</Badge>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/opportunities?tab=recommended"
          className="inline-flex text-sm font-medium text-accent-light hover:text-white"
        >
          Browse recommended opportunities
        </Link>
      </CardContent>
    </Card>
  );
}
