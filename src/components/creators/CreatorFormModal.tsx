"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import {
  type Creator,
  type CreatorInput,
  type CreatorStatus,
  type Platform,
  platforms,
  creatorStatuses,
  type SocialHandle,
} from "@/lib/creators";
import { presenceLabels, presenceStatuses } from "@/lib/presence/types";
import { createCreator, updateCreator, uploadCreatorAvatar, removeCreatorAvatar } from "@/app/creators/actions";

interface CreatorFormModalProps {
  open: boolean;
  onClose: () => void;
  creator?: Creator | null;
}

const emptyHandle = (): SocialHandle => ({
  platform: "YouTube",
  handle: "",
});

function creatorToInput(creator: Creator): CreatorInput {
  return {
    name: creator.name,
    email: creator.email ?? "",
    primaryPlatform: creator.primaryPlatform,
    status: creator.status,
    availabilityStatus: creator.availabilityStatus,
    socialHandles:
      creator.socialHandles.length > 0
        ? creator.socialHandles
        : [emptyHandle()],
    notes: creator.notes ?? "",
  };
}

const defaultInput = (): CreatorInput => ({
  name: "",
  email: "",
  primaryPlatform: "YouTube",
  status: "pending",
  availabilityStatus: "inactive",
  socialHandles: [emptyHandle()],
  notes: "",
});

export function CreatorFormModal({
  open,
  onClose,
  creator,
}: CreatorFormModalProps) {
  const router = useRouter();
  const isEdit = !!creator;
  const [form, setForm] = useState<CreatorInput>(defaultInput());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(creator ? creatorToInput(creator) : defaultInput());
      setError("");
      setAvatarFile(null);
      setRemoveAvatar(false);
    }
  }, [open, creator]);

  if (!open) return null;

  function updateHandle(index: number, patch: Partial<SocialHandle>) {
    setForm((prev) => ({
      ...prev,
      socialHandles: prev.socialHandles.map((h, i) =>
        i === index ? { ...h, ...patch } : h
      ),
    }));
  }

  function addHandle() {
    setForm((prev) => ({
      ...prev,
      socialHandles: [...prev.socialHandles, emptyHandle()],
    }));
  }

  function removeHandle(index: number) {
    setForm((prev) => ({
      ...prev,
      socialHandles: prev.socialHandles.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: CreatorInput = {
      ...form,
      socialHandles:
        form.socialHandles.length > 0 ? form.socialHandles : [],
    };

    const result = isEdit
      ? await updateCreator(creator!.id, payload)
      : await createCreator(payload);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const creatorId = isEdit ? creator!.id : ("id" in result ? result.id : null);

    if (creatorId && removeAvatar && isEdit) {
      const removeResult = await removeCreatorAvatar(creatorId);
      if ("error" in removeResult && removeResult.error) {
        setError(removeResult.error);
        setLoading(false);
        return;
      }
    }

    if (creatorId && avatarFile) {
      const avatarFormData = new FormData();
      avatarFormData.set("file", avatarFile);
      const avatarResult = await uploadCreatorAvatar(creatorId, avatarFormData);
      if ("error" in avatarResult && avatarResult.error) {
        setError(avatarResult.error);
        setLoading(false);
        return;
      }
    }

    onClose();
    router.refresh();
    if (!isEdit && creatorId) {
      router.push(`/creators/${creatorId}`);
    }
    setLoading(false);
  }

  const previewInitials =
    form.name.trim().length > 0
      ? form.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("") || "?"
      : creator?.avatarInitials ?? "?";

  const previewColor = creator?.avatarColor ?? "from-violet-500 to-purple-600";
  const previewUrl =
    removeAvatar ? null : creator?.avatarUrl ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-raised px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Creator" : "Add Creator"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Profile photo
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-border">
                {avatarFile ? (
                  <img
                    src={URL.createObjectURL(avatarFile)}
                    alt="Selected avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Creator avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-xl font-semibold text-white ${previewColor}`}>
                    {previewInitials}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-surface-overlay">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setAvatarFile(file);
                      if (file) setRemoveAvatar(false);
                    }}
                  />
                  {previewUrl || avatarFile ? "Replace photo" : "Upload photo"}
                </label>
                {(previewUrl || avatarFile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setRemoveAvatar(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              JPEG, PNG, WebP, or GIF up to 2 MB.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Creator Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="creator@email.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Primary Platform
              </label>
              <select
                value={form.primaryPlatform}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryPlatform: e.target.value as Platform,
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as CreatorStatus,
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {creatorStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Availability
              </label>
              <select
                value={form.availabilityStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availabilityStatus: e.target.value as typeof form.availabilityStatus,
                  })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {presenceStatuses.map((s) => (
                  <option key={s} value={s}>
                    {presenceLabels[s]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Shown on the roster and creator profile for your team.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Social Handles
              </label>
              <button
                type="button"
                onClick={addHandle}
                className="inline-flex items-center gap-1 text-xs text-accent-light hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add handle
              </button>
            </div>
            <div className="space-y-2">
              {form.socialHandles.map((handle, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={handle.platform}
                    onChange={(e) =>
                      updateHandle(index, {
                        platform: e.target.value as Platform,
                      })
                    }
                    className="w-32 shrink-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-gray-200"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={handle.handle}
                    onChange={(e) =>
                      updateHandle(index, { handle: e.target.value })
                    }
                    placeholder="@handle"
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600"
                  />
                  {form.socialHandles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHandle(index)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Internal notes about this creator..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Creator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
