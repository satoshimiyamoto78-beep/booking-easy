import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
if (!apiKey) throw new Error("DODO_PAYMENTS_API_KEY is required");

const client = new DodoPayments({
  bearerToken: apiKey,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
});

const PLANS = [
  { key: "STARTER", name: "Booking Easy — Starter", price: 2900 },
  { key: "PRO", name: "Booking Easy — Pro", price: 5900 },
  { key: "BUSINESS", name: "Booking Easy — Business", price: 9900 },
];

for (const plan of PLANS) {
  const product = await client.products.create({
    name: plan.name,
    tax_category: "saas",
    price: {
      type: "recurring_price",
      currency: "USD",
      price: plan.price,
      discount: 0,
      purchasing_power_parity: false,
      payment_frequency_count: 1,
      payment_frequency_interval: "Month",
      subscription_period_count: 1,
      subscription_period_interval: "Month",
    },
  });
  console.log(`DODO_PRODUCT_ID_${plan.key}=${product.product_id}`);
}
