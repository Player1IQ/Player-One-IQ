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
}

export function CreatorRosterTable({ creators }: CreatorRosterTableProps) {
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
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (creators.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised">
        <p className="text-sm font-medium text-gray-300">No creators yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Add your first creator to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
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
                <th className="px-6 py-3.5 font-medium text-gray-400">
                  Actions
                </th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreatorFormModal
        open={!!editingCreator}
        onClose={() => setEditingCreator(null)}
        creator={editingCreator}
      />
    </>
  );
}
