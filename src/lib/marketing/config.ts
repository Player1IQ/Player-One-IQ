export const FOUNDING_ROSTER_PATH = "/founding";

export const SOCIAL_X_URL =
  process.env.NEXT_PUBLIC_SOCIAL_X_URL?.trim() || null;

/** Public MP4/HLS URL for the homepage founder note. Leave null to keep the silent slot (no "video coming" copy). */
export const FOUNDER_VIDEO_SRC: string | null = null;
