import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBusinessBySlug } from "@/lib/business";
import { formatCategory, formatDuration, formatPrice } from "@/lib/format";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Prices and durations below. Book online and choose your preferred
        team member.
      </p>

      {CATEGORIES.map((category) => {
        const categoryServices = services.filter((s) => s.category === category);
        if (categoryServices.length === 0) return null;

        return (
          <div key={category} className="mt-12">
            <h2 className="text-xl font-semibold">{formatCategory(category)}</h2>
            <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
              {categoryServices.map((service) => (
                <li key={service.id} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {service.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-semibold">{formatPrice(service.priceCents)}</span>
                    <Link
                      href={`/${slug}/book?service=${service.id}`}
                      className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
                    >
                      Book
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
