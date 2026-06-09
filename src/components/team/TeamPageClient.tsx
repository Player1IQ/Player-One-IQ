"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { type TeamMember, type TeamRole, getTeamStats } from "@/lib/team";
import { TeamNav } from "./TeamNav";
import { TeamSummaryCards, type TeamStatusFilter } from "./TeamSummaryCards";
import { TeamTable } from "./TeamTable";
import { InviteTeamMemberModal } from "./InviteTeamMemberModal";

interface TeamPageClientProps {
  members: TeamMember[];
  canManageTeam: boolean;
  currentUserRole: TeamRole | null;
}

export function TeamPageClient({
  members,
  canManageTeam,
  currentUserRole,
}: TeamPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>("all");
  const stats = getTeamStats(members);

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.status === "active" && !m.isInvitation) ||
      (statusFilter === "pending" && (m.status === "pending" || m.isInvitation));

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <TeamNav />

      <TeamSummaryCards
        total={stats.total}
        activeCount={stats.activeCount}
        pendingCount={stats.pendingCount}
        assignedRolesCount={stats.assignedRolesCount}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
        {canManageTeam && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-300">{filtered.length}</span> of{" "}
          {members.length} members
        </span>
        {statusFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs text-accent-light hover:border-accent/40"
          >
            Clear filter
          </button>
        )}
      </div>

      <TeamTable
        members={filtered}
        canManageTeam={canManageTeam}
        currentUserRole={currentUserRole}
      />

      <InviteTeamMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
