import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PLANS } from "@/lib/billing/plans";
import { formatPrice } from "@booking-easy/shared";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Simple, transparent pricing</h1>
            <p className="mx-auto mt-3 max-w-lg" style={{ color: "var(--text-secondary)" }}>
              One flat monthly price per plan. No booking fees, no surprises. Cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan, i) => {
              const isPopular = i === 1;
              return (
                <div
                  key={plan.tier}
                  className={isPopular ? "card-raised p-6" : "card p-6"}
                  style={isPopular ? { borderColor: "var(--brand)" } : undefined}
                >
                  {isPopular && (
                    <span className="badge badge-accent mb-3" style={{ background: "color-mix(in srgb, var(--brand) 14%, var(--surface))", color: "var(--brand)" }}>
                      <span className="badge-dot" />
                      Most popular
                    </span>
                  )}
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {plan.tagline}
                  </p>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">
                    {formatPrice(plan.priceCents)}
                    <span className="text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
                      {" "}
                      / month
                    </span>
                  </p>
                  <Link
                    href={`/signup?tier=${plan.tier}`}
                    className={isPopular ? "btn btn-primary mt-6 w-full" : "btn btn-secondary mt-6 w-full"}
                  >
                    Get started
                  </Link>
                  <ul className="mt-6 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
