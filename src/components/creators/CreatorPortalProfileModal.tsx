"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import type { Creator, Platform, SocialHandle } from "@/lib/creators";
import { platforms } from "@/lib/creators";
import {
  creatorToPortalProfileInput,
  type CreatorPortalProfileInput,
} from "@/lib/creators/portal-profile";
import { updateCreatorPortalProfile } from "@/app/portal/profile-actions";
import { uploadCreatorAvatar } from "@/app/creators/actions";

interface CreatorPortalProfileModalProps {
  open: boolean;
  onClose: () => void;
  creator: Creator;
}

const emptyHandle = (): SocialHandle => ({
  platform: "YouTube",
  handle: "",
});

export function CreatorPortalProfileModal({
  open,
  onClose,
  creator,
}: CreatorPortalProfileModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreatorPortalProfileInput>(
    creatorToPortalProfileInput(creator)
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setForm(creatorToPortalProfileInput(creator));
      setError("");
      setAvatarFile(null);
    }
  }, [open, creator]);

  if (!open) return null;

  function updateHandle(index: number, patch: Partial<SocialHandle>) {
    setForm((prev) => ({
      ...prev,
      socialHandles: prev.socialHandles.map((handle, i) =>
        i === index ? { ...handle, ...patch } : handle
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await updateCreatorPortalProfile(creator.id, form);
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (avatarFile) {
      const avatarForm = new FormData();
      avatarForm.set("file", avatarFile);
      const avatarResult = await uploadCreatorAvatar(creator.id, avatarForm);
      if ("error" in avatarResult && avatarResult.error) {
        setError(avatarResult.error);
        setLoading(false);
        return;
      }
    }

    onClose();
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close profile editor"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface-raised p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit your profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update how sponsors see you on the platform
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-300">Display name</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2.5 text-sm text-gray-200"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-gray-300">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2.5 text-sm text-gray-200"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-gray-300">Primary platform</span>
            <select
              value={form.primaryPlatform}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  primaryPlatform: event.target.value as Platform,
                }))
              }
              className="w-full rounded-xl border border-white/[0.08] bg-surface px-3 py-2.5 text-sm text-gray-200"
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-sm text-gray-300">Social handles</span>
            {form.socialHandles.map((handle, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={handle.platform}
                  onChange={(event) =>
                    updateHandle(index, {
                      platform: event.target.value as Platform,
                    })
                  }
                  className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-gray-200"
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <input
                  value={handle.handle}
                  onChange={(event) =>
                    updateHandle(index, { handle: event.target.value })
                  }
                  placeholder="@handle"
                  className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-surface px-3 py-2 text-sm text-gray-200"
                />
                {form.socialHandles.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        socialHandles: prev.socialHandles.filter(
                          (_, i) => i !== index
                        ),
                      }))
                    }
                    className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  socialHandles: [...prev.socialHandles, emptyHandle()],
                }))
              }
              className="inline-flex items-center gap-1.5 text-sm text-accent-light hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add handle
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-gray-300">Profile photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setAvatarFile(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-gray-400"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
