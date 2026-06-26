"use client";

import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ScheduleEvent } from "@/lib/schedule";
import { scheduleEventTypeLabels } from "@/lib/schedule";

interface TodayScheduleCardProps {
  events: ScheduleEvent[];
  scheduleHref?: string;
  title?: string;
  description?: string;
}

export function TodayScheduleCard({
  events,
  scheduleHref = "/schedule",
  title = "Today's schedule",
  description = "Events and blocks for today",
}: TodayScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Link
            href={scheduleHref}
            className="flex items-center gap-1 text-xs font-medium text-accent-light hover:text-white"
          >
            Open calendar
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nothing scheduled today"
            description="Your calendar is clear for today"
            className="min-h-[10rem]"
          />
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={scheduleHref}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/20"
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-200">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {event.timeRangeDisplay}
                      {!event.isBlock && (
                        <span className="text-gray-600">
                          {" "}
                          · {scheduleEventTypeLabels[event.eventType]}
                        </span>
                      )}
                    </p>
                    {event.location ? (
                      <p className="mt-0.5 truncate text-xs text-gray-600">
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
