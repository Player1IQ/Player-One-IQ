import { getAiUsageSummary } from "@/lib/subscription/queries";
import { assistantDefinitions } from "./assistants";

export async function getAiDashboardData() {
  const usage = await getAiUsageSummary();

  return {
    assistants: assistantDefinitions,
    usage,
  };
}
