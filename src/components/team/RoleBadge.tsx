import { type TeamRole, roleLabels, getRoleColor } from "@/lib/team";

interface RoleBadgeProps {
  role: TeamRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${getRoleColor(role)}`}
    >
      {roleLabels[role]}
    </span>
  );
}
