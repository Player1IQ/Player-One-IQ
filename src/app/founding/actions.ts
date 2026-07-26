"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendFoundingApplicationNotification } from "@/lib/email/founding-application";
import type { FoundingApplicationInput } from "@/lib/founding/types";
import { REVENUE_SOURCE_OPTIONS } from "@/lib/founding/types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateInput(input: FoundingApplicationInput): string | null {
  if (input.applicantType !== "creator" && input.applicantType !== "organization") {
    return "Please select whether you are applying as a creator or organization.";
  }
  if (!input.name.trim()) {
    return "Name is required.";
  }
  if (!input.email.trim() || !input.email.includes("@")) {
    return "A valid email is required.";
  }
  if (!input.biggestManagementProblem.trim()) {
    return "Please tell us about your biggest management challenge.";
  }
  if (!input.whyJoin.trim()) {
    return "Please tell us why you want to join the Founding Roster.";
  }
  if (input.applicantType === "creator") {
    const validSources = input.revenueSources.filter((s) =>
      REVENUE_SOURCE_OPTIONS.includes(s)
    );
    if (validSources.length === 0) {
      return "Select at least one revenue source option.";
    }
  }
  return null;
}

async function notifyFoundingApplication(
  input: FoundingApplicationInput
): Promise<void> {
  try {
    const result = await sendFoundingApplicationNotification(input);
    if (!result.sent) {
      console.error(
        "[founding-application] notification not sent:",
        result.error ?? "unknown error"
      );
    }
  } catch (error) {
    console.error("[founding-application] notification failed:", error);
  }
}

export async function submitFoundingApplication(
  input: FoundingApplicationInput
): Promise<{ success: true } | { error: string }> {
  try {
    const validationError = validateInput(input);
    if (validationError) {
      return { error: validationError };
    }

    const email = normalizeEmail(input.email);
    const payload = {
    applicant_type: input.applicantType,
    name: input.name.trim(),
    creator_handle: input.creatorHandle?.trim() || null,
    email,
    primary_platform: input.primaryPlatform?.trim() || null,
    other_platforms: input.otherPlatforms?.trim() || null,
    channel_links: input.channelLinks?.trim() || null,
    content_type: input.contentType?.trim() || null,
    revenue_sources:
      input.applicantType === "creator" ? input.revenueSources : [],
    biggest_management_problem: input.biggestManagementProblem.trim(),
    why_join: input.whyJoin.trim(),
    nominated_by: input.nominatedBy?.trim() || null,
    status: "pending" as const,
  };

  const service = createServiceClient();
  if (service) {
    const { data: existing } = await service
      .from("founding_roster_applications")
      .select("id")
      .eq("email", email)
      .in("status", ["pending", "reviewing"])
      .maybeSingle();

    if (existing) {
      return {
        error:
          "We already have a pending application for this email. We'll be in touch soon.",
      };
    }

    const { error } = await service
      .from("founding_roster_applications")
      .insert(payload);

    if (error) {
      if (error.code === "23505") {
        return {
          error:
            "We already have a pending application for this email. We'll be in touch soon.",
        };
      }
      return { error: "Unable to submit your application. Please try again." };
    }

    void notifyFoundingApplication(input);
    return { success: true };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Application system is not configured." };
  }

  const { error } = await supabase
    .from("founding_roster_applications")
    .insert(payload);

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "We already have a pending application for this email. We'll be in touch soon.",
      };
    }
    return { error: "Unable to submit your application. Please try again." };
  }

  void notifyFoundingApplication(input);
  return { success: true };
  } catch (error) {
    console.error("[founding-application] submit failed:", error);
    return { error: "Unable to submit your application. Please try again." };
  }
}
