"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Link2, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import {
  saveCreatorMediaKit,
  refreshCreatorMediaKitSnapshot,
  rotateCreatorMediaKitToken,
} from "@/app/media-kit/actions";
import type { MediaKitRecord, MediaKitSectionFlags } from "@/lib/media-kit/types";
import { defaultMediaKitFlags, MEDIA_KIT_BIO_MAX_LENGTH } from "@/lib/media-kit/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CreatorMediaKitCardProps {
  creatorId: string;
  initialKit: MediaKitRecord | null;
  isPortalUser?: boolean;
}

const SECTION_TOGGLES: Array<{
  key: keyof MediaKitSectionFlags;
  label: string;
  description: string;
}> = [
  {
    key: "showAudience",
    label: "Audience stats",
    description: "Follower and view totals from connected OAuth accounts",
  },
  {
    key: "showHandles",
    label: "Social handles",
    description: "Public platform usernames from this profile",
  },
  {
    key: "showHighlights",
    label: "Content highlights",
    description: "Top recent videos, streams, and posts by views",
  },
  {
    key: "showPastPartners",
    label: "Past partners",
    description: "Company names from active and completed deals only — no values or notes",
  },
  {
    key: "showContactEmail",
    label: "Contact email",
    description: "Show the profile email so brands can reach out",
  },
];

function formatUtcTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function CreatorMediaKitCard({
  creatorId,
  initialKit,
  isPortalUser = false,
}: CreatorMediaKitCardProps) {
  const [enabled, setEnabled] = useState(initialKit?.enabled ?? false);
  const [kitBio, setKitBio] = useState(initialKit?.kitBio ?? "");
  const [flags, setFlags] = useState<MediaKitSectionFlags>({
    showAudience: initialKit?.showAudience ?? defaultMediaKitFlags.showAudience,
    showHandles: initialKit?.showHandles ?? defaultMediaKitFlags.showHandles,
    showHighlights: initialKit?.showHighlights ?? defaultMediaKitFlags.showHighlights,
    showPastPartners:
      initialKit?.showPastPartners ?? defaultMediaKitFlags.showPastPartners,
    showContactEmail:
      initialKit?.showContactEmail ?? defaultMediaKitFlags.showContactEmail,
  });
  const [token, setToken] = useState(initialKit?.token ?? "");
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState(
    initialKit?.snapshotUpdatedAt ?? null
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function kitUrl(kitToken: string): string {
    return origin ? `${origin}/kit/${kitToken}` : `/kit/${kitToken}`;
  }

  function applyKit(kit: MediaKitRecord) {
    setEnabled(kit.enabled);
    setKitBio(kit.kitBio);
    setFlags({
      showAudience: kit.showAudience,
      showHandles: kit.showHandles,
      showHighlights: kit.showHighlights,
      showPastPartners: kit.showPastPartners,
      showContactEmail: kit.showContactEmail,
    });
    setToken(kit.token);
    setSnapshotUpdatedAt(kit.snapshotUpdatedAt);
  }

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await saveCreatorMediaKit(creatorId, {
        enabled,
        kitBio,
        ...flags,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      applyKit(result.kit);
      setMessage(enabled ? "Media kit saved and link is live." : "Media kit saved.");
    });
  }

  function refreshStats() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await refreshCreatorMediaKitSnapshot(creatorId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      applyKit(result.kit);
      setMessage("Audience and highlights refreshed.");
    });
  }

  function rotateLink() {
    if (
      !confirm(
        "This invalidates the current link. Anyone with the old URL will see a 404."
      )
    ) {
      return;
    }
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await rotateCreatorMediaKitToken(creatorId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setToken(result.token);
      setMessage("New link created. The previous URL no longer works.");
    });
  }

  async function copyLink() {
    if (!token || !enabled) return;
    try {
      await navigator.clipboard.writeText(kitUrl(token));
      setMessage("Link copied.");
      setError("");
    } catch {
      setError("Could not copy the link.");
    }
  }

  const lastUpdated = snapshotUpdatedAt
    ? formatUtcTimestamp(snapshotUpdatedAt)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-accent-light" />
          Media kit
        </CardTitle>
        <CardDescription>
          {isPortalUser
            ? "Share an unlisted link with brands. Anyone with the URL can view the sections you turn on — it is not listed in search."
            : "Publish an unlisted creator page for outbound pitches. Anyone with the URL can view the opted-in sections. It is not indexed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <label className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Public link</p>
            <p className="mt-1 text-xs text-gray-500">
              Off by default. Turning this on publishes the current snapshot.
            </p>
          </div>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border bg-surface-raised text-accent"
            checked={enabled}
            disabled={isPending}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </label>

        <div>
          <label htmlFor="kit-bio" className="text-sm font-medium text-white">
            Kit bio
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Shown on the public page. Separate from internal notes.
          </p>
          <textarea
            id="kit-bio"
            value={kitBio}
            maxLength={MEDIA_KIT_BIO_MAX_LENGTH}
            disabled={isPending}
            onChange={(event) => setKitBio(event.target.value)}
            rows={4}
            placeholder="Who you create for, what you cover, and how you partner with brands."
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-surface-raised/80 px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-right text-xs text-gray-600">
            {kitBio.length}/{MEDIA_KIT_BIO_MAX_LENGTH}
          </p>
        </div>

        <ul className="space-y-3">
          {SECTION_TOGGLES.map((item) => (
            <li
              key={item.key}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.description}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border bg-surface-raised text-accent"
                  checked={flags[item.key]}
                  disabled={isPending}
                  onChange={(event) =>
                    setFlags((current) => ({
                      ...current,
                      [item.key]: event.target.checked,
                    }))
                  }
                />
                <span className="sr-only">{item.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Share link</p>
            <p className="mt-1 truncate font-mono text-xs text-gray-300">
              {token && enabled ? kitUrl(token) : "Save and turn the public link on to share."}
            </p>
            {lastUpdated ? (
              <p className="mt-1 text-xs text-gray-600">Stats updated {lastUpdated}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-600">
                Refresh stats after connecting platforms so the kit has audience and highlights.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
              disabled={!enabled || !token || isPending}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={rotateLink}
              disabled={!token || isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Rotate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={!token || isPending}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh stats
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save media kit
          </Button>
          <div className="min-h-[1.25rem] text-sm">
            {message ? <p className="text-emerald-400">{message}</p> : null}
            {error ? <p className="text-red-400">{error}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
