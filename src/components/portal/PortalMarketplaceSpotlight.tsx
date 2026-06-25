"use client";

import Link from "next/link";
import { Briefcase, ExternalLink, Store } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface PortalMarketplaceSpotlightProps {
  opportunities: Opportunity[];
  marketplaceCount: number;
}

export function PortalMarketplaceSpotlight({
  opportunities,
  marketplaceCount,
}: PortalMarketplaceSpotlightProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-violet-400" />
          Open marketplace
        </CardTitle>
        <CardDescription>
          Sponsorship opportunities from brands outside your agency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {opportunities.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-gray-600" />
            <p className="mt-3 text-sm text-gray-400">
              {marketplaceCount === 0
                ? "No marketplace listings right now. Check back soon or browse your agency opportunities."
                : "Browse the open marketplace to discover new sponsorship deals."}
            </p>
            <Link
              href="/opportunities?tab=marketplace"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-accent/40 hover:text-accent-light"
            >
              Browse marketplace
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {opportunities.map((opportunity) => (
                <li key={opportunity.id}>
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20 hover:bg-white/[0.04]"
                  >
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      {opportunity.sponsorName ?? "Open sponsor"}
                    </p>
                    <p className="mt-1 font-medium text-gray-200">
                      {opportunity.title}
                    </p>
                    {opportunity.budgetDisplay ? (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Budget {opportunity.budgetDisplay}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/opportunities?tab=marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white"
            >
              Browse all {marketplaceCount} marketplace listings
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
