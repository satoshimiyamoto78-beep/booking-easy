import "server-only";
import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
});
