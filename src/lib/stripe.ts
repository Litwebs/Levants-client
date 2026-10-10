import { loadStripe } from "@stripe/stripe-js";
import { isUat } from "./environment";
export function loadStorefrontStripe(key: string) {
  if (isUat && !key.startsWith("pk_test_")) {
    throw new Error("UAT payments require a Stripe sandbox key");
  }
  return loadStripe(key);
}
