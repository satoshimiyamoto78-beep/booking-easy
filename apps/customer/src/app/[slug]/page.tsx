import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";

export const dynamic = "force-dynamic";

const CATEGORIES = ["BARBER", "SPA", "SALON"] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: business.id, active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.staff.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
      take: 4,
    }),
  ]);

  return (
    <div>
      <section className="border-b border-neutral-200 bg-gradient-to-b from-[var(--brand)]/10 to-white dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--brand)]">
            {business.tagline ?? "Book online"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Look sharp. Feel renewed.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-neutral-600 dark:text-neutral-400">
            One studio for haircuts, massages, facials, and color — book your
            next appointment in under a minute.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href={`/${slug}/book`}
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand)] hover:text-neutral-950 dark:bg-white dark:text-neutral-900"
            >
              Book an appointment
            </Link>
            <Link
              href={`/${slug}/services`}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-neutral-700"
            >
              View services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {CATEGORIES.map((category) => {
          const categoryServices = services
            .filter((s) => s.category === category)
            .slice(0, 3);
          if (categoryServices.length === 0) return null;

          return (
            <div key={category} className="mb-14 last:mb-0">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold">{formatCategory(category)}</h2>
                <Link
                  href={`/${slug}/services`}
                  className="text-sm font-medium text-[var(--brand)] hover:underline"
                >
                  See all
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
                  >
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="font-semibold">{formatPrice(service.priceCents)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {staff.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold">Meet the team</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {staff.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand)]/12 text-xl font-semibold text-[var(--brand)]">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <p className="mt-3 font-medium">{member.name}</p>
                  {member.title && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{member.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
