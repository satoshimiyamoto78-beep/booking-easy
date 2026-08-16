import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";
import { ArrowRight, Sparkles } from "lucide-react";

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
      <section
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--brand) 8%, var(--paper)), var(--paper))",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--brand)" }}
          >
            {business.tagline ?? business.name}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Book your next visit
            <br />
            in under a minute
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-base sm:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Browse services, pick your favorite specialist, and reserve a time that works —
            all online with {business.name}.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={`/${slug}/book`} className="btn btn-primary">
              Book an appointment
              <ArrowRight size={16} />
            </Link>
            <Link href={`/${slug}/services`} className="btn btn-secondary">
              View services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        {CATEGORIES.map((category) => {
          const categoryServices = services.filter((s) => s.category === category).slice(0, 3);
          if (categoryServices.length === 0) return null;

          return (
            <div key={category} className="mb-16 last:mb-0">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {formatCategory(category)}
                </h2>
                <Link
                  href={`/${slug}/services`}
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  See all
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                {categoryServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/${slug}/book?service=${service.id}`}
                    className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    <div
                      className="relative flex h-36 items-center justify-center overflow-hidden"
                      style={{ background: "color-mix(in srgb, var(--brand) 10%, var(--surface))" }}
                    >
                      {service.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={service.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Sparkles size={26} style={{ color: "var(--brand)" }} />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.description && (
                        <p
                          className="mt-1 line-clamp-2 text-sm"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {service.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span style={{ color: "var(--text-tertiary)" }}>
                          {formatDuration(service.durationMinutes)}
                        </span>
                        <span className="font-semibold" style={{ color: "var(--brand)" }}>
                          {formatPrice(service.priceCents)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {staff.length > 0 && (
        <section style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface)" }} className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Meet the team</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {staff.map((member) => (
                <div key={member.id} className="text-center">
                  {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="mx-auto h-24 w-24 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div
                      className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-xl font-semibold"
                      style={{
                        background: "color-mix(in srgb, var(--brand) 12%, var(--surface))",
                        color: "var(--brand)",
                      }}
                    >
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                  )}
                  <p className="mt-4 font-medium">{member.name}</p>
                  {member.title && (
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {member.title}
                    </p>
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
