"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Creator } from "@/lib/creators";
import { formatCreatorDate } from "@/lib/creators";
import { deleteCreator } from "@/app/creators/actions";
import { CreatorAvatar } from "./CreatorAvatar";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";
import { CreatorFormModal } from "./CreatorFormModal";

interface CreatorProfileProps {
  creator: Creator;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function CreatorProfile({ creator }: CreatorProfileProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Remove ${creator.name} from your roster? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteCreator(creator.id);
    if ("error" in result && result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/creators");
    router.refresh();
  }

  const primaryHandle = creator.socialHandles.find(
    (h) => h.platform === creator.primaryPlatform
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/creators"
          className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Creators
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-accent/30 hover:text-accent-light"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-5 rounded-xl border border-border bg-surface-raised p-6">
        <CreatorAvatar
          initials={creator.avatarInitials}
          color={creator.avatarColor}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{creator.name}</h2>
            <StatusBadge status={creator.status} />
          </div>
          {primaryHandle && (
            <p className="mt-1 text-accent-light">{primaryHandle.handle}</p>
          )}
          <div className="mt-3">
            <PlatformBadge platform={creator.primaryPlatform} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Creator Information">
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm text-gray-200">
                  {creator.email ?? "—"}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <dt className="text-xs text-gray-500">Added</dt>
                <dd className="text-sm text-gray-200">
                  {formatCreatorDate(creator.createdAt)}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Primary Platform</dt>
              <dd className="mt-1">
                <PlatformBadge platform={creator.primaryPlatform} />
              </dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Social Handles"
          description="Connected platform handles"
        >
          {creator.socialHandles.length === 0 ? (
            <p className="text-sm text-gray-500">No social handles added.</p>
          ) : (
            <ul className="space-y-3">
              {creator.socialHandles.map((handle, i) => (
                <li
                  key={`${handle.platform}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3"
                >
                  <PlatformBadge platform={handle.platform} />
                  <p className="text-sm font-medium text-gray-200">
                    {handle.handle}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Notes" description="Internal notes and context">
        <div className="rounded-lg border border-border-subtle bg-surface px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-300">
            {creator.notes?.trim() || "No notes yet."}
          </p>
        </div>
      </Section>

      <CreatorFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        creator={creator}
      />
    </div>
  );
}
