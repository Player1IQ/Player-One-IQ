"use client";

import { useTranslations } from "next-intl";
import type { ContractStatus } from "@/lib/contracts";
import type { CreatorStatus } from "@/lib/creators";
import type {
  ApplicationStatus,
  OpportunityStatus,
} from "@/lib/opportunities";
import type { SponsorStatus } from "@/lib/sponsors";
import type { ScheduleEventType } from "@/lib/schedule";

export function useStatusLabels() {
  const t = useTranslations("status");

  return {
    contract: (status: ContractStatus) => t(`contracts.${status}`),
    creator: (status: CreatorStatus) => t(`creators.${status}`),
    opportunity: (status: OpportunityStatus) => t(`opportunities.${status}`),
    application: (status: ApplicationStatus) => t(`applications.${status}`),
    sponsor: (status: SponsorStatus) => t(`sponsors.${status}`),
    scheduleEventType: (type: ScheduleEventType) =>
      t(`schedule.eventTypes.${type}`),
  };
}
