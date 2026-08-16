import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PLANS } from "@/lib/billing/plans";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const initialTier = PLANS.some((p) => p.tier === tier) ? tier! : PLANS[0].tier;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-tight">Create your business</h1>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            Set up your booking site in a couple of minutes.
          </p>
          <div className="mt-8">
            <SignupForm plans={PLANS} initialTier={initialTier} />
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
