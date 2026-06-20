"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import type { Creator } from "@/lib/creators";
import type { CampaignCreatorAssignment } from "@/lib/campaigns/assignments";
import {
  assignCampaignCreator,
  removeCampaignCreator,
} from "@/app/campaigns/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CampaignCreatorsPanelProps {
  campaignId: string;
  assignments: CampaignCreatorAssignment[];
  creators: Creator[];
  canManage: boolean;
}

export function CampaignCreatorsPanel({
  campaignId,
  assignments,
  creators,
  canManage,
}: CampaignCreatorsPanelProps) {
  const router = useRouter();
  const [selectedCreatorId, setSelectedCreatorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const assignedIds = new Set(assignments.map((assignment) => assignment.creatorId));
  const availableCreators = creators.filter(
    (creator) => !assignedIds.has(creator.id)
  );

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCreatorId) return;

    setError("");
    setLoading(true);

    const result = await assignCampaignCreator(campaignId, selectedCreatorId);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSelectedCreatorId("");
    router.refresh();
    setLoading(false);
  }

  async function handleRemove(creatorId: string) {
    setError("");
    setLoading(true);

    const result = await removeCampaignCreator(campaignId, creatorId);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned creators</CardTitle>
        <CardDescription>
          Portal creators only see campaigns they are assigned to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No creators assigned yet. Link an opportunity or add roster members
            manually.
          </p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((assignment) => (
              <li
                key={assignment.creatorId}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <Link
                  href={`/creators/${assignment.creatorId}`}
                  className="text-sm font-medium text-gray-200 hover:text-accent-light"
                >
                  {assignment.creatorName}
                </Link>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(assignment.creatorId)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <form onSubmit={handleAssign} className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCreatorId}
              onChange={(e) => setSelectedCreatorId(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option value="">Add creator from roster</option>
              {availableCreators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={loading || !selectedCreatorId}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
