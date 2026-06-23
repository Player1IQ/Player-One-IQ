"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import {
  type TeamMember,
  type TeamRole,
  roleLabels,
  getTeamStats,
} from "@/lib/team";
import type { Creator } from "@/lib/creators";
import { TeamNav } from "./TeamNav";
import { TeamSummaryCards, type TeamStatusFilter } from "./TeamSummaryCards";
import { TeamTable } from "./TeamTable";
import { InviteTeamMemberModal } from "./InviteTeamMemberModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const selectClassName =
  "rounded-xl border border-white/[0.08] bg-surface-raised/80 px-3 py-2.5 text-sm text-gray-200 backdrop-blur-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30";

const quickFilters: Array<{ value: TeamStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending invites" },
];

import type { Sponsor } from "@/lib/sponsors";

interface TeamPageClientProps {
  members: TeamMember[];
  creators: Creator[];
  sponsors: Sponsor[];
  canManageTeam: boolean;
  currentUserRole: TeamRole | null;
}

export function TeamPageClient({
  members,
  creators,
  sponsors,
  canManageTeam,
  currentUserRole,
}: TeamPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>("all");
  const stats = getTeamStats(members);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        roleLabels[member.role].toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          member.status === "active" &&
          !member.isInvitation) ||
        (statusFilter === "pending" &&
          (member.status === "pending" || member.isInvitation));

      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="animate-fade-in space-y-6">
      <TeamNav />

      <TeamSummaryCards
        total={stats.total}
        activeCount={stats.activeCount}
        pendingCount={stats.pendingCount}
        assignedRolesCount={stats.assignedRolesCount}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {!canManageTeam ? (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
          You have view-only access to the team roster. Owners and admins can
          invite members and manage roles.
        </p>
      ) : null}

      {canManageTeam && stats.pendingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-100">
              {stats.pendingCount} pending invite
              {stats.pendingCount === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              Resend links or revoke invites that are no longer needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            View pending
          </button>
        </div>
      ) : null}

      {canManageTeam && members.length > 0 && stats.pendingCount === 0 ? (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
          All team members are active — no pending invitations.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TeamStatusFilter)
            }
            className={selectClassName}
          >
            <option value="all">All members</option>
            <option value="active">Active</option>
            <option value="pending">Pending invites</option>
          </select>
          {canManageTeam ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter.value
                  ? "border-accent/40 bg-accent/15 text-accent-light"
                  : "border-white/[0.08] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
              )}
            >
              {filter.label}
              {filter.value === "active" && stats.activeCount > 0 ? (
                <span className="ml-1.5 text-emerald-400">
                  ({stats.activeCount})
                </span>
              ) : null}
              {filter.value === "pending" && stats.pendingCount > 0 ? (
                <span className="ml-1.5 text-amber-400">
                  ({stats.pendingCount})
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <Link
          href="/team/permissions"
          className="text-sm text-accent-light hover:text-white"
        >
          View role permissions →
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            members.length === 0 ? "No team members yet" : "No matching members"
          }
          description={
            members.length === 0
              ? canManageTeam
                ? "Invite colleagues to collaborate on creators, sponsors, and contracts."
                : "Your organization has not added team members yet."
              : "Try a different search or status filter."
          }
          action={
            canManageTeam && members.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Invite Member
              </Button>
            ) : hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-sm text-accent-light hover:text-white"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-300">{filtered.length}</span>{" "}
            of {members.length} members
          </p>
          <TeamTable
            members={filtered}
            creators={creators}
            sponsors={sponsors}
            canManageTeam={canManageTeam}
            currentUserRole={currentUserRole}
          />
        </>
      )}

      {canManageTeam ? (
        <InviteTeamMemberModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creators={creators}
          sponsors={sponsors}
        />
      ) : null}
    </div>
  );
}
