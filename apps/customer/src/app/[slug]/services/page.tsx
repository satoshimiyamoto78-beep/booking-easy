import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";
import { ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORIES = ["BARBER", "SPA", "SALON"] as const;

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const services = await prisma.service.findMany({
    where: { businessId: business.id, active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const categoriesPresent = CATEGORIES.filter(
    (category) => services.filter((s) => s.category === category).length > 0,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Services</h1>
      <p className="mt-2 max-w-xl" style={{ color: "var(--text-secondary)" }}>
        Prices and durations below. Book online and choose your preferred team member.
      </p>

      {categoriesPresent.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {categoriesPresent.map((category) => (
            <a key={category} href={`#${category}`} className="badge badge-accent">
              {formatCategory(category)}
              <span style={{ opacity: 0.7 }}>
                {services.filter((s) => s.category === category).length}
              </span>
            </a>
          ))}
        </div>
      )}

      {CATEGORIES.map((category) => {
        const categoryServices = services.filter((s) => s.category === category);
        if (categoryServices.length === 0) return null;

        return (
          <div key={category} id={category} className="mt-14 scroll-mt-24 first:mt-12">
            <h2 className="text-xl font-semibold tracking-tight">{formatCategory(category)}</h2>
            <div className="mt-5 grid gap-3">
              {categoryServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/${slug}/book?service=${service.id}`}
                  className="card group flex items-center gap-4 p-4 transition-shadow hover:shadow-lg sm:p-5"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: "color-mix(in srgb, var(--brand) 10%, var(--surface))" }}
                  >
                    {service.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Sparkles size={20} style={{ color: "var(--brand)" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p
                        className="mt-0.5 truncate text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {service.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold" style={{ color: "var(--brand)" }}>
                      {formatPrice(service.priceCents)}
                    </span>
                    <ArrowRight
                      size={16}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
