/**
 * Dev-only: provision QA accounts for schedule invite manual testing.
 *
 * Usage:
 *   npx tsx scripts/provision-schedule-qa.ts
 *   npx tsx scripts/provision-schedule-qa.ts --cleanup
 *   npx tsx scripts/provision-schedule-qa.ts --force
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const QA_ORG_NAME = "QA Schedule Agency";
const QA_CREATOR_NOTES = "QA_SCHEDULE";
const DEFAULT_PASSWORD = "ScheduleQa!2026";

const args = process.argv.slice(2);
const cleanup = args.includes("--cleanup");
const force = args.includes("--force");

if (process.env.NODE_ENV === "production" && !force) {
  console.error(
    "Refusing to run in production. Set NODE_ENV to development or pass --force."
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function buildEmails(): { staff: string; creator: string; member: string; prefix: string } {
  const base =
    process.env.QA_EMAIL_BASE?.trim() ||
    process.env.TEST_INVITE_EMAIL_TO?.trim() ||
    null;

  if (base && base.includes("@")) {
    const [local, domain] = base.split("@");
    const prefix = `${local}+qa-schedule`;
    return {
      staff: `${prefix}-staff@${domain}`,
      creator: `${prefix}-creator@${domain}`,
      member: `${prefix}-member@${domain}`,
      prefix: `${prefix}-`,
    };
  }

  const shortId = randomBytes(4).toString("hex");
  const prefix = `schedule-qa-`;
  return {
    staff: `${prefix}staff-${shortId}@example.com`,
    creator: `${prefix}creator-${shortId}@example.com`,
    member: `${prefix}member-${shortId}@example.com`,
    prefix,
  };
}

function onboardingMetadata(orgName: string, orgType: string) {
  return {
    onboarding_completed_at: new Date().toISOString(),
    onboarding_pending: false,
    organization_name: orgName,
    organization_type: orgType,
  };
}

async function listAuthUsersByEmailPrefix(
  supabase: SupabaseClient,
  prefix: string
): Promise<{ id: string; email: string }[]> {
  const matches: { id: string; email: string }[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    for (const user of users) {
      const email = user.email?.toLowerCase() ?? "";
      if (
        email.startsWith(prefix.toLowerCase()) ||
        email.includes("+qa-schedule-") ||
        email.includes("schedule-qa-")
      ) {
        matches.push({ id: user.id, email: user.email ?? "" });
      }
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return matches;
}

async function cleanupQaAccounts(supabase: SupabaseClient) {
  console.log("Cleaning up QA schedule accounts...");

  const { data: qaCreators } = await supabase
    .from("creators")
    .select("id, organization_id")
    .eq("notes", QA_CREATOR_NOTES);

  const orgIds = new Set<string>();
  for (const row of qaCreators ?? []) {
    if (row.organization_id) orgIds.add(row.organization_id);
  }

  const { data: qaOrgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", QA_ORG_NAME);

  for (const row of qaOrgs ?? []) {
    orgIds.add(row.id);
  }

  for (const orgId of orgIds) {
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);
    if (error) {
      console.warn(`Failed to delete org ${orgId}:`, error.message);
    } else {
      console.log(`Deleted organization ${orgId}`);
    }
  }

  const prefixes = ["schedule-qa-", "+qa-schedule-"];
  const allUsers: { id: string; email: string }[] = [];
  for (const prefix of prefixes) {
    const found = await listAuthUsersByEmailPrefix(supabase, prefix);
    for (const user of found) {
      if (!allUsers.some((u) => u.id === user.id)) allUsers.push(user);
    }
  }

  for (const user of allUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.warn(`Failed to delete user ${user.email}:`, error.message);
    } else {
      console.log(`Deleted auth user ${user.email}`);
    }
  }

  console.log("Cleanup complete.");
}

async function ensureSubscription(
  supabase: SupabaseClient,
  organizationId: string
) {
  const { data: existing } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing) return;

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("code", "agency_starter")
    .maybeSingle();

  if (!plan) {
    const { data: fallback } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("code", "agency")
      .maybeSingle();
    if (!fallback) {
      console.warn("No agency_starter or agency plan found; subscription not created.");
      return;
    }
    await supabase.from("organization_subscriptions").insert({
      organization_id: organizationId,
      plan_id: fallback.id,
      status: "active",
      billing_interval: "monthly",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return;
  }

  const { error } = await supabase.from("organization_subscriptions").insert({
    organization_id: organizationId,
    plan_id: plan.id,
    status: "active",
    billing_interval: "monthly",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    console.warn("Failed to insert trial subscription:", error.message);
  }
}

async function createAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, unknown>
) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  if (!data.user) throw new Error(`createUser ${email}: no user returned`);
  return data.user;
}

async function provision() {
  const supabase = createServiceClient();
  const emails = buildEmails();
  const password = DEFAULT_PASSWORD;
  const orgType = "Gaming Agency";

  console.log("Provisioning QA schedule accounts...");
  console.log("Emails:", emails);

  const owner = await createAuthUser(
    supabase,
    emails.staff,
    password,
    onboardingMetadata(QA_ORG_NAME, orgType)
  );

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      user_id: owner.id,
      name: QA_ORG_NAME,
      type: orgType,
    })
    .select("id")
    .single();

  if (orgError) throw new Error(`insert organization: ${orgError.message}`);

  const orgId = org.id;

  const { data: ownerMember } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("organization_id", orgId)
    .eq("user_id", owner.id)
    .maybeSingle();

  if (!ownerMember) {
    throw new Error("Owner team_member was not created by trigger");
  }
  if (ownerMember.role !== "owner") {
    console.warn(`Expected owner role, got ${ownerMember.role}`);
  }

  await ensureSubscription(supabase, orgId);

  const creatorUser = await createAuthUser(
    supabase,
    emails.creator,
    password,
    onboardingMetadata(QA_ORG_NAME, orgType)
  );

  const { data: creatorRow, error: creatorError } = await supabase
    .from("creators")
    .insert({
      organization_id: orgId,
      name: "QA Schedule Creator",
      email: emails.creator,
      primary_platform: "YouTube",
      social_handles: [],
      status: "active",
      notes: QA_CREATOR_NOTES,
    })
    .select("id")
    .single();

  if (creatorError) throw new Error(`insert creator: ${creatorError.message}`);

  const { error: creatorMemberError } = await supabase.from("team_members").insert({
    organization_id: orgId,
    user_id: creatorUser.id,
    email: emails.creator,
    role: "content_creator",
    linked_creator_id: creatorRow.id,
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (creatorMemberError) {
    throw new Error(`insert creator team_member: ${creatorMemberError.message}`);
  }

  const memberUser = await createAuthUser(
    supabase,
    emails.member,
    password,
    onboardingMetadata(QA_ORG_NAME, orgType)
  );

  const { error: memberError } = await supabase.from("team_members").insert({
    organization_id: orgId,
    user_id: memberUser.id,
    email: emails.member,
    role: "member",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (memberError) throw new Error(`insert member team_member: ${memberError.message}`);

  const credentials = {
    password,
    organizationId: orgId,
    organizationName: QA_ORG_NAME,
    staff: { email: emails.staff, userId: owner.id, role: "owner" },
    creator: {
      email: emails.creator,
      userId: creatorUser.id,
      role: "content_creator",
      creatorId: creatorRow.id,
    },
    member: { email: emails.member, userId: memberUser.id, role: "member" },
    cleanup: "npx tsx scripts/provision-schedule-qa.ts --cleanup",
  };

  console.log("\n✅ QA schedule accounts provisioned.\n");
  console.log(JSON.stringify(credentials, null, 2));
}

async function main() {
  const supabase = createServiceClient();

  if (cleanup) {
    await cleanupQaAccounts(supabase);
    return;
  }

  await provision();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
