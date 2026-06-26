import { DashboardLayout } from "@/components/DashboardLayout";
import { SchedulePageClient } from "@/components/schedule/SchedulePageClient";
import { getScheduleParticipantOptions } from "@/app/schedule/actions";
import {
  canCreateCreatorBlocks,
  canManageOrgSchedule,
  getScheduleEventsForRange,
} from "@/lib/schedule/queries";
import { getWeekStart } from "@/lib/schedule/helpers";
import { getCurrentUserMembership } from "@/lib/permissions";
import { canAccessStaffDashboard, isCreatorPortalRole } from "@/lib/team";

export default async function SchedulePage() {
  const membership = await getCurrentUserMembership();
  const isStaff = await canManageOrgSchedule();
  const isCreatorPortal = await canCreateCreatorBlocks();

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

  const isPortalOnly =
    membership &&
    isCreatorPortalRole(membership.role) &&
    !canAccessStaffDashboard(membership.role);

  return (
    <DashboardLayout
      title="Schedule"
      description={
        isPortalOnly
          ? "Block time and view events you're invited to"
          : "Plan meetings, practice, and team availability"
      }
    >
      <SchedulePageClient
        initialEvents={events}
        rangeStartIso={rangeStart.toISOString()}
        rangeEndIso={rangeEnd.toISOString()}
        isStaff={isStaff}
        isCreatorPortal={isCreatorPortal}
        participantOptions={participantOptions}
      />
    </DashboardLayout>
  );
}
