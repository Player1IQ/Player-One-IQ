import type { BillingInterval, PlanCode } from "@/lib/subscription/types";

/** Test-mode Price IDs from migration 021. Used when STRIPE_SECRET_KEY is sk_test_. */
export const TEST_STRIPE_PRICE_IDS: Partial<
  Record<PlanCode, Record<BillingInterval, string>>
> = {
  creator_pro: {
    monthly: "price_1ThuXdHRtLHXdGBBFA4vL7i5",
    yearly: "price_1ThuZKHRtLHXdGBBE1hjVhGy",
  },
  agency: {
    monthly: "price_1ThuWNHRtLHXdGBBlsPAm8aD",
    yearly: "price_1ThucaHRtLHXdGBBVozTY3Zu",
  },
  agency_pro: {
    monthly: "price_1ThuaGHRtLHXdGBBKUP8b4Hj",
    yearly: "price_1ThuamHRtLHXdGBBsuwvu8fI",
  },
  sponsor_pro: {
    monthly: "price_1ThubXHRtLHXdGBBWKYsvvt5",
    yearly: "price_1Thuc0HRtLHXdGBBpsBSiz5I",
  },
};

export function findPlanCodeForTestStripePriceId(
  priceId: string
): PlanCode | null {
  for (const [code, intervals] of Object.entries(TEST_STRIPE_PRICE_IDS)) {
    if (
      intervals?.monthly === priceId ||
      intervals?.yearly === priceId
    ) {
      return code as PlanCode;
    }
  }
  return null;
}
