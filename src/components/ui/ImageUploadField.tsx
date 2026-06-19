"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/storage/images";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  currentUrl?: string | null;
  previewInitials: string;
  previewColor: string;
  previewShape?: "circle" | "rounded";
  disabled?: boolean;
  onUpload: (formData: FormData) => Promise<{ error?: string; url?: string }>;
  onRemove?: () => Promise<{ error?: string }>;
}

export function ImageUploadField({
  label,
  description,
  currentUrl,
  previewInitials,
  previewColor,
  previewShape = "circle",
  disabled = false,
  onUpload,
  onRemove,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const displayUrl = previewUrl ?? currentUrl ?? null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.set("file", file);

    const result = await onUpload(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setPreviewUrl(null);
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (result.url) {
      setPreviewUrl(result.url);
    }

    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!onRemove || disabled) return;

    setError("");
    setLoading(true);

    const result = await onRemove();
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setPreviewUrl(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">
        {label}
      </label>
      {description ? (
        <p className="mb-3 text-xs text-gray-500">{description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          imageUrl={displayUrl}
          initials={previewInitials}
          color={previewColor}
          size="lg"
          shape={previewShape}
          alt={label}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {displayUrl ? "Replace image" : "Upload image"}
          </button>

          {displayUrl && onRemove ? (
            <button
              type="button"
              disabled={disabled || loading}
              onClick={handleRemove}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        disabled={disabled || loading}
        onChange={handleFileChange}
      />

      <p className="mt-2 text-xs text-gray-500">
        JPEG, PNG, WebP, or GIF up to {Math.round(MAX_IMAGE_SIZE_BYTES / 1024 / 1024)} MB.
      </p>

      {error ? (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
