import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ArrowRight, CalendarClock, Palette, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Booking that runs itself",
    description:
      "Clients pick a service, a specialist, and a time — no calls, no back-and-forth, no double-booked chairs.",
  },
  {
    icon: Palette,
    title: "Your brand, not ours",
    description:
      "A custom accent color, your logo, and photo-driven service pages that feel like your studio, not a template.",
  },
  {
    icon: ShieldCheck,
    title: "Built for every team size",
    description:
      "One practitioner or a full multi-location team — staff schedules, time off, and permissions scale with you.",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--brand) 8%, var(--paper)), var(--paper))",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <p
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--brand)" }}
            >
              Booking software for barbershops, spas &amp; salons
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              Your own booking site,
              <br />
              live in minutes
            </h1>
            <p
              className="mx-auto mt-5 max-w-xl text-base sm:text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Give your clients a beautiful way to book online, and give your team a dashboard
              that actually feels good to use.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn btn-primary">
                Get started
                <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                View pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card p-6">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--brand) 12%, var(--surface))", color: "var(--brand)" }}
                >
                  <feature.icon size={20} />
                </span>
                <h3 className="mt-5 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface)" }}
          className="py-20"
        >
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to stop booking by text message?
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              Set up your business in a few minutes. No credit card surprises, cancel anytime.
            </p>
            <Link href="/signup" className="btn btn-primary mt-7">
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
