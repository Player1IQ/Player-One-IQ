"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Creator } from "@/lib/creators";
import { formatCreatorDate } from "@/lib/creators";
import { deleteCreator } from "@/app/creators/actions";
import { CreatorAvatar } from "./CreatorAvatar";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";
import { CreatorFormModal } from "./CreatorFormModal";

interface CreatorRosterTableProps {
  creators: Creator[];
  canWrite?: boolean;
}

export function CreatorRosterTable({
  creators,
  canWrite = true,
}: CreatorRosterTableProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your roster? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    const result = await deleteCreator(id);
    setDeletingId(null);
    setOpenMenu(null);
    if ("error" in result && result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creators/${creator.id}`}
            className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-surface-raised/80 p-4 transition-colors hover:border-accent/30"
          >
            <CreatorAvatar
              initials={creator.avatarInitials}
              color={creator.avatarColor}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-100">{creator.name}</p>
                  {creator.email ? (
                    <p className="mt-0.5 text-xs text-gray-500">{creator.email}</p>
                  ) : null}
                </div>
                <StatusBadge status={creator.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PlatformBadge platform={creator.primaryPlatform} />
                <span className="text-xs text-gray-500">
                  Added {formatCreatorDate(creator.createdAt)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised/80 shadow-card backdrop-blur-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-overlay/50">
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Profile
                </th>
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Creator Name
                </th>
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Primary Platform
                </th>
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Added
                </th>
                {canWrite && (
                  <th className="px-6 py-3.5 font-medium text-gray-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {creators.map((creator) => (
                <tr
                  key={creator.id}
                  className="transition-colors hover:bg-surface-overlay/40"
                >
                  <td className="px-6 py-4">
                    <Link href={`/creators/${creator.id}`}>
                      <CreatorAvatar
                        initials={creator.avatarInitials}
                        color={creator.avatarColor}
                        size="sm"
                      />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/creators/${creator.id}`}
                      className="group block"
                    >
                      <p className="font-medium text-gray-200 group-hover:text-accent-light">
                        {creator.name}
                      </p>
                      {creator.email && (
                        <p className="text-xs text-gray-500">{creator.email}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <PlatformBadge platform={creator.primaryPlatform} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={creator.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {formatCreatorDate(creator.createdAt)}
                  </td>
                  {canWrite && (
                    <td className="relative px-6 py-4">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === creator.id ? null : creator.id
                          )
                        }
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
                        disabled={deletingId === creator.id}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {openMenu === creator.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenu(null)}
                          />
                          <div className="absolute right-6 top-12 z-20 w-44 rounded-lg border border-border bg-surface-overlay py-1 shadow-xl">
                            <Link
                              href={`/creators/${creator.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                              onClick={() => setOpenMenu(null)}
                            >
                              <Eye className="h-4 w-4" />
                              View Profile
                            </Link>
                            <button
                              onClick={() => {
                                setEditingCreator(creator);
                                setOpenMenu(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-accent/10 hover:text-accent-light"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(creator.id, creator.name)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canWrite ? (
        <CreatorFormModal
          open={!!editingCreator}
          onClose={() => setEditingCreator(null)}
          creator={editingCreator}
        />
      ) : null}
    </>
  );
}
