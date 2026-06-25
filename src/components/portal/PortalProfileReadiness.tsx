"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import type { ProfileReadiness } from "@/lib/creators/portal-benefits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PortalProfileReadinessProps {
  readiness: ProfileReadiness;
}

export function PortalProfileReadiness({ readiness }: PortalProfileReadinessProps) {
  const { score, items } = readiness;
  const incompleteItems = items.filter((item) => !item.done);

  if (score >= 100) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-amber-400" />
          Profile setup
        </CardTitle>
        <CardDescription>
          Complete these steps to get the most from your creator portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">Readiness</span>
            <span className="font-medium text-gray-200">{score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-accent transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <ul className="space-y-2">
          {incompleteItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm transition-colors hover:border-accent/20 hover:bg-white/[0.04]",
                  item.done ? "text-gray-400" : "text-gray-200"
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-gray-500" />
                )}
                <span className={item.done ? "line-through" : undefined}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
