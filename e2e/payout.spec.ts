import { execSync } from "child_process";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { login } from "./helpers/auth";

type QaCredentials = {
  password: string;
  organizationId: string;
  staff: { email: string };
  sponsor: { email: string };
  contract: { id: string; name: string };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && serviceRoleKey);

let credentials: QaCredentials;

function loadCredentialsFromEnv(): QaCredentials | null {
  const staffEmail = process.env.QA_STAFF_EMAIL;
  const sponsorEmail = process.env.QA_SPONSOR_EMAIL;
  const password = process.env.QA_PAYOUT_PASSWORD;
  const organizationId = process.env.QA_ORG_ID;
  const contractId = process.env.QA_PAYOUT_CONTRACT_ID;

  if (!staffEmail || !sponsorEmail || !password || !organizationId || !contractId) {
    return null;
  }

  return {
    password,
    organizationId,
    staff: { email: staffEmail },
    sponsor: { email: sponsorEmail },
    contract: { id: contractId, name: "QA Payout Deal" },
  };
}

function provisionCredentials(): QaCredentials {
  const output = execSync("npx tsx scripts/provision-payout-qa.ts", {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  const marker = "PAYOUT_QA_CREDENTIALS_JSON";
  const markerIndex = output.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("provision-payout-qa.ts did not print credentials marker");
  }
  const jsonStart = output.indexOf("{", markerIndex);
  if (jsonStart === -1) {
    throw new Error("provision-payout-qa.ts did not print credentials JSON");
  }
  const parsed = JSON.parse(output.slice(jsonStart)) as {
    password: string;
    organizationId: string;
    staff: { email: string };
    sponsor: { email: string };
    contract: { id: string; name: string };
  };
  return {
    password: parsed.password,
    organizationId: parsed.organizationId,
    staff: { email: parsed.staff.email },
    sponsor: { email: parsed.sponsor.email },
    contract: parsed.contract,
  };
}

async function resetContractForPayoutTest(contractId: string, organizationId: string) {
  if (!supabaseUrl || !serviceRoleKey) return;
  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await sb
    .from("contract_payments")
    .delete()
    .eq("contract_id", contractId)
    .eq("organization_id", organizationId);

  await sb
    .from("contracts")
    .update({
      contract_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .eq("organization_id", organizationId);
}

test.describe("contract payout flows", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  test.beforeAll(() => {
    test.skip(!hasSupabaseEnv, "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    credentials = loadCredentialsFromEnv() ?? provisionCredentials();
  });

  test.beforeEach(async () => {
    await resetContractForPayoutTest(
      credentials.contract.id,
      credentials.organizationId
    );
  });

  test("staff completes contract and records external payment", async ({ page }) => {
    const contractPath = `/contracts/${credentials.contract.id}`;

    await login(page, credentials.staff.email, credentials.password, contractPath);
    await expect(page.locator("h1", { hasText: credentials.contract.name })).toBeVisible();

    const markCompleted = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Contract Workflow" }) })
      .getByRole("button", { name: "Mark completed" });
    await expect(markCompleted).toBeEnabled();
    await markCompleted.click();

    await expect(
      page
        .getByRole("heading", { level: 2, name: credentials.contract.name })
        .locator("..")
        .getByText("Completed")
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText("Contract payout")).toBeVisible({ timeout: 15_000 });
    const payoutSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Contract payout" }) });
    await expect(payoutSection.getByText("Ready to pay")).toBeVisible();
    await expect(payoutSection.getByText("$2,500.00")).toBeVisible();
    await expect(payoutSection.getByText("QA Payout Creator")).toBeVisible();

    await payoutSection
      .getByPlaceholder("Wire confirmation, check number, transaction ID…")
      .fill("WIRE-QA-001");
    await payoutSection.getByRole("button", { name: "Record payment" }).click();

    await expect(payoutSection.getByText("Payment recorded.")).toBeVisible({ timeout: 15_000 });
    await expect(payoutSection.getByText("Paid (external)")).toBeVisible();
    await expect(payoutSection.getByText("Reference: WIRE-QA-001")).toBeVisible();
  });

  test("sponsor portal user can record external payment", async ({ page }) => {
    const contractPath = `/contracts/${credentials.contract.id}`;

    if (!supabaseUrl || !serviceRoleKey) return;
    const sb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await sb
      .from("contracts")
      .update({
        contract_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentials.contract.id);

    await sb.from("contract_payments").insert({
      organization_id: credentials.organizationId,
      contract_id: credentials.contract.id,
      payee_type: "creator",
      payee_creator_id: (
        await sb
          .from("contracts")
          .select("creator_id")
          .eq("id", credentials.contract.id)
          .single()
      ).data?.creator_id,
      amount_cents: 250_000,
      currency: "usd",
      status: "ready",
    });

    await login(page, credentials.sponsor.email, credentials.password, contractPath);
    const payoutSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Contract payout" }) });
    await expect(payoutSection).toBeVisible();
    await expect(payoutSection.getByText("Ready to pay")).toBeVisible();

    await payoutSection.getByPlaceholder("Wire confirmation, check number, transaction ID…").fill("ACH-SP-99");
    await payoutSection.getByRole("button", { name: "Record payment" }).click();

    await expect(payoutSection.getByText("Payment recorded.")).toBeVisible({ timeout: 15_000 });
    await expect(payoutSection.getByText("Paid (external)")).toBeVisible();
    await expect(payoutSection.getByText("Reference: ACH-SP-99")).toBeVisible();
  });
});
