import Link from "next/link";
import { TeamNav } from "./TeamNav";
import { PermissionMatrix } from "./PermissionMatrix";

export function PermissionsPageClient() {
  return (
    <div className="animate-fade-in space-y-6">
      <TeamNav />

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
        Nine permission areas across staff and portal roles. Portal users
        (Player, Content Creator) are scoped to a linked roster profile.{" "}
        <Link href="/team" className="font-medium text-accent-light hover:text-white">
          Back to team members
        </Link>
      </div>

      <PermissionMatrix />
    </div>
  );
}
