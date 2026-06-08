"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { TeamMember, ActivityLogEntry } from "@/lib/team";
import { getTeamStats } from "@/lib/team";
import { TeamNav } from "./TeamNav";
import { TeamSummaryCards } from "./TeamSummaryCards";
import { TeamTable } from "./TeamTable";
import { AddTeamMemberModal } from "./AddTeamMemberModal";
import { ActivityLog } from "./ActivityLog";

interface TeamPageClientProps {
  members: TeamMember[];
  activity: ActivityLogEntry[];
}

export function TeamPageClient({ members, activity }: TeamPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const stats = getTeamStats();

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TeamNav />

      <TeamSummaryCards
        total={stats.total}
        activeCount={stats.activeCount}
        pendingCount={stats.pendingCount}
        assignedRolesCount={stats.assignedRolesCount}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-dark"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-300">{filtered.length}</span> of{" "}
        {members.length} members
      </div>

      <TeamTable members={filtered} />

      <div className="mt-8">
        <ActivityLog entries={activity} compact />
      </div>

      <AddTeamMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
