"use client";

import { useTranslations } from "next-intl";
import { type TeamRole, getRoleColor } from "@/lib/team";

interface RoleBadgeProps {
  role: TeamRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useTranslations("team");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${getRoleColor(role)}`}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
