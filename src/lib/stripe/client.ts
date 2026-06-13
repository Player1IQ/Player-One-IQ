import Stripe from "stripe";
import { isStripeConfigured } from "./config";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}
