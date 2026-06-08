import type { ActivityLogEntry } from "@/lib/team";
import { TeamNav } from "./TeamNav";
import { PermissionMatrix } from "./PermissionMatrix";
import { ActivityLog } from "./ActivityLog";

interface PermissionsPageClientProps {
  activity: ActivityLogEntry[];
}

export function PermissionsPageClient({
  activity,
}: PermissionsPageClientProps) {
  return (
    <>
      <TeamNav />
      <PermissionMatrix />
      <div className="mt-8">
        <ActivityLog entries={activity} />
      </div>
    </>
  );
}
