import type { BillingInterval, PlanCode } from "@/lib/subscription/types";

/** Test-mode Price IDs. Used when STRIPE_SECRET_KEY is sk_test_. */
export const TEST_STRIPE_PRICE_IDS: Partial<
  Record<PlanCode, Record<BillingInterval, string>>
> = {
  creator_pro: {
    monthly: "price_1ThuXdHRtLHXdGBBFA4vL7i5",
    yearly: "price_1UM8VAHRtLHXdGBBK34Cylt7",
  },
  agency: {
    monthly: "price_1ThuWNHRtLHXdGBBlsPAm8aD",
    yearly: "price_1UM8VAHRtLHXdGBB5IpWvrU9",
  },
  agency_pro: {
    monthly: "price_1ThuaGHRtLHXdGBBKUP8b4Hj",
    yearly: "price_1UM8VAHRtLHXdGBBdk88Ylfs",
  },
  sponsor_pro: {
    monthly: "price_1ThubXHRtLHXdGBBWKYsvvt5",
    yearly: "price_1UM8VAHRtLHXdGBBNbQpuP7K",
  },
};

/** Archived yearly prices kept so existing subscriptions still map after the 20% off replacement. */
const ARCHIVED_YEARLY_PRICE_IDS: Partial<Record<PlanCode, string[]>> = {
  creator_pro: [
    "price_1ThuZKHRtLHXdGBBE1hjVhGy",
    "price_1ULlrwQZ0o65vgyLUM2bU9tk",
  ],
  agency: [
    "price_1ThucaHRtLHXdGBBVozTY3Zu",
    "price_1ULlrvQZ0o65vgyLWyAGSNjm",
  ],
  agency_pro: [
    "price_1ThuamHRtLHXdGBBsuwvu8fI",
    "price_1ULlrwQZ0o65vgyLAQghthS0",
  ],
  sponsor_pro: [
    "price_1Thuc0HRtLHXdGBBpsBSiz5I",
    "price_1ULlrwQZ0o65vgyLf7rYAPwa",
  ],
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
  for (const [code, ids] of Object.entries(ARCHIVED_YEARLY_PRICE_IDS)) {
    if (ids?.includes(priceId)) return code as PlanCode;
  }
  return null;
}
