import { DashboardLayout } from "@/components/DashboardLayout";
import { getTranslations } from "next-intl/server";
import { SchedulePageClient } from "@/components/schedule/SchedulePageClient";
import { getScheduleParticipantOptions } from "@/app/schedule/actions";
import {
  canCreateCreatorBlocks,
  canManageOrgSchedule,
  getScheduleEventsForRange,
} from "@/lib/schedule/queries";
import { getWeekStart } from "@/lib/schedule/helpers";
import { getCurrentUserMembership } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export default async function SchedulePage() {
  const supabase = await createClient();
  const membership = await getCurrentUserMembership();
  const isStaff = await canManageOrgSchedule();
  const isCreatorPortal = await canCreateCreatorBlocks();

  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const anchor = new Date();
  const rangeStart = getWeekStart(anchor);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 21);
  rangeEnd.setHours(23, 59, 59, 999);

  const [events, participantOptions] = await Promise.all([
    getScheduleEventsForRange(rangeStart, rangeEnd),
    isStaff ? getScheduleParticipantOptions() : Promise.resolve([]),
  ]);

  const t = await getTranslations("pages.schedule");

  return (
    <DashboardLayout
      title={t("title")}
      description={t("description")}
    >
      <SchedulePageClient
        initialEvents={events}
        rangeStartIso={rangeStart.toISOString()}
        rangeEndIso={rangeEnd.toISOString()}
        isStaff={isStaff}
        isCreatorPortal={isCreatorPortal}
        linkedCreatorId={membership?.linkedCreatorId ?? null}
        currentUserId={user?.id ?? null}
        participantOptions={participantOptions}
      />
    </DashboardLayout>
  );
}
