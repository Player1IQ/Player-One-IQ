"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/organization/queries";
import {
  requireTeamManageAccess,
  getCurrentUserRole,
} from "@/lib/permissions";
import {
  type TeamRole,
  invitableRoles,
  roleLabels,
} from "@/lib/team";

async function logTeamActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  organizationId: string,
  summary: string,
  detail: string,
  action: "created" | "updated" | "deleted" = "updated"
) {
  await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "team",
    entity_id: null,
    action,
    summary,
    detail,
  });
}

export async function inviteTeamMember(email: string, role: TeamRole) {
  const permError = await requireTeamManageAccess();
  if (permError) return permError;

  if (
    role === "owner" ||
    !invitableRoles.includes(role as (typeof invitableRoles)[number])
  ) {
    return { error: "Invalid role for invitation." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Email is required." };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("email", normalizedEmail)
    .eq("status", "active")
    .maybeSingle();

  if (existingMember) {
    return { error: "This user is already a team member." };
  }

  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingInvite) {
    return { error: "A pending invitation already exists for this email." };
  }

  const { data, error } = await supabase
    .from("team_invitations")
    .insert({
      organization_id: organizationId,
      email: normalizedEmail,
      role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };

  await logTeamActivity(
    supabase,
    organizationId,
    "Team invitation sent",
    `${normalizedEmail} invited as ${roleLabels[role]}`
  );

  revalidatePath("/team");
  return { token: data.token };
}

export async function updateTeamMemberRole(
  memberId: string,
  role: TeamRole
) {
  const permError = await requireTeamManageAccess();
  if (permError) return permError;

  if (
    role === "owner" ||
    !invitableRoles.includes(role as (typeof invitableRoles)[number])
  ) {
    return { error: "Invalid role." };
  }

  const currentRole = await getCurrentUserRole();
  if (currentRole === "admin" && role === "admin") {
    return { error: "Only the owner can assign admin roles." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: member, error: fetchError } = await supabase
    .from("team_members")
    .select("email, role")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !member) {
    return { error: "Team member not found." };
  }

  if (member.role === "owner") {
    return { error: "Cannot change the owner role." };
  }

  if (currentRole === "admin" && member.role === "admin") {
    return { error: "Admins cannot change other admin roles." };
  }

  const { error: updateError } = await supabase
    .from("team_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (updateError) return { error: updateError.message };

  await logTeamActivity(
    supabase,
    organizationId,
    "Team role updated",
    `${member.email}: ${roleLabels[member.role as TeamRole]} → ${roleLabels[role]}`
  );

  revalidatePath("/team");
  revalidatePath(`/team/${memberId}`);
  return { success: true };
}

export async function removeTeamMember(memberId: string) {
  const permError = await requireTeamManageAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const currentRole = await getCurrentUserRole();

  const { data: member, error: fetchError } = await supabase
    .from("team_members")
    .select("email, role, user_id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchError || !member) {
    return { error: "Team member not found." };
  }

  if (member.role === "owner") {
    return { error: "Cannot remove the organization owner." };
  }

  if (currentRole === "admin" && member.role === "admin") {
    return { error: "Admins cannot remove other admins." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === member.user_id) {
    return { error: "You cannot remove yourself." };
  }

  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (deleteError) return { error: deleteError.message };

  await logTeamActivity(
    supabase,
    organizationId,
    "Team member removed",
    member.email,
    "deleted"
  );

  revalidatePath("/team");
  return { success: true };
}

export async function revokeInvitation(invitationId: string) {
  const permError = await requireTeamManageAccess();
  if (permError) return permError;

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const organizationId = await getOrganizationId();
  if (!organizationId) return { error: "Organization not found." };

  const { data: invite, error: fetchError } = await supabase
    .from("team_invitations")
    .select("email")
    .eq("id", invitationId)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError || !invite) {
    return { error: "Invitation not found." };
  }

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) return { error: error.message };

  await logTeamActivity(
    supabase,
    organizationId,
    "Invitation revoked",
    invite.email,
    "deleted"
  );

  revalidatePath("/team");
  return { success: true };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be signed in to accept an invitation." };

  const { data: invite, error: fetchError } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (fetchError || !invite) {
    return { error: "Invitation not found." };
  }

  if (invite.status !== "pending") {
    return { error: "This invitation is no longer valid." };
  }

  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return { error: "This invitation has expired." };
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      error: `This invitation was sent to ${invite.email}. Sign in with that email to accept.`,
    };
  }

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: insertError } = await supabase.from("team_members").insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      email: user.email.toLowerCase(),
      role: invite.role,
      status: "active",
      invited_by: invite.invited_by,
      joined_at: new Date().toISOString(),
    });

    if (insertError) return { error: insertError.message };
  }

  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (updateError) return { error: updateError.message };

  await logTeamActivity(
    supabase,
    invite.organization_id,
    "Team member joined",
    `${user.email} accepted invitation`,
    "created"
  );

  revalidatePath("/team");
  revalidatePath("/");
  return { success: true };
}
